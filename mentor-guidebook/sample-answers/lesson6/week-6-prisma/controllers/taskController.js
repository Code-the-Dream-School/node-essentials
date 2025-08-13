const prisma = require('../prisma/db');
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

exports.index = async (req, res) => {
  try {
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(401).json({ error: "User ID required" });
    }

    const tasks = await prisma.task.findMany({
      where: { userId: parseInt(user_id) }
    });
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: "No tasks found for user" });
    }

    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.show = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query;
    
    if (!user_id) {
      return res.status(401).json({ error: "User ID required" });
    }

    const task = await prisma.task.findFirst({
      where: { 
        id: parseInt(id), 
        userId: parseInt(user_id) 
      }
    });
    
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json(task);
  } catch (err) {
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

    const { title, isCompleted = false } = value;
    
    const newTask = await prisma.task.create({
      data: {
        title,
        isCompleted,
        userId: parseInt(user_id)
      }
    });
    
    res.status(201).json(newTask);
  } catch (err) {
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

    const { title, isCompleted } = value;
    
    const updatedTask = await prisma.task.update({
      where: { 
        id: parseInt(id),
        userId: parseInt(user_id)
      },
      data: { title, isCompleted }
    });
    
    res.status(200).json(updatedTask);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: "Task not found" });
    }
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
    res.status(500).json({ error: err.message });
  }
}; 