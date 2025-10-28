const { userSchema } = require("../validation/userSchema");
const { StatusCodes } = require("http-status-codes");
const { createUser, verifyUserPassword } = require("../services/userService");
const { randomUUID } = require("crypto");
const jwt = require("jsonwebtoken");

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
  req.user = payload; // this is a convenient way to return the csrf token to the caller.
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" }); // 1 hour expiration

  // Set cookie.  Note that the cookie flags have to be different in production and in test.
  res.cookie("jwt", token, { ...cookieFlags(req), maxAge: 3600000 }); // 1 hour expiration
  return payload.csrfToken; // this is needed in the body returned by login() or register()
};

const login = async (req, res) => {
  const { user, isValid } = await verifyUserPassword(
    req?.body?.email,
    req?.body?.password,
  );
  if (!isValid) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ message: "Authentication Failed." });
  }
  const csrfToken = setJwtCookie(req, res, user);
  res
    .status(StatusCodes.OK)
    .json({ name: user.name, csrfToken });
};

const register = async (req, res) => {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(StatusCodes.BAD_REQUEST).json({ message: error.message });
  }
  let user = null;
  try {
    user = await createUser(value);
  } catch (e) {
    if (e.name === "PrismaClientKnownRequestError" && e.code == "P2002") {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "A user record already exists with that email." });
    } else {
      throw e;
    }
  }
  const csrfToken = setJwtCookie(req, res, user);
  return res
    .status(StatusCodes.CREATED)
    .json({ name: value.name, csrfToken });
};

const logoff = async (req, res) => {
  res.clearCookie("jwt", cookieFlags(req));
  res.sendStatus(StatusCodes.OK);
};

const getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.query;
    
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }


    let selectFields = {
      id: true,
      name: true,
      email: true,
      createdAt: true
    };

    if (fields) {
      const requestedFields = fields.split(',');
      selectFields = {};
      requestedFields.forEach(field => {
        if (['id', 'name', 'email', 'createdAt'].includes(field.trim())) {
          selectFields[field.trim()] = true;
        }
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: selectFields
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: err.message });
  }
}; 

module.exports = { login, register, logoff, getUser };
