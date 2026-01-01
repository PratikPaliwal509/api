const prisma = require('../config/db');

// Create a new activity log
const createActivityLog = async ({
  user_id,
  user_email,
  user_name,
  action,
  entity_type,
  entity_id,
  entity_name,
  description,
  changes,
  ip_address,
  user_agent,
}) => {
  return await prisma.activityLog.create({
    data: {
      user_id,
      user_email,
      user_name,
      action,
      entity_type,
      entity_id,
      entity_name,
      description,
      changes,
      ip_address,
      user_agent,
    },
  });
};

// Get all logs with optional filters
const getActivityLogs = async (filters = {}) => {
  const where = {};
  if (filters.user_id) where.user_id = parseInt(filters.user_id);
  if (filters.entity_type) where.entity_type = filters.entity_type;
  if (filters.entity_id) where.entity_id = parseInt(filters.entity_id);

  return await prisma.activityLog.findMany({
    where,
    orderBy: { created_at: 'desc' },
  });
};

// Get single log by ID
const getActivityLogById = async (log_id) => {
  return await prisma.activityLog.findUnique({
    where: { log_id },
  });
};

module.exports = {
  createActivityLog,
  getActivityLogs,
  getActivityLogById,
};
