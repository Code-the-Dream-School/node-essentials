const prisma = require("../db/prisma");
const userSchema = require("../validation/userSchema").userSchema;
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

exports.register = async (req, res, next) => {
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details,
    });
  }

  const { email, name, password } = value;

  // Hash the password before storing (using scrypt from lesson 4)
  const hashedPassword = await hashPassword(password);
  // Create new user
  let newUser;
  try {
    newUser = await prisma.user.create({
      data: { email, name, hashedPassword },
      select: { id: true, email: true, name: true },
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code == "P2002") {
      return res
        .status(400)
        .json({ message: "That email is already registered." });
    }
    return next(err);
  }

  // Store the user ID globally for session management (not secure for production)
  global.user_id = newUser.id;
  delete newUser.id;
  res.status(201).json({
    newUser,
  });
};

exports.logon = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isValidPassword = await comparePassword(password, user.hashedPassword);

  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Store user ID globally for session management (not secure for production)
  global.user_id = user.id;

  res.status(200).json({
    name: user.name,
    email: user.email,
  });
};

exports.logoff = async (req, res) => {
  // Clear the global user ID for session management
  global.user_id = null;
  res.sendStatus(200);
};
