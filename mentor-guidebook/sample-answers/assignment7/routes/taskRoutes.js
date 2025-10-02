const express = require('express');
const router = express.Router();
const { index, show, create, update, deleteTask, bulkCreate } = require('../controllers/taskController');

router.get('/', index);
router.get('/:id', show);
router.post('/', create);
router.post('/bulk', bulkCreate);
router.patch('/:id', update);
router.delete('/:id', deleteTask);

module.exports = router; 