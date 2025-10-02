const express = require('express');
const router = express.Router();
const { 
  getUserAnalytics, 
  getUsersWithTaskStats, 
  searchTasks 
} = require('../controllers/analyticsController');

// User productivity analytics
router.get('/users/:id', getUserAnalytics);

// Users list with task statistics
router.get('/users', getUsersWithTaskStats);

// Task search with raw SQL
router.get('/tasks/search', searchTasks);

module.exports = router;
