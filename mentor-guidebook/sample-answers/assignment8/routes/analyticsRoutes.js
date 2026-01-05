const express = require("express");
const router = express.Router();
const {
  getUserAnalytics,
  getUsersWithStats,
  searchTasks,
} = require("../controllers/analyticsController");

router.use(require("../middleware/jwtMiddleware"));

// GET /api/analytics/users/:id - User productivity analytics
router.get("/users/:id", getUserAnalytics);

// GET /api/analytics/users - Users with task statistics and pagination
router.get("/users", getUsersWithStats);

// GET /api/analytics/tasks/search - Task search with raw SQL
router.get("/tasks/search", searchTasks);

module.exports = router;
