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

exports.register = async (req, res) => {
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  const { email, name, password } = value;

  // Check if user already exists
  const existingUser = global.users.find((user) => user.email === email);
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }
  const hashedPassword = await hashPassword(password);

  // Create new user
  const newUser = { email, name, hashedPassword };
  global.users.push(newUser);
  global.user_id = newUser;

  res.status(201).json({
    email,
    name,
  });
};

exports.logon = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Find user
  const user = global.users.find((u) => u.email === email);
  let goodCredentials = false;
  if (user) {
    goodCredentials = await comparePassword(password, user.hashedPassword);
  }

  if (!goodCredentials) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Set logged on user
  global.user_id = user;
  res.status(200).json({
    name: user.name,
    email: user.email,
  });
};

exports.logoff = async (req, res) => {
  global.user_id = null;
  res.sendStatus(200);
};
