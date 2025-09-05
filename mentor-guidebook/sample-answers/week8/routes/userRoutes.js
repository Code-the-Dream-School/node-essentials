const express = require('express');
const router = express.Router();
const { register, logoff, getUser } = require('../controllers/userController');
const { logonRouteHandler, jwtMiddleware } = require('../passport/passport');

router.post('/register', register);
router.post('/', register);
router.post('/logon', logonRouteHandler);
router.post('/logoff', jwtMiddleware, logoff);
router.get('/:id', getUser);

module.exports = router; 