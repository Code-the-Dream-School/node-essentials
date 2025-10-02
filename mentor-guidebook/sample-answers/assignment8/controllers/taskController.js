const prisma = require('../prisma/db');
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

exports.index = async (req, res) => {
  try {
    const { 
      status, 
      priority, 
      date_range, 
      search, 
      sort_by = 'createdAt', 
      sort_order = 'desc',
      page = 1,
      limit = 10,
      fields
    } = req.query;
    
    const userId = req.user.id;
    
    let pageNum = parseInt(page);
    let limitNum = parseInt(limit);
    

    if (isNaN(pageNum) || pageNum < 1) {
      pageNum = 1;
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      limitNum = 10;
    }
    
    const offset = (pageNum - 1) * limitNum;


    let whereClause = { userId };
    
    if (status !== undefined) {
      whereClause.isCompleted = status === 'true';
    }
    
    if (priority) {
      whereClause.priority = priority;
    }
    
    if (date_range) {
      const [startDate, endDate] = date_range.split(',');
      if (startDate && endDate) {
        whereClause.createdAt = {
          gte: new Date(startDate),
          lte: new Date(endDate)
        };
      }
    }
    
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } }
      ];
    }

    const allowedSortFields = ['title', 'isCompleted', 'priority', 'createdAt'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'createdAt';
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';

    let selectFields = {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true
    };

    if (fields) {
      const requestedFields = fields.split(',');
      selectFields = {};
      requestedFields.forEach(field => {
        if (['id', 'title', 'isCompleted', 'priority', 'createdAt'].includes(field.trim())) {
          selectFields[field.trim()] = true;
        }
      });
    }

    const [tasks, totalTasks] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        select: selectFields,
        orderBy: { [sortField]: sortDirection },
        skip: offset,
        take: limitNum
      }),
      prisma.task.count({ where: whereClause })
    ]);
    
    if (tasks.length === 0) {
      return res.status(404).json({
        error: "No tasks found for this user"
      });
    }

    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limitNum),
      hasNext: pageNum * limitNum < totalTasks,
      hasPrev: pageNum > 1
    };

    res.status(200).json(tasks);
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const { fields } = req.query;
    
    const userId = req.user.id;

    let selectFields = {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true
    };

    if (fields) {
      const requestedFields = fields.split(',');
      selectFields = {};
      requestedFields.forEach(field => {
        if (['id', 'title', 'isCompleted', 'priority', 'createdAt'].includes(field.trim())) {
          selectFields[field.trim()] = true;
        }
      });
    }

    const task = await prisma.task.findFirst({
      where: { 
        id: parseInt(id), 
        userId: parseInt(userId) 
      },
      select: selectFields
    });
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json(task);
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  if (!req.user || !req.user.id) {
    throw new TypeError("Cannot read properties of undefined (reading 'id')");
  }
  
  try {
    const userId = req.user.id;

    const { error, value } = taskSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: error.details 
      });
    }

    const { title, isCompleted = false, priority = 'medium' } = value;
    
    const newTask = await prisma.task.create({
      data: {
        title,
        isCompleted,
        priority,
        userId: parseInt(userId)
      },
      select: {
        id: true,
        title: true,
        isCompleted: true,
        priority: true,
        createdAt: true
      }
    });
    
    res.status(201).json(newTask);
  } catch (err) {

    if (err.code === 'P2003') {
      throw err;
    }
    console.error('Create task error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    
    const userId = req.user.id;

    const { error, value } = patchTaskSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: error.details 
      });
    }

    const { title, isCompleted, priority } = value;
    
    const result = await prisma.task.updateMany({
      where: { 
        id: parseInt(id),
        userId: userId
      },
      data: { title, isCompleted, priority }
    });
    
    if (result.count === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    // Fetch the updated task to return it
    const updatedTask = await prisma.task.findUnique({
      where: { id: parseInt(id) }
    });
    
    res.status(200).json(updatedTask);
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id);
    const userId = req.user.id;

    const result = await prisma.task.deleteMany({
      where: { 
        id: parseInt(id),
        userId: userId
      }
    });
    
    if (result.count === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Bulk create tasks using createMany for better performance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.bulkCreate = async (req, res) => {
  try {
    const { tasks } = req.body;
    
    const userId = req.user.id;

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Tasks array is required and must not be empty" });
    }

    if (tasks.length > 100) {
      return res.status(400).json({ error: "Cannot create more than 100 tasks at once" });
    }

    const validationErrors = [];
    const validTasks = [];

    for (let i = 0; i < tasks.length; i++) {
      const { error, value } = taskSchema.validate(tasks[i]);
      if (error) {
        validationErrors.push({
          index: i,
          errors: error.details
        });
      } else {
        validTasks.push({
          ...value,
          userId: userId,
          priority: value.priority || 'medium'
        });
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Some tasks failed validation",
        validationErrors,
        validTasksCount: validTasks.length
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdTasks = await tx.task.createMany({
        data: validTasks
      });

      return createdTasks;
    });

    res.status(201).json({
      message: "Bulk task creation successful",
      tasksCreated: result.count,
      totalRequested: tasks.length
    });
  } catch (err) {
    console.error('Bulk create tasks error:', err);
    res.status(500).json({ error: err.message });
  }
}; 