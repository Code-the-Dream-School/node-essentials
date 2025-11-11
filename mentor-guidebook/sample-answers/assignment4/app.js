const express = require("express");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");
const auth = require("./middleware/auth");

app.use((req, res, next) => {
  console.log("Method:", req.method);
  console.log("Path:", req.path);
  console.log("Query:", req.query);
  next();
});
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/tasks", auth, taskRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(notFound);
app.use(errorHandler);

let server = null;
try {
  server = app.listen(port, () =>
    console.log(`Server is listening on port ${port}...`),
  );
} catch (error) {
  console.log(error);
}

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log('Shutting down gracefully...');
  try {
    await new Promise(resolve => server.close(resolve));
    console.log('HTTP server closed.');
    // If you have DB connections, close them here:
  } catch (err) {
    console.error('Error during shutdown:', err);
    code = 1;
  } finally {
    console.log('Exiting process...');
    process.exit(code);
  }
}

process.on('SIGINT', () => shutdown(0));  // ctrl+c
process.on('SIGTERM', () => shutdown(0)); // e.g. `docker stop`

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  shutdown(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  shutdown(1);
});

module.exports = { server, app };
