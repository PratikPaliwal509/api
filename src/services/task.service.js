const prisma = require('../config/db');
const NotificationService = require('../services/notification.service');
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
  const task = await prisma.task.create({
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

  await NotificationService.createNotification({
    user_id: userId, // who created task
    notification_type: 'TASK_CREATED',
    title: 'New Task Created',
    message: `Task "${task.task_title}" (${task.task_number}) has been created.`,
    entity_type: 'TASK',
    entity_id: task.task_id,
    action_url: `/projects/${task.project_id}/tasks/${task.task_id}`,

    // delivery
    sent_via_email: true,
    sent_via_push: false,

    // admin config
    send_to_admin: true,
    admin_message: `New task created: "${task.task_title}" (${task.task_number}) in project ID ${task.project_id}`
  })
  return task;
};

/**
 * List Tasks (filters)
 */
const getTasks = async (user) => {
  const where = {};
  const scope = user?.role?.permissions?.tasks?.view;
  if (!scope) return [];

  switch (scope) {
    case 'all':
      // No restriction
      break;
    case 'agency':
      // No restriction
      break;

    case 'team': {
      const teamId = user?.team?.team_id;

      if (!teamId) {
        throw new Error('User is not assigned to any team');
        // or use a custom error class / HTTP error
      }

      where.assignments = {
        some: {
          user: { team_id: teamId },
          is_active: true,
        },
      };
      break;
    }



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
        // where: { is_active: true },
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

  for (const userId of userIds) {
    await NotificationService.createNotification({
      user_id: userId,
      notification_type: 'TASK_ASSIGNED',
      title: 'Task Assigned to You',
      message: `You have been assigned to task "${task.task_title}" (${task.task_number}).`,
      entity_type: 'TASK',
      entity_id: task.task_id,
      action_url: `/projects/${task.project_id}/tasks/${task.task_id}`,

      sent_via_email: true,
      sent_via_push: false,

      // 🔔 also notify admins
      send_to_admin: true,
      admin_message: `User ID ${userId} was assigned to task "${task.task_title}" (${task.task_number}).`
    })
  }


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

// Need to add logic to check preiously added users not assign again same task it is giving error 
const removeTaskAssignment = async ({
  task_id,
  user_id,
  removed_by,
  user_role,
}) => {

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
    prisma.taskAssignment.updateMany({
      where: {
        task_id,
        user_id,
        is_active: true,
      },
      data: {
        is_active: false,
        removed_at: new Date(),
        removed_by,
      },
    })
    ,

    // prisma.task.update({
    //   where: { task_id },
    //   data: {
    //     assigned_to: updatedAssignedTo,
    //     updated_at: new Date(),
    //   },
    // }),
  ])

  return {
    assignment: updatedAssignment,
    task: updatedTask,
  }
}



const getLast7Days = () => {
  return [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });
};

/* ---------- Service ---------- */

const getTasksOverview = async () => {
  const days = getLast7Days();

  /* ---------- TOTAL COUNTS (for cards) ---------- */

  const [
    totalTasks,
    totalCompletedTasks,
    totalProjects,
    totalCompletedProjects,
  ] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({
      where: { status: 'completed' },
    }),
    prisma.project.count(),
    prisma.project.count({
      where: { status: 'finished' },
    }),
  ]);

  /* ---------- DAILY COUNTS (for charts) ---------- */

  const completedTasksPerDay = await Promise.all(
    days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      return prisma.task.count({
        where: {
          status: 'completed',
          completed_at: {
            gte: day,
            lt: nextDay,
          },
        },
      });
    })
  );

  const newTasksPerDay = await Promise.all(
    days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      return prisma.task.count({
        where: {
          created_at: {
            gte: day,
            lt: nextDay,
          },
        },
      });
    })
  );

  const completedProjectsPerDay = await Promise.all(
    days.map(async (day) => {
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      return prisma.project.count({
        where: {
          status: 'finished',
          updated_at: {
            gte: day,
            lt: nextDay,
          },
        },
      });
    })
  );
  /* ---------- RESPONSE ---------- */

  return [
    {
      title: 'Tasks Completed',
      total_number: totalTasks,
      completed_number: totalCompletedTasks,
      progress: totalTasks
        ? Math.round((totalCompletedTasks / totalTasks) * 100)
        : 0,
      chartColor: '#3454d1',
      color: 'primary',
      chartData: completedTasksPerDay,
    },
    {
      title: 'New Tasks',
      total_number: totalTasks,
      completed_number: newTasksPerDay.reduce((a, b) => a + b, 0),
      progress: totalTasks
        ? Math.round(
            (newTasksPerDay.reduce((a, b) => a + b, 0) / totalTasks) * 100
          )
        : 0,
      chartColor: '#25b865',
      color: 'success',
      chartData: newTasksPerDay,
    },
    {
      title: 'Project Done',
      total_number: totalProjects,
      completed_number: totalCompletedProjects,
      progress: totalProjects
        ? Math.round(
            (totalCompletedProjects / totalProjects) * 100
          )
        : 0,
      chartColor: '#d13b4c',
      color: 'danger',
      chartData: completedProjectsPerDay,
    },
  ];
};

// services/task.service.js
const getProjectTasks = async (projectId) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        project_id: Number(projectId),
      },
      select: {
        task_id: true,
        task_title: true,
        task_number: true,
        description: true,
        task_type: true,
        priority: true,
        status: true,
        progress_percentage: true,
        start_date: true,
        due_date: true,
        completed_at: true,
        estimated_hours: true,
        actual_hours: true,
        is_billable: true,
        is_milestone: true,
        is_recurring: true,
        parent_task_id: true,
        depends_on: true,
        blocks: true,
        assigned_to: true,
        project_id: true,
        created_by: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: [
        { parent_task_id: 'asc' },
        { start_date: 'asc' },
      ],
    })

    // ⛑️ HARDEN DATES (NO SHAPE CHANGE)
    return tasks.map((task) => ({
      ...task,
      start_date: task.start_date ?? task.created_at,
      due_date:
        task.due_date ??
        task.start_date ??
        task.created_at,
    }))
  } catch (error) {
    console.error('Error fetching project tasks:', error)
    throw new Error('Failed to fetch project tasks')
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
  addChecklistToTask,
  getTasksOverview,
  getProjectTasks
};
