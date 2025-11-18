const pool = require("../db/pg-pool");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

exports.index = async (req, res) => {
  // Use global user_id (set during login/registration)
  const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE user_id = $1",
    [global.user_id],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "No tasks found for user" });
  }
  res.status(200).json(result.rows);
};

exports.show = async (req, res) => {
  const id = parseInt(req.params?.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid task id." });
  }
  // Use global user_id (set during login/registration)
  const result = await pool.query(
    "SELECT id, title, is_completed FROM tasks WHERE id = $1 AND user_id = $2",
    [id, global.user_id],
  );
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Task not found" });
  }
  res.status(200).json(result.rows[0]);
};

exports.create = async (req, res) => {
  // Use global user_id (set during login/registration)
  const { error, value } = taskSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });
  }
  const { title, isCompleted } = value;
  const result = await pool.query(
    "INSERT INTO tasks (title, is_completed, user_id) VALUES ($1, $2, $3) RETURNING id, title, is_completed",
    [title, isCompleted, global.user_id],
  );
  res.status(201).json(result.rows[0]);
};

exports.update = async (req, res) => {
  const id = parseInt(req.params?.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid task id." });
  }
  // Use global user_id (set during login/registration)
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
  const { title, isCompleted } = value;
  let result;
  if (title !== undefined && isCompleted !== undefined) {
    result = await pool.query(
      "UPDATE tasks SET title = $1, is_completed = $2 WHERE id = $3 AND user_id = $4 RETURNING id, title, is_completed",
      [title, isCompleted, id, global.user_id],
    );
  } else if (title !== undefined) {
    result = await pool.query(
      "UPDATE tasks SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING id, title, is_completed",
      [title, id, global.user_id],
    );
  } else if (isCompleted !== undefined) {
    result = await pool.query(
      "UPDATE tasks SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING id, title, is_completed",
      [isCompleted, id, global.user_id],
    );
  }
  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Task not found" });
  }
  res.status(200).json(result.rows[0]);
};

exports.deleteTask = async (req, res) => {
  const id = parseInt(req.params?.id);
  if (!id) {
    return res.status(400).json({ message: "Invalid task id." });
  }
  // Use global user_id (set during login/registration)
  const result = await pool.query(
    "DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id, title, is_completed",
    [id, global.user_id],
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Task not found" });
  }

  res.status(200).json(result.rows[0]);
};
