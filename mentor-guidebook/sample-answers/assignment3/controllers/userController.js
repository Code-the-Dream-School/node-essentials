exports.register = async (req, res) => {
  // Check if user already exists
  const existingUser = global.users.find(
    (user) => user.email === req.body?.email,
  );
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  // Create new user
  const newUser = { ...req.body };
  global.users.push(newUser);

  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
};

exports.logon = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  // Find user
  const user = global.users.find(
    (u) => u.email === email && u.password === password,
  );

  if (!user) {
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
