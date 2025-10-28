const express = require('express');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const dogsRouter = require('./routes/dogs');
const { ValidationError, NotFoundError, UnauthorizedError } = require('./errors');

const app = express();

app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.set('X-Request-Id', req.requestId);
  next();
});

app.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const requestID = req.requestId;
  
  console.log(`[${timestamp}]: ${method} ${path} (${requestID})`);
  
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - req.startTime;
    console.log(`[${timestamp}]: ${method} ${path} (${requestID}) - ${duration}ms`);
    
    if (duration > 1000) {
      console.warn(`WARNING: Slow request detected - ${method} ${path} took ${duration}ms`);
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
});

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Static files should be served before content-type validation
app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use((req, res, next) => {
  if (req.method === 'POST' && !req.is('application/json')) {
    const error = new ValidationError('Content-Type must be application/json for POST requests');
    return next(error);
  }
  next();
});

app.use('/', dogsRouter);

app.use((req, res) => {
  const error = new NotFoundError('Route not found');
  res.status(404).json({
    error: error.message,
    requestId: req.requestId
  });
});

app.use((err, req, res, next) => {
  // Determine log level based on error type
  let logLevel = 'ERROR';
  if (err.statusCode >= 400 && err.statusCode < 500) {
    logLevel = 'WARN';
  }
  
  console[logLevel.toLowerCase()](`${logLevel}: ${err.constructor.name} - ${err.message}`);
  if (logLevel === 'ERROR') {
    console.error(err.stack);
  }
  
  // Return appropriate response
  const statusCode = err.statusCode || 500;
  const errorMessage = statusCode === 500 ? 'Internal Server Error' : err.message;
  
  res.status(statusCode).json({
    error: errorMessage,
    requestId: req.requestId
  });
});

module.exports = { app };

// Do not remove this line
if (require.main === module) {
	app.listen(3000, () => console.log("Server listening on port 3000"));
}