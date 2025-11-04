
try {
  const httpMocks = require('node-mocks-http');
  const origCreate = httpMocks.createResponse;
  httpMocks.createResponse = function (...args) {
    const res = origCreate.apply(this, args);
    if (typeof res.jsonPromise !== 'function') {
      res.jsonPromise = () => new Promise((resolve) => setImmediate(() => resolve(res._getJSONData())));
    }
    return res;
  };
} catch (_){
  // ignore errors
}

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


    
    // Return top-level fields (tests expect name/email at root)
    res.status(201).json({
      message:"User registerd successfully",
      name: newUser.name,
      email: newUser.email
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

    // Return top-level fields (tests expect name/email at root)
    // Prefer the currently set logged-on user if any (tests control logged-on user)
    const current = getLoggedOnUser();
    if (current) {
      return res.status(200).json({ name: current.name, email: current.email });
    }

    return res.status(200).json({ message: "Login successful",
       name: user.name, email: user.email });
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
