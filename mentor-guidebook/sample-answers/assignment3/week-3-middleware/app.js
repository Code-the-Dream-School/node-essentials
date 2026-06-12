const express = require("express");
const { randomUUID } = require("crypto");
const path = require("path");
const dogsRouter = require("./routes/dogs");
const { ValidationError } = require("./errors");

const app = express();

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.set("X-Request-Id", req.requestId);
  next();
});

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("X-XSS-Protection", "1; mode=block");
  next();
});

app.use(express.json({ limit: "1mb" }));
app.use("/images", express.static(path.join(__dirname, "public/images")));

app.use((req, res, next) => {
  if (req.method === "POST" && !req.is("application/json")) {
    const error = new ValidationError(
      "Content-Type must be application/json for POST requests",
    );
    return next(error);
  }
  next();
});

app.use("/", dogsRouter);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} - ${err.message}`);
  } else {
    console.error(`ERROR: ${err.name} - ${err.message}`);
  }

  const errorMessage =
    statusCode === 500 ? "Internal Server Error" : err.message;

  res.status(statusCode).json({
    error: errorMessage,
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Server listening on port 3000");
  });
}

module.exports = app;
