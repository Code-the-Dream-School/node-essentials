const pool = require('../db');
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

exports.index = async (req, res) => {
  try {
    const { user_id } = req.query; // You'll need to pass user_id in query or use session
    
    if (!user_id) {
      return res.status(401).json({ error: "User ID required" });
    }

    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No tasks found for user" });
    }

    res.status(200).json(result.rows);
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

    const result = await pool.query('SELECT * FROM tasks WHERE id = $1 AND user_id = $2', [id, user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    res.status(200).json(result.rows[0]);
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
    
    const result = await pool.query(
      'INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, isCompleted, user_id]
    );
    
    res.status(201).json(result.rows[0]);
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
    
    let result;
    if (title !== undefined && isCompleted !== undefined) {
      result = await pool.query(
        'UPDATE tasks SET title = $1, is_completed = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
        [title, isCompleted, id, user_id]
      );
    } else if (title !== undefined) {
      result = await pool.query(
        'UPDATE tasks SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [title, id, user_id]
      );
    } else if (isCompleted !== undefined) {
      result = await pool.query(
        'UPDATE tasks SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
        [isCompleted, id, user_id]
      );
    }
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.status(200).json(result.rows[0]);
  } catch (err) {
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

    const result = await pool.query('DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING *', [id, user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}; 