const express = require('express');
const prisma = require('./prisma/db');
const userRoutes = require('./routes/userRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const { xss } = require('express-xss-sanitizer');
const rateLimiter = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3000;

// Initialize Passport
require('./passport/passport');

// Security middleware - must come first
app.use(
  rateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
  }),
);

app.use(helmet());

// CORS configuration
const origins = [];
if (process.env.ALLOWED_ORIGINS) {
  const originArray = process.env.ALLOWED_ORIGINS.split(",");
  originArray.forEach((orig) => {
    orig = orig.trim();
    if (orig.length > 4) {
      origins.push(orig);
    }
  });
  app.use(
    cors({
      origin: origins,
      credentials: true,
      methods: "GET,POST,PATCH,DELETE",
      allowedHeaders: "CONTENT-TYPE, X-CSRF-TOKEN",
    }),
  );
}

// Body and cookie parsing
app.use(express.json());
app.use(cookieParser(process.env.JWT_SECRET));

// XSS protection - must come after body parsers
app.use(xss());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);

// Add routes for testing compatibility
app.use('/user', userRoutes);
app.use('/tasks', taskRoutes);

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

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.originalUrl 
  });
});

const server = app.listen(port, () => {
  console.log(`Prisma server running on port ${port}`);
});

module.exports = { app, server }; 