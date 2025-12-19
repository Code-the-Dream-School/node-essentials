const { StatusCodes } = require("http-status-codes");

const notFoundMiddleware = (req, res) => {
  return res
    .status(StatusCodes.NOT_FOUND)
    .json({ error: `You can't do a ${req.method} for ${req.url}` });
};

module.exports = notFoundMiddleware;
