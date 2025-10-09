const express = require('express');
const pool = require('./db');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const authMiddleware = require('./middleware/auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', authMiddleware, taskRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

module.exports = app; 