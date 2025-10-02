const express = require('express');
const router = express.Router();
const { index, show, create, update, deleteTask, bulkCreate } = require('../controllers/taskController');
const { jwtMiddleware } = require('../passport/passport');

// All task routes are protected with JWT middleware
router.use(jwtMiddleware);

router.get('/', index);
router.get('/:id', show);
router.post('/', create);
router.post('/bulk', bulkCreate);
router.patch('/:id', update);
router.delete('/:id', deleteTask);

module.exports = router; 