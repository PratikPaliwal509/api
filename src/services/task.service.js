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
  console.log(JSON.stringify(data))
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
      tags: data.labels || [],
      depends_on: data.depends_on || [],
      blocks: data.blocks || [],
    }
  });
};

/**
 * List Tasks (filters)
 */
const getTasks = async (user) => {
  const where = {};
  console.log(user)
  const scope = user?.role?.permissions?.tasks?.view;
  if (!scope) return [];

  switch (scope) {
    case 'all':
      // No restriction
      break;
    case 'agency':
      // No restriction
      break;

    case 'team':
      where.assignments = {
        some: {
          user: { team_id: user.team.team_id },
          is_active: true,
        },
      };
      break;


    //Selection method of department
    //       Task.task_id = 9001
    // └── Task.project_id = 100
    //     └── Project.project_id = 100
    //         └── ProjectMember.project_id = 100
    //             └── ProjectMember.user_id = 22
    //                 └── User.department_id = 3
    //                     └── Logged-in User.department_id = 3

    case 'department':
      where.project = {
        projectMembers: {
          some: {
            user: {
              department_id: user.department.department_id,
            },
          },
        },
      };
      break;


    case 'assigned':
      console.log("assigned")
      where.assignments = {
        some: {
          user_id: user.user_id,
          is_active: true,
        },
      };
      break;

    case 'own':
      where.created_by = user.user_id;
      break;

    default:
      where.OR = [
        { created_by: user.user_id },
        {
          assignments: {
            some: {
              user_id: user.user_id,
              is_active: true,
            },
          },
        },
      ];
      break;
  }

  return prisma.task.findMany({
    where,
    include: {
      subtasks: true,
      assignments: {
        where: { is_active: true },
        include: {
          user: {
            select: {
              user_id: true,
              first_name: true,
              last_name: true,
              full_name: true,
            },
          },
        },
      },
    },
    orderBy: { created_at: 'desc' },
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
console.log('Assigning users', userIds, 'to task', taskId, 'by', assignedBy);
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
  console.log('Assignments created', foundIds);

  const currentAssigned = task.assigned_to || []

  const updatedAssigned = [
    ...new Set([...currentAssigned, ...foundIds]),
  ]

  // update task.assigned_to as JSON array of all assigned users
  await prisma.task.update({
    where: { task_id: taskId },
    data: {
      assigned_to: updatedAssigned,
      assigned_date: new Date(),
    },
  })


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
  console.log(
    'task_id:', task_id,
    'user_id:', user_id,
    'removed_by:', removed_by,
    'user_role:', user_role
  )

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
          assigned_to: true, // ✅ FIX
        },
      },
    },
  })

  if (!assignment) {
    throw new Error('Active assignment not found')
  }

  const isSuperAdmin = user_role.role_name === 'Super Admin'
  const isAdmin = user_role.role_name === 'Admin'
  const isProjectManager = user_role.role_name === 'Project Manager'
  const isTaskOwner = assignment.task.created_by === removed_by
  const isAssignedBy = assignment.assigned_by === removed_by

  if (!isSuperAdmin && !isAdmin && !isProjectManager && !isTaskOwner && !isAssignedBy) {
    throw new Error('You are not allowed to remove this assignment')
  }

  const updatedAssignedTo = (assignment.task.assigned_to || [])
    .filter(id => Number(id) !== Number(user_id))

  const [updatedAssignment, updatedTask] = await prisma.$transaction([
    prisma.taskAssignment.update({
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
    }),

    prisma.task.update({
      where: { task_id },
      data: {
        assigned_to: updatedAssignedTo,
        updated_at: new Date(),
      },
    }),
  ])

  return {
    assignment: updatedAssignment,
    task: updatedTask,
  }
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
