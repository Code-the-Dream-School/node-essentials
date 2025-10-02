const { StatusCodes } = require("http-status-codes");

module.exports = (req, res, next) => {
  const { user_id } = req.query;
  
  if (!user_id) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ error: "User ID required" });
  }

  const userId = parseInt(user_id);
  if (isNaN(userId)) {
    return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid user ID" });
  }

  // Store the validated user ID in the request for use in controllers
  req.userId = userId;
  next();
};
