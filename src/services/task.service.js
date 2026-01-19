const prisma = require('../config/db');

/**
 * Create Task / Subtask
 */
const createTask = async (data, userId) => {
   const lastTask = await prisma.task.findFirst({
    where: { project_id: data.project_id },
    orderBy: { task_id: 'desc' },
    select: { task_number: true },
  })
let nextNumber = 1

if (lastTask?.task_number) {
  const parts = lastTask.task_number.split('-')
  nextNumber = Number(parts[1]) + 1
}

const taskNumber = `TASK-${String(nextNumber).padStart(4, '0')}`

  return prisma.task.create({
    data: {
      project_id: data.project_id,
      parent_task_id: data.parent_task_id || null,
      task_title: data.task_title,
      description: data.description,
      task_number: taskNumber,
      task_type: data.task_type,
      priority: data.priority,
      status: data.status,
      start_date: data.start_date,
      due_date: data.due_date,
      estimated_hours: data.estimated_hours,
      is_milestone: data.is_milestone,
      is_billable: data.is_billable,
      created_by: userId,
      tags: data.labels || []
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
      assignments: { where: { is_active: true },
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              full_name:true,
            },
          },
     }
     },
       
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

  const ids = userIds
    .map((id) => Number(id))
    .filter((n) => Number.isInteger(n) && n > 0);

  if (ids.length === 0) throw new Error('No valid user IDs provided');

  const task = await prisma.task.findUnique({ where: { task_id: taskId } });
  if (!task) throw new Error('Task not found');

  const users = await prisma.user.findMany({
    where: { user_id: { in: ids } },
    select: { user_id: true },
  });

  const foundIds = users.map((u) => u.user_id);
  const missing = ids.filter((id) => !foundIds.includes(id));
  if (missing.length > 0) {
    throw new Error(`Invalid user IDs: ${missing.join(',')}`);
  }

  // create task assignments
  const assignments = foundIds.map((userId) => ({
    task_id: taskId,
    user_id: userId,
    assigned_by: assignedBy,
  }));

  await prisma.taskAssignment.createMany({
    data: assignments,
    skipDuplicates: true,
  });

  // update task.assigned_to as JSON array of all assigned users
  await prisma.task.update({
    where: { task_id: taskId },
    data: { assigned_to: foundIds, assigned_date: new Date(), },
  });

  return { success: true, assigned_user_ids: foundIds };
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

const addChecklistToTask = async (taskId, checklist) => {
  // Ensure task exists
  const task = await prisma.task.findUnique({
    where: { task_id: taskId }
  })

  if (!task) {
    throw new Error('Task not found')
  }

  // Update checklist JSON
  return prisma.task.update({
    where: { task_id: taskId },
    data: {
      checklist
    }
  })
}


const removeTaskAssignment = async ({
  task_id,
  user_id,
  removed_by,
  user_role,
}) => {

  // 1️⃣ Fetch assignment with relations
  const assignment = await prisma.taskAssignment.findFirst({
    where: {
      task_id,
      user_id,
      is_active: true,
    },
    include: {
      task: {
        select: {
          created_by: true,
        },
      },
    },
  })

  if (!assignment) {
    throw new Error('Active assignment not found')
  }

  // 2️⃣ Role / Permission check
  const isAdmin = user_role === 'admin'
  const isProjectManager = user_role === 'project_manager'
  const isTaskOwner = assignment.task.created_by === removed_by
  const isAssignedBy = assignment.assigned_by === removed_by

  if (!isAdmin && !isProjectManager && !isTaskOwner && !isAssignedBy) {
    throw new Error('You are not allowed to remove this assignment')
  }

  // 3️⃣ Soft delete assignment
  return prisma.taskAssignment.update({
    where: {
      task_id_user_id_is_active: {
        task_id,
        user_id,
        is_active: true,
      },
    },
    data: {
      is_active: false,
      removed_at: new Date(),
      removed_by,
    },
  })
}
module.exports = {
  createTask,
  removeTaskAssignment,
  getTasks,
  getTaskById,
  updateTask,
  assignUsers,
  changeStatus,
  getSubtasksByTaskId,
  addChecklistToTask
};
