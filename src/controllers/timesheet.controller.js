const timesheetService = require('../services/timesheet.service')
const { successResponse, errorResponse } = require('../utils/response')

exports.getTimesheetByUser = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const timesheet = await timesheetService.getTimesheetByUser(Number(userId))
    return successResponse(res, 'TIMESHEET_FETCHED', timesheet)
  } catch (err) {
    next(err)
  }
}

// controllers/timesheet.controller.js

exports.getTeamTimesheet = async (req, res, next) => {
  try {
    const userId = req.user.user_id;
    const agencyId = req.user.agency.agency_id;

    const timesheet = await timesheetService.getTeamTimesheet(
      userId,
      agencyId
    );

    return successResponse(res, 'TEAM_TIMESHEET_FETCHED', timesheet);
  } catch (err) {
    console.log(err)
    next(err);
  }
};

