const { storedTasks, getLoggedOnUser } = require("../util/memoryStore.js");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

exports.index = async (req, res) => {
  try {
    const loggedOnUser = getLoggedOnUser();
    
    if (!loggedOnUser) {
      return res.status(401).json({ error: "User not logged in" });
    }

    // Get tasks for the logged on user
    const userTasks = storedTasks.filter(task => task.userId === loggedOnUser.email);
    
    if (userTasks.length === 0) {
      return res.status(404).json({ error: "No tasks found for user" });
    }

    res.status(200).json(userTasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.show = async (req, res) => {
  try {
    const loggedOnUser = getLoggedOnUser();
    
    if (!loggedOnUser) {
      return res.status(401).json({ error: "User not logged in" });
    }

    const { id } = req.params;
    const task = storedTasks.find(t => t.id === parseInt(id) && t.userId === loggedOnUser.email);
    
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
    const loggedOnUser = getLoggedOnUser();
    
    if (!loggedOnUser) {
      return res.status(401).json({ error: "User not logged in" });
    }

    const { error, value } = taskSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: error.details 
      });
    }

    const { title, isCompleted = false } = value;
    
    // Create new task
    const newTask = {
      id: Date.now(), // Simple ID generation
      title,
      isCompleted,
      userId: loggedOnUser.email
    };
    
    storedTasks.push(newTask);
    
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const loggedOnUser = getLoggedOnUser();
    
    if (!loggedOnUser) {
      return res.status(401).json({ error: "User not logged in" });
    }

    const { id } = req.params;
    const taskIndex = storedTasks.findIndex(t => t.id === parseInt(id) && t.userId === loggedOnUser.email);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    const { error, value } = patchTaskSchema.validate(req.body);
    
    if (error) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: error.details 
      });
    }

    // Update task
    storedTasks[taskIndex] = { ...storedTasks[taskIndex], ...value };
    
    res.status(200).json(storedTasks[taskIndex]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const loggedOnUser = getLoggedOnUser();
    
    if (!loggedOnUser) {
      return res.status(401).json({ error: "User not logged in" });
    }

    const { id } = req.params;
    const taskIndex = storedTasks.findIndex(t => t.id === parseInt(id) && t.userId === loggedOnUser.email);
    
    if (taskIndex === -1) {
      return res.status(404).json({ error: "Task not found" });
    }

    // Delete task
    storedTasks.splice(taskIndex, 1);
    
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 