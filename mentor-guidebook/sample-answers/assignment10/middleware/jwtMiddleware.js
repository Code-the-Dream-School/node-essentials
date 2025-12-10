const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const send401 = (res) => {
  res
    .status(StatusCodes.UNAUTHORIZED)
    .json({ message: "No user is authenticated." });
};

module.exports = async (req, res, next) => {
  const token = req?.cookies?.jwt;
  if (!token) {
    send401(res);
  } else {
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        send401(res);
      } else {
        req.user = { id: decoded.id };
        if (
          ["POST", "PATCH", "PUT", "DELETE", "CONNECT"].includes(req.method)
        ) {
          // for these operations we have to check for cross site request forgery
          if (req.get("X-CSRF-TOKEN") == decoded.csrfToken) {
            next();
          } else {
            send401(res);
          }
        } else {
          next();
        }
      }
    });
  }
};
