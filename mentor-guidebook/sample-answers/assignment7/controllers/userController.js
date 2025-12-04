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
  try {
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });

    if (error) {
      res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
      return;
    }

    const { email, name, password } = value;

    // Hash the password before storing (using scrypt from lesson 4)
    const hashedPassword = await hashPassword(password);
    
    // Use transaction to create user and welcome tasks atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create new user
      const newUser = await tx.user.create({
        data: { email, name, hashedPassword },
        select: { id: true, email: true, name: true },
      });
      // Create 3 welcome tasks using createMany
      const welcomeTaskData = [
        { title: "Complete your profile", userId: newUser.id, priority: "medium" },
        { title: "Add your first task", userId: newUser.id, priority: "high" },
        { title: "Explore the app", userId: newUser.id, priority: "low" }
      ];
      await tx.task.createMany({ data: welcomeTaskData });

      // Fetch the created tasks to return them
      const welcomeTasks = await tx.task.findMany({
        where: {
          userId: newUser.id,
          title: { in: welcomeTaskData.map(t => t.title) }
        },
        select: {
          id: true,
          title: true,
          isCompleted: true,
          userId: true,
          priority: true
        }
      });

      return { user: newUser, welcomeTasks };
    });

    // Store the user ID globally for session management (not secure for production)
    global.user_id = result.user.id;
    
    // Send response with status 201
    res.status(201);
    res.json({
      user: result.user,
      welcomeTasks: result.welcomeTasks,
      transactionStatus: "success"
    });
    return;
  } catch (err) {
    if (err.code === "P2002") {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    if (next && typeof next === 'function') {
      return next(err);
    }
    // If next is not provided (like in tests), send error response directly
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isValidPassword = await comparePassword(password, user.hashedPassword);

    if (!isValidPassword) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Store user ID globally for session management (not secure for production)
    global.user_id = user.id;

    res.status(200).json({
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

exports.logoff = async (req, res) => {
  // Clear the global user ID for session management
  global.user_id = null;
  res.sendStatus(200);
};
