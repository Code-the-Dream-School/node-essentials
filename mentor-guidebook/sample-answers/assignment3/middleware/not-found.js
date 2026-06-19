const notFoundMiddleware = (req, res) => {
  return res
    .status(404)
    .json({ message: `You can't do a ${req.method} for ${req.url}.` });
};

module.exports = notFoundMiddleware;
