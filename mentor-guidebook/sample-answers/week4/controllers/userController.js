const { storedUsers, setLoggedOnUser, getLoggedOnUser } = require("../util/memoryStore.js");
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
    const existingUser = storedUsers.find(user => user.email === email);
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Create new user
    const newUser = { email, name, password };
    storedUsers.push(newUser);
    
    res.status(201).json({ 
      message: "User registered successfully",
      user: { email, name }
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
    const user = storedUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Set logged on user
    setLoggedOnUser(user);
    
    res.status(200).json({ 
      message: "Login successful",
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.logoff = async (req, res) => {
  try {
    setLoggedOnUser(null);
    res.status(200).json({ message: "Logoff successful" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 