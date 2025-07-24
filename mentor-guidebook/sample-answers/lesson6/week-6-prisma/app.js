const express = require('express');
require('dotenv').config();

const taskRoutes = require('./taskRoutes');
const prisma = require('./prisma/db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use('/api/tasks', taskRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Prisma server running on port ${port}`);
}); 