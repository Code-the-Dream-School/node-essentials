const express = require('express');
const router = express.Router();
const { login, register, logoff, getUser } = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.post('/logoff', logoff);
router.get('/:id', getUser);

module.exports = router; 