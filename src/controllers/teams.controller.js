const teamsService = require('../services/teams.service');
const { successResponse } = require('../utils/response');
const usersService = require('../services/users.service')
// CREATE TEAM

exports.createTeam = async (req, res, next) => {
  try {
    const userId = req.user.user_id;

    const user = await usersService.getUserById(userId);
    if (!user || !user.agency_id) {
      return res.status(400).json({
        message: 'Agency not found for this user',
      });
    }

    const teamData = {
      ...req.body,
      agency_id: user.agency_id,
    };

    const team = await teamsService.createTeam(teamData);
    return successResponse(res, 'Team created successfully', team);
  } catch (error) {
    console.error('Create Team Error:', error)

    const map = {
      TEAM_REQUIRED_FIELDS_MISSING: 'Team name is required',
      AGENCY_NOT_FOUND: 'Agency not found',
      DEPARTMENT_NOT_FOUND: 'Invalid department selected',
      TEAM_LEAD_NOT_FOUND: 'Invalid team lead',
      TEAM_CODE_ALREADY_EXISTS: 'Team code already exists',
    }

    return res.status(400).json({
      success: false,
      message: map[error.message] || 'Failed to create team',
    })
  }
};

// LIST TEAMS
// controllers/teams.controller.js

// controllers/teams.controller.js

exports.getTeams = async (req, res, next) => {
  try {
    const teams = await teamsService.getTeams(req.user)
    return successResponse(res, 'Teams fetched successfully', teams)
  } catch (error) {
    next(error)
  }
}


// TEAM DETAILS
exports.getTeamById = async (req, res, next) => {
  try {
    const team = await teamsService.getTeamById(req.params.id);
    return successResponse(res, 'Team fetched successfully', team);
  } catch (error) {
    next(error);
  }
};

// UPDATE TEAM
exports.updateTeam = async (req, res, next) => {
  try {
    const team = await teamsService.updateTeam(
      req.params.id,
      req.body
    );
    return successResponse(res, 'Team updated successfully', team);
  } catch (error) {
    next(error);
  }
};

// ACTIVATE / DEACTIVATE TEAM
exports.updateTeamStatus = async (req, res, next) => {
  try {
    const team = await teamsService.updateTeamStatus(
      req.params.id,
      req.body.is_active
    );
    return successResponse(res, 'Team status updated successfully', team);
  } catch (error) {
    next(error);
  }
};

// UPDATE TEAM LEAD
exports.updateTeamLead = async (req, res, next) => {
  try {
    const team = await teamsService.updateTeamLead(
      req.params.id,
      req.body.team_lead_id
    );
    return successResponse(res, 'Team lead updated successfully', team);
  } catch (error) {
    next(error);
  }
};

exports.addTeamMembers = async (req, res, next) => {
  try {
    const { team_id } = req.params;
    const { user_ids } = req.body;

    const result = await teamsService.addTeamMembers({
      team_id,
      user_ids
    });

    return successResponse(
      res,
      'Team members added successfully',
      result
    );
  } catch (error) {
    next(error);
  }
};
