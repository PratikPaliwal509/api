const prisma = require('../config/db');

/**
 * Create Task / Subtask
 */
const createTask = async (data, userId) => {
  return prisma.task.create({
    data: {
      project_id: data.project_id,
      parent_task_id: data.parent_task_id || null,
      task_title: data.task_title,
      description: data.description,
      task_type: data.task_type,
      priority: data.priority,
      status: data.status,
      start_date: data.start_date,
      due_date: data.due_date,
      estimated_hours: data.estimated_hours,
      is_milestone: data.is_milestone,
      is_billable: data.is_billable,
      created_by: userId
    }
  });
};

/**
 * List Tasks (filters)
 */
const getTasks = async (filters) => {
  const where = {};

  if (filters.project_id) where.project_id = Number(filters.project_id);
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.assigned_to) {
    where.assignments = {
      some: { user_id: Number(filters.assigned_to), is_active: true }
    };
  }

  return prisma.task.findMany({
    where,
    include: {
      subtasks: true,
      assignments: { where: { is_active: true } }
    },
    orderBy: { created_at: 'desc' }
  });
};

/**
 * Task Details
 */
const getTaskById = async (taskId) => {
  return prisma.task.findUnique({
    where: { task_id: taskId },
    include: {
      subtasks: true,
      assignments: {
        include: { user: true }
      },
      timeLogs: true,
      comments: true,
      attachments: true
    }
  });
};

/**
 * Update Task
 */
const updateTask = async (taskId, data) => {
  return prisma.task.update({
    where: { task_id: taskId },
    data
  });
};

/**
 * Assign Users to Task
 */
const assignUsers = async (taskId, userIds, assignedBy) => {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    throw new Error('user_ids must be a non-empty array');
  }

  // normalize and validate IDs
  const ids = userIds.map((id) => Number(id)).filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) throw new Error('No valid user IDs provided');

  // ensure task exists
  const task = await prisma.task.findUnique({ where: { task_id: taskId } });
  if (!task) throw new Error('Task not found');

  // ensure users exist
  const users = await prisma.user.findMany({ where: { user_id: { in: ids } }, select: { user_id: true } });
  const foundIds = users.map((u) => u.user_id);
  const missing = ids.filter((id) => !foundIds.includes(id));
  if (missing.length > 0) {
    throw new Error(`Invalid user IDs: ${missing.join(',')}`);
  }

  const assignments = foundIds.map((userId) => ({
    task_id: taskId,
    user_id: userId,
    assigned_by: assignedBy
  }));

  return prisma.taskAssignment.createMany({
    data: assignments,
    skipDuplicates: true
  });
};

/**
 * Change Task Status
 */
const changeStatus = async (taskId, status) => {
  return prisma.task.update({
    where: { task_id: taskId },
    data: {
      status,
      completed_at: status === 'completed' ? new Date() : null
    }
  });
};


/**
 * Get Subtasks
 */
const getSubtasksByTaskId = async (taskId) => {
  return prisma.task.findMany({
    where: {
      parent_task_id: taskId
    },
    include: {
      assignments: {
        where: { is_active: true }
      }
    }
  });
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  assignUsers,
  changeStatus,
  getSubtasksByTaskId
};
