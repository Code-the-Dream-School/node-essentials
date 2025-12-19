const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const send401 = (res) => {
  res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ error: "No user is authenticated." });
};

module.exports = async (req, res, next) => {
  const token = req?.cookies?.jwt;
  if (!token) {
    return send401(res);
  }
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    // using the callback here.  Of course, we could promisify instead.
    if (err) {
      return send401(res);
    }
    req.user = { id: decoded.id };
    // this is where the id is kept for subsequent use in access control.  We
    // don't use global.user_id any more!
    if (["POST", "PATCH", "PUT", "DELETE", "CONNECT"].includes(req.method)) {
      // for these operations we have to check for cross site request forgery
      if (req.get("X-CSRF-TOKEN") != decoded.csrfToken) {
        return send401(res);
      }
    }
    next(); // if the token is good
  });
};
