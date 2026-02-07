const { StatusCodes } = require("http-status-codes");

module.exports = (req, res, next) => {
  if (!global.user_id) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Unauthorized" });
  }
  next();
};
