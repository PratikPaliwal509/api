const express = require('express');
const router = express.Router();

const teamsController = require('../controllers/teams.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Create team
router.post('/', authMiddleware, teamsController.createTeam);

// List teams (filters: agency_id, department_id)
router.get('/', authMiddleware, teamsController.getTeams);

// Team details
router.get('/:id', authMiddleware, teamsController.getTeamById);

// Update team
router.put('/:id', authMiddleware, teamsController.updateTeam);

// Activate / Deactivate team
router.patch('/:id/status', authMiddleware, teamsController.updateTeamStatus);

// Assign / Change team lead
router.patch('/:id/team-lead', authMiddleware, teamsController.updateTeamLead);

module.exports = router;
