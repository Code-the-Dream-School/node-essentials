const { storedTasks, getLoggedOnUser } = require("../util/memoryStore.js");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

exports.index = async (req, res) => {
  const loggedOnUser = getLoggedOnUser();
  // Get tasks for the logged on user
  const userTasks = storedTasks.filter(
    (task) => task.userId === loggedOnUser.email,
  );
  if (userTasks.length === 0) {
    return res.status(404).json({ error: "No tasks found for user" });
  }
  // Return tasks without userId property (tests expect no userId)
  const sanitized = userTasks.map(({ userId, ...rest }) => rest);
  res.status(200).json(sanitized);
};

exports.show = async (req, res) => {
  const loggedOnUser = getLoggedOnUser();
  const { id } = req.params;
  const task = storedTasks.find(
    (t) => t.id === parseInt(id) && t.userId === loggedOnUser.email,
  );

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  // Return task without userId
  const { userId, ...rest } = task;
  res.status(200).json(rest);
};

exports.create = async (req, res) => {
  const loggedOnUser = getLoggedOnUser();
  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details,
    });
  }

  const { title, isCompleted } = value;

  // Create new task
  const newTask = {
    id: Date.now(), // Simple ID generation
    title,
    isCompleted,
    userId: loggedOnUser.email,
  };

  storedTasks.push(newTask);

  // Return new task without userId
  const { userId: _uid, ...returnTask } = newTask;
  res.status(201).json(returnTask);
};

exports.update = async (req, res) => {
  const loggedOnUser = getLoggedOnUser();
  const { id } = req.params;
  const taskIndex = storedTasks.findIndex(
    (t) => t.id === parseInt(id) && t.userId === loggedOnUser.email,
  );
  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }
  const { error, value } = patchTaskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details,
    });
  }

  // Update task
  storedTasks[taskIndex] = { ...storedTasks[taskIndex], ...value };

  const { userId: _u, ...updated } = storedTasks[taskIndex];
  res.status(200).json(updated);
};

exports.deleteTask = async (req, res) => {
  const loggedOnUser = getLoggedOnUser();
  const { id } = req.params;
  const taskIndex = storedTasks.findIndex(
    (t) => t.id === parseInt(id) && t.userId === loggedOnUser.email,
  );

  if (taskIndex === -1) {
    return res.status(404).json({ error: "Task not found" });
  }

  // Delete task
  storedTasks.splice(taskIndex, 1);

  res.status(200).json({ message: "Task deleted successfully" });
};
