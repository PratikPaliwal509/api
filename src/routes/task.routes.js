const express = require('express');
const router = express.Router();

const taskController = require('../controllers/task.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

// Task APIs
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);

// Assignment
router.post('/:id/assign', taskController.assignUsers);

// Status
router.patch('/:id/status', taskController.changeStatus);

// Create subtask under a task
router.post('/:taskId/subtasks',  taskController.createSubtask );

// Get subtasks of a task
router.get('/:taskId/subtasks', taskController.getSubtasks);


module.exports = router;
