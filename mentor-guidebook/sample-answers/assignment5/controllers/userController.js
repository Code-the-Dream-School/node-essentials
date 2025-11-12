const pool = require("../db/pg-pool");
const userSchema = require("../validation/userSchema").userSchema;
const crypto = require("crypto");
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
  const hashedPassword = await hashPassword(password);
  try {
    const result = await pool.query(
      "INSERT INTO users (email, name, hashedPassword) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, name, hashedPassword],
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

  res.status(201).json({
    message: "User registered successfully",
    user: { name: result.rows[0].name, email: result.rows[0].email },
  });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  // Find user by email
  const users = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  if (user.rows.length === 0) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const user = result.rows[0];
  const isValidPassword = await comparePassword(password, user.hashedPassword);
  if (!isValidPassword) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  // Store user ID globally for session management (not secure for production)
  global.user_id = user.id;
  res.status(200).json({
    message: "Login successful",
    user: { name: user.name, email: user.email, id: user.id },
  });
};

exports.logoff = async (req, res) => {
  // Clear the global user ID for session management
  global.user_id = null;
  res.status(200).json({ message: "Logoff successful" });
};
