const prisma = require("../db/prisma");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

exports.index = async (req, res) => {
  // Use global user_id (set during login/registration)
  if (!global.user_id) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const { minDate, maxDate, isCompleted,search } = req.query;
  const skip = (page - 1) * limit;
  const whereClause = { userId: global.user_id };
  if (minDate) {
    whereClause.createdAt = { gte: new Date(minDate) };
  }
  if (maxDate) {
    whereClause.createdAt = { lte: new Date(maxDate) };
  }
  if (isCompleted) {
    whereClause.isCompleted = isCompleted === 'true';
  }
  if (search) {
    whereClause.title = { contains: search, mode: 'insensitive' };
  }
  // Get tasks with pagination and eager loading
  const tasks = await prisma.task.findMany({
    where: { userId: global.user_id },
    select: { 
      id: true,
      title: true, 
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true
        }
      }
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: 'desc' }
  });

  // Get total count for pagination metadata
  const totalTasks = await prisma.task.count({
    where: { userId: global.user_id }
  });

  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1
  };

  res.status(200).json({
    tasks,
    pagination
  });
};

exports.show = async (req, res) => {
  if (!global.user_id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = parseInt(req.params?.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid task id." });
  }

  // Use global user_id (set during login/registration)
  const task = await prisma.task.findUnique({
    where: {
      id,
      userId: global.user_id,
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      User: {
        select: {
          name: true,
          email: true
        }
      }
    },
  });

  if (!task) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.status(200).json(task);
};

exports.create = async (req, res) => {
  // Use global user_id (set during login/registration)
  if (!global.user_id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { error, value } = taskSchema.validate(req.body);

  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }

  const newTask = await prisma.task.create({
    data: {
      ...value,
      userId: global.user_id,
    },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
    },
  });
  res.status(201).json(newTask);
};

exports.update = async (req, res, next) => {
  if (!global.user_id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = parseInt(req.params?.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid task id." });
  }
  if (!req.body) {
    req.body = {};
  }
  const { error, value } = patchTaskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }
  let task;
  try {
    task = await prisma.task.update({
      where: { id, userId: global.user_id },
      data: value,
      select: { id: true, title: true, isCompleted: true, priority: true, createdAt: true },
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    }
    return next(err);
  }
  res.status(200).json(task);
};

exports.deleteTask = async (req, res, next) => {
  if (!global.user_id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const id = parseInt(req.params?.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid task id." });
  }
  let task;
  try {
    task = await prisma.task.delete({
      where: { id, userId: global.user_id },
      select: { id: true, title: true, isCompleted: true, priority: true },
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    }
    return next(err);
  }
  res.status(200).json(task);
};

exports.bulkCreate = async (req, res, next) => {
  // Use global user_id (set during login/registration)
  if (!global.user_id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { tasks } = req.body;

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({ error: "Invalid request data. Expected an array of tasks." });
  }

  // Validate all tasks before insertion
  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }
    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || 'medium',
      userId: global.user_id
    });
  }

  // Use createMany for batch insertion
  let result;
  try {
    result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false
    });
  } catch (err) {
    return next(err);
  }

  res.status(201).json({
    message: "Bulk task creation successful",
    tasksCreated: result.count,
    totalRequested: tasks.length
  });
};
