const express = require('express');
const pool = require('./db');
require('dotenv').config();
console.log(process.env.DATABASE_URI);
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

const todoRoutes = require('./taskRoutes');
app.use('/api', todoRoutes);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 