const express = require("express");
const router = express.Router();
const {
  index,
  show,
  create,
  update,
  deleteTask,
  bulkCreate, // Add this import
} = require("../controllers/taskController");

router.use(require("../middleware/jwtMiddleware"));

router.post("/bulk", bulkCreate);
router.get("/", index);
router.get("/:id", show);
router.post("/", create);
router.patch("/:id", update);
router.delete("/:id", deleteTask);

module.exports = router;
