const { getLoggedOnUser } = require("../util/memoryStore");
module.exports = (req, res, next) => {
  if (!getLoggedOnUser()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};
