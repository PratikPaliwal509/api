const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const logActivity = require('../middlewares/activityLog.middleware');
const projectController = require('../controllers/project.controller');

router.get("/notes", authMiddleware, projectController.getProjectNotes)
// Project CRUD
router.post('/notes', authMiddleware, projectController.addProjectNote)

// router.get("/managed", authMiddleware, projectController.getManagedProjects);
router.get("/without-notes", authMiddleware, projectController.getProjectsWithoutNotes)

router.post('/', authMiddleware, logActivity({
    action: 'CREATE',
    entityType: 'Project',
    getEntityId: (req, res, body) => body.data.project_id,
    getEntityName: (req, res, body) => body.data.project_name,
    getChanges: (req, res, body) => body.data
  }), projectController.createProject);

router.get('/', authMiddleware, projectController.getProjects);

router.get('/:id', authMiddleware, projectController.getProjectById);

router.put('/:id', authMiddleware, logActivity({
    action: 'UPDATE',
    entityType: 'Project',
    getEntityId: (req, res, body) => body.data.project_id,
    getEntityName: (req, res, body) => body.data.project_name,
    getChanges: (req, res, body) => body.data
  }),projectController.updateProject);

// Members
router.post('/:id/members', authMiddleware, logActivity({
    action: 'ADD MEMBER',
    entityType: 'Project',
    getEntityId: (req, res, body) => body.data.project_id,
    getEntityName: (req, res, body) => body.data.project_name,
    getChanges: (req, res, body) => body.data
  }), projectController.addProjectMember);

// router.delete('/:id/members/:userId', authMiddleware,  logActivity({
//     action: 'REMOVE MEMBER',
//     entityType: 'Project',
//     getEntityId: (req) => Number(req.params.id),
//     getDescription: (req) =>
//       `Removed user ${req.params.userId} from project`,
//     getChanges: (req) => ({ removed_user_id: Number(req.params.userId) })
//   }), projectController.removeProjectMember);

  
// PATCH /api/projects/:id/status

router.patch('/:id/status', authMiddleware, projectController.updateProjectStatus)


router.delete(
  '/:projectId/members/:userId',
  authMiddleware,
  projectController.leaveProjectController
)
router.get(
  "/:project_id/users",
  authMiddleware,
  projectController.getProjectUsers
);


module.exports = router;
