const prisma = require('../prisma/db');
const userSchema = require("../validation/userSchema").userSchema;
const crypto = require('crypto');

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

    // Hash the password before storing (using scrypt from lesson 4)
    const hashedPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');

    // Create new user
    const newUser = await prisma.user.create({
      data: { email, name, hashedPassword: hashedPassword },
      select: { id: true, email: true, name: true }
    });
    
    // Store the user ID globally for session management (not secure for production)
    global.user_id = newUser.id;
    
    res.status(201).json({ 
      message: "User registered successfully",
      user: newUser
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Compare hashed password
    const hashedInputPassword = crypto.scryptSync(password, 'salt', 64).toString('hex');
    const isValidPassword = hashedInputPassword === user.hashedPassword;
    
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    // Store user ID globally for session management (not secure for production)
    global.user_id = user.id;
    
    res.status(200).json({ 
      message: "Login successful",
      user: { name: user.name, email: user.email, id: user.id }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logoff = async (req, res) => {
  try {
    // Clear the global user ID for session management
    global.user_id = null;
    
    res.status(200).json({ message: "Logoff successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 