const express = require('express');
const router = express.Router();
const { register, logoff, getUser, login } = require('../controllers/userController');
const jwtMiddleware = require('../middleware/jwtMiddleware');

router.post('/register', register);
router.post('/', register);
router.post('/logon', login);
router.post('/logoff', jwtMiddleware, logoff);
router.get('/:id', getUser);

module.exports = router; 