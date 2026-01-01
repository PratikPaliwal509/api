const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const projectController = require('../controllers/project.controller');

// Project CRUD
router.post('/projects', authMiddleware, projectController.createProject);

router.get('/projects', authMiddleware, projectController.getProjects);
router.get('/projects/:id', authMiddleware, projectController.getProjectById);
router.put('/projects/:id', authMiddleware, projectController.updateProject);

// Members
router.post('/projects/:id/members', authMiddleware, projectController.addProjectMember);
router.delete('/projects/:id/members/:userId', authMiddleware, projectController.removeProjectMember);

module.exports = router;
