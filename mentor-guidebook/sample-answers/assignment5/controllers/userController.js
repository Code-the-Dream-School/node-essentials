const pool = require("../db/pg-pool");
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
      message: "Validation failed",
      details: error.details,
    });
  }
  const { email, name, password } = value;
  const hashed_password = await hashPassword(password);
  let result;
  try {
    result = await pool.query(
      "INSERT INTO users (email, name, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, name, hashed_password],
    );
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ message: "That email is already registered." });
    }
    return next(err); // send all other errors to the global error handler
  }

  // Store the user ID globally for session management (not secure for production)
  global.user_id = result.rows[0].id;
  res
    .status(201)
    .json({ name: result.rows[0].name, email: result.rows[0].email });
};

exports.logon = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  // Find user by email
  const users = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (users.rows.length === 0) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  const user = users.rows[0];
  const isValidPassword = await comparePassword(password, user.hashed_password);
  if (!isValidPassword) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  // Store user ID globally for session management (not secure for production)
  global.user_id = user.id;
  res.status(200).json({ name: user.name, email: user.email, id: user.id });
};

exports.logoff = async (req, res) => {
  // Clear the global user ID for session management
  global.user_id = null;
  res.status(200).json({ message: "Logoff successful" });
};
