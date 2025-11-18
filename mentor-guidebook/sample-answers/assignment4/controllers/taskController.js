const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");
const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

exports.index = async (req, res) => {
  // Get tasks for the logged on user

  const userTasks = global.tasks.filter(
    (task) => task.userId === global.user_id.email,
  );
  if (userTasks.length === 0) {
    return res.status(404).json({ message: "No tasks found for the user" });
  }
  const sanitizedTasks = userTasks.map((task) => {
    const { userId: _, ...sanitizedTask } = task;
    return sanitizedTask;
  });
  res.status(200).json(sanitizedTasks);
};

exports.show = async (req, res) => {
  const id = parseInt(req.params?.id);
  if (!id) {
    return res.status(400).json({ message: "The task id passed was invalid." });
  }
  const task = global.tasks.find(
    (t) => t.id === id && t.userId === global.user_id.email,
  );

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }
  const { userId, ...sanitizedTask } = task;
  res.status(200).json(sanitizedTask);
};

exports.create = async (req, res) => {
  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  // Create new task
  const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };
  global.tasks.push(newTask);
  const { userId, ...sanitizedTask } = newTask;
  res.status(201).json(sanitizedTask);
};

exports.update = async (req, res) => {
  const { error, value } = patchTaskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }
  const id = parseInt(req.params?.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid task id." });
  }
  const task = global.tasks.find(
    (t) => t.id === id && t.userId === global.user_id.email,
  );
  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }
  Object.assign(task, value);
  const { userId, ...sanitizedTask } = task;
  res.status(200).json(sanitizedTask);
};

exports.deleteTask = async (req, res) => {
  const id = parseInt(req.params?.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid task id specified." });
  }

  const taskIndex = global.tasks.findIndex(
    (t) => t.id === id && t.userId === global.user_id.email,
  );

  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }
  const { userId, ...taskCopy } = tasks[taskIndex];
  // Delete task
  global.tasks.splice(taskIndex, 1);

  res.status(200).json(taskCopy);
};
