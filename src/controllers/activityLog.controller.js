const activityLogService = require('../services/activityLog.service');

// Get all activity logs
const getActivityLogs = async (req, res) => {
  try {
    const { user_id, entity_type, entity_id } = req.query; // optional filters
    const logs = await activityLogService.getActivityLogs({ user_id, entity_type, entity_id });
    res.json({ success: true, data: logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get single log by ID
const getActivityLogById = async (req, res) => {
  try {
    const logId = parseInt(req.params.id);
    const log = await activityLogService.getActivityLogById(logId);
    res.json({ success: true, data: log });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getActivityLogs,
  getActivityLogById,
};
