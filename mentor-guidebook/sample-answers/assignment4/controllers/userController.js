const { storedUsers, setLoggedOnUser } = require("../util/memoryStore.js");
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
      error: "Validation failed",
      details: error.details,
    });
  }

  const { email, name, password } = value;

  // Check if user already exists
  const existingUser = storedUsers.find((user) => user.email === email);
  if (existingUser) {
    return res.status(409).json({ error: "User already exists" });
  }
  const hashedPassword = await hashPassword(password);

  // Create new user
  const newUser = { email, name, hashedPassword };
  storedUsers.push(newUser);

  res.status(201).json({
    message: "User registered successfully",
    user: { email, name },
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  // Find user
  const user = storedUsers.find((u) => u.email === email);
  let goodCredentials = false;
  if (user) {
    goodCredentials = await comparePassword(password, user.hashedPassword);
  }

  if (!goodCredentials) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Set logged on user
  setLoggedOnUser(user);

  res.status(200).json({
    message: "Login successful",
    user: { name: user.name, email: user.email },
  });
};

exports.logoff = async (req, res) => {
  setLoggedOnUser(null);
  res.status(200).json({ message: "Logoff successful" });
};
