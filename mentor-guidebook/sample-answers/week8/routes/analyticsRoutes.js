const express = require('express');
const router = express.Router();
const { 
  getUserAnalytics, 
  getUsersWithTaskStats, 
  searchTasks 
} = require('../controllers/analyticsController');


router.get('/users/:id', getUserAnalytics);


router.get('/users', getUsersWithTaskStats);


router.get('/tasks/search', searchTasks);

module.exports = router;
