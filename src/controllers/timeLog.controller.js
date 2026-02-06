const timeLogService = require('../services/timeLog.service');
const { successResponse, errorResponse } = require('../utils/response');

// 
const getActiveTimer = async (req, res) => {
  try {
    const taskId = req.params.taskId
    const userId = req.user.user_id

    const log = await timeLogService.getActiveTimeLog({
      taskId,
      userId
    })
    res.status(200).json(log)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Failed to fetch active timer" })
  }
}

// START timer
const startTimer = async (req, res) => {
  try {
    const { taskId, project_id } = req.body
    const userId = req.user.user_id
    if (!taskId || !project_id) {
      return res
        .status(400)
        .json({ message: "taskId and projectId are required" })
    }

    const log = await timeLogService.startTimeLog({
      taskId,
      userId,
      project_id
    })

    res.status(201).json(log)
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: "Failed to start timer" })
  }
}

// STOP timer
const stopTimer = async (req, res) => {
  try {
    const { logId } = req.body
    const userId = req.user.user_id
    if (!logId) {
      return res.status(400).json({ message: "logId is required" })
    }

    const log = await timeLogService.stopTimeLog({
      logId,
      userId
    })
    if (!log) {
      return res.status(404).json({ message: "Active log not found" })
    }

    res.status(200).json(log)
  } catch (error) {
    res.status(500).json({ message: "Failed to stop timer" })
  }
}


const createOrUpdateTimeLog = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId)
    const userId = req.user.user_id // 👈 from token

    const timeLog = await timeLogService.createOrUpdateTimeLog(
      taskId,
      userId,
      req.body
    )

    return successResponse(
      res,
      'Time log saved successfully',
      timeLog,
      201
    )
  } catch (err) {
    return errorResponse(res, err.message)
  }
}
// 
// POST /tasks/:taskId/time-logs
const createTimeLog = async (req, res) => {
  try {
    const taskId = Number(req.params.taskId)

    // ✅ user_id comes from token
    const userId = req.user.user_id

    const timeLog = await timeLogService.createTimeLog(
      taskId,
      req.body,
      userId
    )

    return successResponse(
      res,
      "Time log created successfully",
      timeLog,
      201
    )
  } catch (err) {
    console.log(err)
    return errorResponse(res, err.message)
  }
}


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

/**
 * POST /api/time-logs/:id/approve
 */
const approveTimeLog = async (req, res) => {
  try {
    const { id } = req.params
    const approverId = req.user.user_id // from auth middleware

    const log = await timeLogService.approveTimeLog(id, approverId)

    res.status(200).json({
      success: true,
      message: 'Time log approved successfully',
      data: log,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}

/**
 * POST /api/time-logs/:id/reject
 */
const rejectTimeLog = async (req, res) => {
  try {
    const { id } = req.params

    const log = await timeLogService.rejectTimeLog(id)

    res.status(200).json({
      success: true,
      message: 'Time log rejected successfully',
      data: log,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    })
  }
}
module.exports = {
  getActiveTimer,
  startTimer,
  stopTimer,
  createOrUpdateTimeLog,
  createTimeLog,
  getTaskTimeLogs,
  updateTimeLog,
  deleteTimeLog,
  approveTimeLog,
  rejectTimeLog
};
