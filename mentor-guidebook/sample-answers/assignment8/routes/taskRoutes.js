const express = require("express");
const router = express.Router();
const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController");
const jwtMiddleware = require("../middleware/jwtMiddleware");

// All task routes are protected with JWT middleware
router.use(jwtMiddleware);

router.get("/", index);
router.get("/:id", show);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;
