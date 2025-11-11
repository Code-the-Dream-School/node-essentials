const { getLoggedOnUser } = require("../util/memoryStore");
module.exports = (req, res, next) => {
  if (!getLoggedOnUser()) {
    return res.status(401).res.json({ message: "Unauthorized" });
  }
  next();
};
