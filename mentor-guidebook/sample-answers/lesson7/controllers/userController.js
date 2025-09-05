const prisma = require('../prisma/db');
const userSchema = require("../validation/userSchema").userSchema;

exports.register = async (req, res) => {
  try {
    const { error, value } = userSchema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: error.details 
      });
    }

    const { email, name, password } = value;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Use transaction to create user and welcome tasks atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create new user
      const newUser = await tx.user.create({
        data: { email, name, password },
        select: { id: true, email: true, name: true }
      });

      // Create welcome tasks
      const welcomeTasks = [
        { title: "Complete your profile", priority: "high", userId: newUser.id },
        { title: "Add your first task", priority: "medium", userId: newUser.id },
        { title: "Explore the app features", priority: "low", userId: newUser.id }
      ];

      const createdTasks = await tx.task.createMany({
        data: welcomeTasks
      });

      return { user: newUser, tasksCreated: createdTasks.count };
    });
    
    res.status(201).json({ 
      message: "User registered successfully with welcome tasks",
      user: result.user,
      tasksCreated: result.tasksCreated
    });
  } catch (err) {
    console.error('User registration error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { email, password }
    });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    res.status(200).json({ 
      message: "Login successful",
      user: { name: user.name, email: user.email, id: user.id }
    });
  } catch (err) {
    console.error('User login error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.logoff = async (req, res) => {
  try {
    res.status(200).json({ message: "Logoff successful" });
  } catch (err) {
    console.error('User logoff error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Get user by ID with selective field loading
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.query;
    
    const userId = parseInt(id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    // Dynamic field selection for performance optimization
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