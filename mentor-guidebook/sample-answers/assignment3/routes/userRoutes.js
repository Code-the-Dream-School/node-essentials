const express = require('express');
const router = express.Router();
const { logon, register, logoff } = require('../controllers/userController');

router.post('/register', register);
router.post('/logon', logon);
router.post('/logoff', logoff);

module.exports = router; 