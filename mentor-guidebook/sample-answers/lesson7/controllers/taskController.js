const prisma = require('../prisma/db');
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

exports.index = async (req, res) => {
  try {
    const { 
      user_id, 
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
    
    if (!user_id) {
      return res.status(401).json({ error: "User ID required" });
    }

    const userId = parseInt(user_id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }
    
    let pageNum = parseInt(page);
    let limitNum = parseInt(limit);
    
    // Handle invalid pagination parameters gracefully
    if (isNaN(pageNum) || pageNum < 1) {
      pageNum = 1;
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      limitNum = 10;
    }
    
    const offset = (pageNum - 1) * limitNum;

    // Build complex where clause with advanced filtering
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

    // Validate sort fields
    const allowedSortFields = ['title', 'isCompleted', 'priority', 'createdAt'];
    const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'createdAt';
    const sortDirection = sort_order === 'asc' ? 'asc' : 'desc';

    // Dynamic field selection for performance
    let selectFields = {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      userId: true
    };

    if (fields) {
      const requestedFields = fields.split(',');
      selectFields = {};
      requestedFields.forEach(field => {
        if (['id', 'title', 'isCompleted', 'priority', 'createdAt', 'userId'].includes(field.trim())) {
          selectFields[field.trim()] = true;
        }
      });
    }

    // Get tasks with pagination
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
      return res.status(200).json({
        tasks: [],
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: 0,
          pages: 0
        }
      });
    }

    // Pagination metadata
    const pagination = {
      page: pageNum,
      limit: limitNum,
      total: totalTasks,
      pages: Math.ceil(totalTasks / limitNum),
      hasNext: pageNum * limitNum < totalTasks,
      hasPrev: pageNum > 1
    };

    res.status(200).json({
      tasks,
      pagination
    });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, fields } = req.query;
    
    if (!user_id) {
      return res.status(401).json({ error: "User ID required" });
    }

    // Dynamic field selection
    let selectFields = {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      userId: true
    };

    if (fields) {
      const requestedFields = fields.split(',');
      selectFields = {};
      requestedFields.forEach(field => {
        if (['id', 'title', 'isCompleted', 'priority', 'createdAt', 'userId'].includes(field.trim())) {
          selectFields[field.trim()] = true;
        }
      });
    }

    const task = await prisma.task.findFirst({
      where: { 
        id: parseInt(id), 
        userId: parseInt(user_id) 
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
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(401).json({ error: "User ID required" });
    }

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
        userId: parseInt(user_id)
      }
    });
    
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(401).json({ error: "User ID required" });
    }

    const { error, value } = patchTaskSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: error.details 
      });
    }

    const { title, isCompleted, priority } = value;
    
    const updatedTask = await prisma.task.update({
      where: { 
        id: parseInt(id),
        userId: parseInt(user_id)
      },
      data: { title, isCompleted, priority }
    });
    
    res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Task not found" });
    }
    console.error('Update task error:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(401).json({ error: "User ID required" });
    }

    await prisma.task.delete({
      where: { 
        id: parseInt(id),
        userId: parseInt(user_id)
      }
    });
    
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Task not found" });
    }
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
    const { user_id } = req.query;
    const { tasks } = req.body;
    
    if (!user_id) {
      return res.status(401).json({ error: "User ID required" });
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res.status(400).json({ error: "Tasks array is required and must not be empty" });
    }

    if (tasks.length > 100) {
      return res.status(400).json({ error: "Cannot create more than 100 tasks at once" });
    }

    // Validate all tasks before insertion
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
          userId: parseInt(user_id),
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

    // Use transaction for bulk insertion
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