const timeLogService = require('../services/timeLog.service');
const { successResponse, errorResponse } = require('../utils/response');

// POST /tasks/:taskId/time-logs
const createTimeLog = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);

    const timeLog = await timeLogService.createTimeLog(
      taskId,
      req.body,
      req.user.user_id
    );

    return successResponse(res, 'Time log created successfully', timeLog, 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// GET /tasks/:taskId/time-logs
const getTaskTimeLogs = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);

    const logs = await timeLogService.getTimeLogsByTask(taskId);

    return successResponse(res, 'Time logs fetched successfully', logs);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// PUT /time-logs/:id
const updateTimeLog = async (req, res) => {
  try {
    const logId = Number(req.params.id);

    const updatedLog = await timeLogService.updateTimeLog(
      logId,
      req.body
    );

    return successResponse(res, 'Time log updated successfully', updatedLog);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// DELETE /time-logs/:id
const deleteTimeLog = async (req, res) => {
  try {
    const logId = Number(req.params.id);

    await timeLogService.deleteTimeLog(logId);

    return successResponse(res, 'Time log deleted successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

// PATCH /time-logs/:id/approve
const approveTimeLog = async (req, res) => {
  try {
    const logId = Number(req.params.id);

    const log = await timeLogService.approveTimeLog(
      logId,
      req.user.user_id
    );

    return successResponse(res, 'Time log approved', log);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  createTimeLog,
  getTaskTimeLogs,
  updateTimeLog,
  deleteTimeLog,
  approveTimeLog
};
