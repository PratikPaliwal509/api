const express = require('express');
const router = express.Router();

const teamsController = require('../controllers/teams.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const logActivity = require('../middlewares/activityLog.middleware');

// Create team
router.post('/', authMiddleware, logActivity({
    action: 'CREATE TEAM',
    entityType: 'Team',
    getEntityId: (req, res, response) => response?.data?.team_id,
    getEntityName: (req, res, response) => response?.data?.team_name,
    getChanges: (req, res, response) => response?.data
  }), teamsController.createTeam);

// List teams (filters: agency_id, department_id)
router.get('/', authMiddleware, teamsController.getTeams);

// Team details
router.get('/:id', authMiddleware, teamsController.getTeamById);

// Update team
router.put('/:id', authMiddleware, logActivity({
    action: 'UPDATE TEAM',
    entityType: 'Team',
    getEntityId: (req) => Number(req.params.id),
    getEntityName: (req, res, response) =>
      response?.data?.team_name || 'Team',
    getChanges: (req, res, response) => response?.data || req.body
  }), teamsController.updateTeam);

// Activate / Deactivate team
router.patch('/:id/status', authMiddleware, logActivity({
    action: 'UPDATE TEAM STATUS',
    entityType: 'Team',
    getEntityId: (req) => Number(req.params.id),
    getEntityName: (req, res, response) =>
      response?.data?.team_name || 'Team',
    getChanges: (req, res, response) => ({
      status: response?.data?.status || req.body.status
    })
  }), teamsController.updateTeamStatus);

// Assign / Change team lead
router.patch('/:id/team-lead', authMiddleware, logActivity({
    action: 'UPDATE TEAM LEAD',
    entityType: 'Team',
    getEntityId: (req) => Number(req.params.id),
    getEntityName: (req, res, response) =>
      response?.data?.team_name || 'Team',
    getChanges: (req, res, response) => ({
      team_lead_id:
        response?.data?.team_lead_id || req.body.team_lead_id
    })
  }), teamsController.updateTeamLead);


  router.post(
  '/:team_id/members',
  authMiddleware,
  teamsController.addTeamMembers
);

module.exports = router;
