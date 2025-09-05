const express = require('express');
const prisma = require('./prisma/db');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected', error: err.message });
  }
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  
  // Handle Prisma-specific errors
  if (err.code) {
    switch (err.code) {
      case 'P2002':
        return res.status(409).json({ 
          error: 'Unique constraint violation',
          details: 'A record with this unique field already exists'
        });
      case 'P2025':
        return res.status(404).json({ 
          error: 'Record not found',
          details: 'The requested record could not be found'
        });
      case 'P2003':
        return res.status(400).json({ 
          error: 'Foreign key constraint violation',
          details: 'Referenced record does not exist'
        });
      default:
        return res.status(500).json({ 
          error: 'Database error',
          details: err.message 
        });
    }
  }
  
  // Handle validation errors
  if (err.isJoi) {
    return res.status(400).json({ 
      error: 'Validation error',
      details: err.details 
    });
  }
  
  // Default error response
  res.status(500).json({ 
    error: 'Internal server error',
    details: err.message 
  });
});

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

app.listen(port, () => {
  console.log(`Prisma server running on port ${port}`);
});

module.exports = app; 