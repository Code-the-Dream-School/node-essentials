const errorHandlerMiddleware = (err, req, res, next) => {
  console.error(
    "Internal server error: ",
    err.constructor.name,
    JSON.stringify(err, ["name", "message", "stack"]),
  );

  if (!res.headersSent) {
    return res
      .status(500)
      .json({ message: "An internal server error occurred." });
  }
};

module.exports = errorHandlerMiddleware;
