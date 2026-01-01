const prisma = require('../config/db');

/**
 * Create / Start Time Log
 */
const createTimeLog = async (taskId, data, userId) => {
  return prisma.timeLog.create({
    data: {
      task_id: taskId,
      project_id: data.project_id,
      user_id: userId,
      start_time: data.start_time || new Date(),
      description: data.description,
      is_billable: data.is_billable,
      hourly_rate: data.hourly_rate,
      log_type: data.log_type || 'manual'
    }
  });
};

/**
 * Get Time Logs by Task
 */
const getTimeLogsByTask = async (taskId) => {
  return prisma.timeLog.findMany({
    where: { task_id: taskId },
    include: {
      user: true
    },
    orderBy: { start_time: 'desc' }
  });
};

/**
 * Update / Stop Time Log
 */
const updateTimeLog = async (logId, data) => {
  let durationMinutes = data.duration_minutes;

  if (data.start_time && data.end_time) {
    const start = new Date(data.start_time);
    const end = new Date(data.end_time);
    durationMinutes = Math.floor((end - start) / 60000);
  }

  return prisma.timeLog.update({
    where: { log_id: logId },
    data: {
      end_time: data.end_time,
      duration_minutes: durationMinutes,
      description: data.description,
      is_billable: data.is_billable,
      hourly_rate: data.hourly_rate
    }
  });
};

/**
 * Delete Time Log
 */
const deleteTimeLog = async (logId) => {
  return prisma.timeLog.delete({
    where: { log_id: logId }
  });
};

/**
 * Approve Time Log
 */
const approveTimeLog = async (logId, approvedBy) => {
  return prisma.timeLog.update({
    where: { log_id: logId },
    data: {
      is_approved: true,
      approved_by: approvedBy,
      approved_at: new Date()
    }
  });
};

module.exports = {
  createTimeLog,
  getTimeLogsByTask,
  updateTimeLog,
  deleteTimeLog,
  approveTimeLog
};
