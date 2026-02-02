const express = require('express');
const router = express.Router();

const taskController = require('../controllers/task.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const logActivity = require('../middlewares/activityLog.middleware');
router.use(authMiddleware);

// Task APIs
router.post('/', logActivity({
    action: 'CREATE TASK',
    entityType: 'Task',
    getEntityId: (req, res, response) => response?.data?.task_id,
    getEntityName: (req, res, response) => response?.data?.task_title,
    getChanges: (req, res, response) => response?.data
  }),  taskController.createTask);

router.get('/', taskController.getTasks);

// Update: Get tasks overview
router.get('/overview', authMiddleware, taskController.getTasksOverview);
router.get('/:id', taskController.getTaskById);
router.get('/project/:id', taskController.getProjectTasks);

//UPDATE TASK
router.put('/:id', logActivity({
    action: 'UPDATE TASK',
    entityType: 'Task',
    getEntityId: (req, res, body) => Number(req.params.id),  // ← task ID from URL
    getEntityName: (req, res, body) => body?.data?.task_title || 'Task',
    getChanges: (req, res, body) => ({ assigned_users: body?.data?.user_ids || req.body.user_ids })
  }),  taskController.updateTask);

// Assignment
router.post('/:id/assign',  logActivity({
    action: 'ASSIGN TASK',
    entityType: 'Task',
    getEntityId: (req, res, body) => Number(req.params.id),  // ← task ID from URL
    getEntityName: (req, res, body) => body?.data?.task_title || 'Task',
    getChanges: (req, res, body) => ({ assigned_users: body?.data?.user_ids || req.body.user_ids })
  }), taskController.assignUsers);

// UPDATE Status
router.patch('/:id/status',   logActivity({
    action: 'UPDATE STATUS',
    entityType: 'Task',
    getEntityId: (req, res, body) => Number(req.params.id),  // ← task ID from URL
    getEntityName: (req, res, body) => body?.data?.task_title || 'Task',
    getChanges: (req, res, body) => ({ assigned_users: body?.data?.user_ids || req.body.user_ids })
  }), taskController.changeStatus,);

// Create subtask under a task
router.post('/:taskId/subtasks', logActivity({
    action: 'CREATE SUBTASK',
    entityType: 'Subtask',
    getEntityId: (req, res, response) => response?.data?.task_id,
    getEntityName: (req, res, response) => response?.data?.task_title,
    getChanges: (req, res, response) => response?.data
  }), taskController.createSubtask, );
// Get subtasks of a task
router.get('/:taskId/subtasks', taskController.getSubtasks);

router.post('/:taskId/checklist', taskController.addTaskChecklist)

router.patch('/:taskId/assignments/:userId/remove', authMiddleware, taskController.removeAssignment, )


module.exports = router;
