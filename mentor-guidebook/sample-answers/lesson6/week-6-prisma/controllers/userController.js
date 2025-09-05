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

    // Create new user
    const newUser = await prisma.user.create({
      data: { email, name, password },
      select: { id: true, email: true, name: true }
    });
    
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
    res.status(500).json({ error: err.message });
  }
};

exports.logoff = async (req, res) => {
  try {
    res.status(200).json({ message: "Logoff successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 