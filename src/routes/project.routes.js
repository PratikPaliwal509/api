const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const logActivity = require('../middlewares/activityLog.middleware');
const projectController = require('../controllers/project.controller');

// Project CRUD
router.post('/projects', authMiddleware, logActivity({
    action: 'CREATE',
    entityType: 'Project',
    getEntityId: (req, res, body) => body.data.project_id,
    getEntityName: (req, res, body) => body.data.project_name,
    getChanges: (req, res, body) => body.data
  }), projectController.createProject);

router.get('/projects', authMiddleware, projectController.getProjects);

router.get('/projects/:id', authMiddleware, projectController.getProjectById);

router.put('/projects/:id', authMiddleware, logActivity({
    action: 'UPDATE',
    entityType: 'Project',
    getEntityId: (req, res, body) => body.data.project_id,
    getEntityName: (req, res, body) => body.data.project_name,
    getChanges: (req, res, body) => body.data
  }),projectController.updateProject);

// Members
router.post('/projects/:id/members', authMiddleware, logActivity({
    action: 'ADD MEMBER',
    entityType: 'Project',
    getEntityId: (req, res, body) => body.data.project_id,
    getEntityName: (req, res, body) => body.data.project_name,
    getChanges: (req, res, body) => body.data
  }), projectController.addProjectMember);

router.delete('/projects/:id/members/:userId', authMiddleware,  logActivity({
    action: 'REMOVE MEMBER',
    entityType: 'Project',
    getEntityId: (req) => Number(req.params.id),
    getDescription: (req) =>
      `Removed user ${req.params.userId} from project`,
    getChanges: (req) => ({ removed_user_id: Number(req.params.userId) })
  }), projectController.removeProjectMember);

  
// PATCH /api/projects/:id/status
router.patch('/projects/:id/status', authMiddleware, projectController.updateProjectStatus)

module.exports = router;
