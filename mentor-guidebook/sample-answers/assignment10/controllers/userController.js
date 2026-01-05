const prisma = require("../db/prisma");
const userSchema = require("../validation/userSchema").userSchema;
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");
const {
  googleGetUserInfo,
  generateUserPassword,
} = require("../services/userService");

const cookieFlags = (req) => {
  return {
    ...(process.env.NODE_ENV === "production" && { domain: req.hostname }), // add domain into cookie for production only
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  };
};

const setJwtCookie = (req, res, user) => {
  // Sign JWT
  const payload = { id: user.id, csrfToken: randomUUID() };
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration
  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by logon() or register()
};

const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

const createUser2 = async (req, res, next, email, name, hashedPassword) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create user account (similar to Assignment 6, but using tx instead of prisma)
      const newUser = await tx.user.create({
        data: { email, name, hashedPassword },
        select: { id: true, email: true, name: true },
      });

      // Create 3 welcome tasks using createMany
      const welcomeTaskData = [
        {
          title: "Complete your profile",
          userId: newUser.id,
          priority: "medium",
        },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" },
      ];
      await tx.task.createMany({ data: welcomeTaskData });

      // Fetch the created tasks to return them
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map((t) => t.title) },
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          priority: true,
        },
      });

      return { user: newUser, welcomeTasks };
    });
    const csrfToken = setJwtCookie(req, res, result.user);
    delete result.user.id;
    // Send response with status 201
    res.status(StatusCodes.CREATED).json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success",
      csrfToken,
    });
    return;
  } catch (err) {
    if (err.code === "P2002") {
      // send the appropriate error back -- the email was already registered
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Email already registered" });
    } else {
      return next(err); // the error handler takes care of other errors
    }
  }
};

exports.register = async (req, res, next) => {
  if (!req.body) req.body = {};
  let isPerson = false;
  if (req.body.recaptchaToken) {
    const token = req.body.recaptchaToken;
    const params = new URLSearchParams();
    params.append("secret", process.env.RECAPTCHA_SECRET);
    params.append("response", token);
    params.append("remoteip", req.ip);
    const response = await fetch(
      // might throw an error that would cause a 500 from the error handler
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        body: params.toString(),
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    const data = await response.json();
    if (data.success) isPerson = true;
    delete req.body.recaptchaToken;
  } else if (
    process.env.RECAPTCHA_BYPASS &&
    req.get("X-Recaptcha-Test") === process.env.RECAPTCHA_BYPASS
  ) {
    // might be a test environment
    isPerson = true;
  }
  if (!isPerson) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "We can't tell if you're a person or a bot." });
  }
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });

  if (error) return next(error);

  const { email, name, password } = value;

  // Hash the password before storing (using scrypt from lesson 4)
  const hashedPassword = await hashPassword(password);
  // In your register method, after validation and password hashing:
  // Do the Joi validation, so that value contains the user entry you want.
  // hash the password, and put it in value.hashedPassword
  // delete value.password as that doesn't get stored
  return createUser2(req, res, next, email, name, hashedPassword);
};

exports.logon = async (req, res) => {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: "Email and password are required" });
  }

  email = email.toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !await comparePassword(password, user.hashedPassword)) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid credentials" });
  }
  const csrfToken = setJwtCookie(req, res, user);

  res.json({
    name: user.name,
    email: user.email,
    csrfToken,
  });
};

exports.logoff = async (req, res) => {
  // Clear the global user ID for session management
  res.clearCookie("jwt", cookieFlags(req));
  res.sendStatus(StatusCodes.OK);
};

exports.show = async (req, res) => {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: {
          id: true,
          title: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json(user);
};

exports.googleLogon = async (req, res, next) => {
  if (!req.body.code) {
    // throw new Error("Required body parameter missing: 'code'.");
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "The Google authentication code was not provided." });
  }
  let googleUserInfo;
  try {
    googleUserInfo = await googleGetUserInfo(req.body.code);
  } catch {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication failed." });
  }
  if (!googleUserInfo.email || !googleUserInfo.isEmailVerified) {
    // throw new Error("The email is either missing or not verified.");
    return res.status(StatusCodes.UNAUTHORIZED).json({
      message: "Google did not include the email, or it hasn't been verified.",
    });
  }
  if (!googleUserInfo.name) {
    // throw new Error("The name is missing.");
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Google did not include the user name." });
  }

  let user = await prisma.user.findFirst({
    where: {
      email: {
        equals: googleUserInfo.email,
        mode: "insensitive",
      },
    },
  });

  if (!user) {
    const randomPassword = generateUserPassword();
    //   // TODO: notify user with generated password
    //   console.log("Creating user with a random password.");
    //   user = await createUser({
    //     name: googleUserInfo.name,
    //     email: googleUserInfo.email,
    //     password: randomPassword,
    //   });
    // }
    // const csrfToken = setJwtCookie(req, res, user);
    // return res.json({ name: user.name, email: user.email, csrfToken });
    return createUser2(
      req,
      res,
      next,
      googleUserInfo.email,
      googleUserInfo.name,
      randomPassword
    );
  } else {
    const csrfToken = setJwtCookie(req, res, user);
    res.json({ name: user.name, email: user.email, csrfToken });
  }
};
