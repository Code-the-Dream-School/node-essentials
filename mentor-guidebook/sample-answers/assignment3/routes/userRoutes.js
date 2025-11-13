const express = require('express');
const router = express.Router();
const { login, register, logoff } = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.post('/logoff', logoff);

module.exports = router; 