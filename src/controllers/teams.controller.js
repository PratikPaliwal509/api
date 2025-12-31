const teamsService = require('../services/teams.service');
const { successResponse } = require('../utils/response');

// CREATE TEAM
exports.createTeam = async (req, res, next) => {
  try {
    const team = await teamsService.createTeam(req.body);
    return successResponse(res, 'Team created successfully', team);
  } catch (error) {
    next(error);
  }
};

// LIST TEAMS
exports.getTeams = async (req, res, next) => {
  try {
    const teams = await teamsService.getTeams(req.query);
    return successResponse(res, 'Teams fetched successfully', teams);
  } catch (error) {
    next(error);
  }
};

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
