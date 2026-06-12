const express = require("express");
const userRoutes = require("./routes/userRoutes");
global.user_id = null;
global.users = [];
global.tasks = [];

const app = express();
const errorHandler = require("./middleware/error-handler");
const notFound = require("./middleware/not-found");

const port = process.env.PORT || 3000;

app.use(express.json());

app.use("/api/users", userRoutes);

app.use(notFound);
app.use(errorHandler);

const server = app.listen(port, () =>
  console.log(`Server is listening on port ${port}...`),
);

module.exports = { server, app };
