const express = require("express");
const router = express.Router();
const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");

router.get("/users/:id", getUserAnalytics);
router.get("/users", getUsersWithStats);
router.get("/tasks/search", searchTasks);

module.exports = router;

