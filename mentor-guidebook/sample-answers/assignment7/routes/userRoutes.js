const express = require("express");
const router = express.Router();
const {
  logon,
  register,
  logoff,
  show,
} = require("../controllers/userController");

router.post("/register", register);
router.post("/logon", logon);
router.post("/logoff", logoff);
router.get("/:id", show);

module.exports = router;
