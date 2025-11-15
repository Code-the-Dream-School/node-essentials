const prisma = require("../db/prisma");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

exports.index = async (req, res) => {
  // Use global user_id (set during login/registration)
  const tasks = await prisma.task.findMany({
    where: { userId: global.user_id },
  });

  if (tasks.length === 0) {
    return res.status(404).json({ error: "No tasks found for user" });
  }
  res.status(200).json(tasks);
};

exports.show = async (req, res) => {
  const { id } = req.params;

  // Use global user_id (set during login/registration)
  const task = await prisma.task.findFirst({
    where: {
      id: parseInt(id),
      userId: global.user_id,
    },
    omit: {
      userId: true,
    },
  });

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(200).json(task);
};

exports.create = async (req, res) => {
  // Use global user_id (set during login/registration)
  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details,
    });
  }

  const { title, isCompleted = false } = value;

  const newTask = await prisma.task.create({
    data: {
      title,
      isCompleted,
      userId: global.user_id,
    },
  });
  delete newTask.userId;
  res.status(201).json(newTask);
};

exports.update = async (req, res) => {
  const { id } = req.params;

  // Use global user_id (set during login/registration)
  const { error, value } = patchTaskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      error: "Validation failed",
      details: error.details,
    });
  }

  const { title, isCompleted } = value;

  const result = await prisma.task.update({
    where: {
      id: parseInt(id),
      userId: global.user_id,
    },
    data: { title, isCompleted },
  });

  if (!result) {
    return res.status(404).json({ error: "Task not found" });
  }
  delete result.userId;
  res.status(200).json({
    message: "Task updated successfully",
    task: result,
  });
};

exports.deleteTask = async (req, res) => {
  const { id } = req.params;

  // Use global user_id (set during login/registration)
  const result = await prisma.task.delete({
    where: {
      id: parseInt(id),
      userId: global.user_id,
    },
  });

  if (!result) {
    return res.status(404).json({ error: "Task not found" });
  }

  res.status(200).json({
    message: "Task deleted successfully",
    count: result.count,
  });
  res.status(500).json({ error: err.message });
};
