const prisma = require('../config/db');
const NotificationService = require('../services/notification.service');
/* ---------------- HELPERS ---------------- */
const throwError = (code, message, field = null) => {
  const err = new Error(message);
  err.code = code;
  err.field = field;
  throw err;
};

const sanitizeDecimal = (value) => {
  if (value === "" || value === undefined) return null
  return value
}

const isValidNumber = (v) => Number.isInteger(v) && v > 0;

const PROJECT_TYPES = Object.freeze({
  SOFTWARE: 'SOFTWARE',
  CONSULTANCY: 'CONSULTING',
  HARDWARE: 'HARDWARE',
})

const PROJECT_TYPE_PREFIX_MAP = Object.freeze({
  [PROJECT_TYPES.SOFTWARE]: 'SD',
  [PROJECT_TYPES.CONSULTANCY]: 'CONS',
  [PROJECT_TYPES.HARDWARE]: 'HW',
})

const getPrefixFromProjectType = (project_type) => {
  const prefix = PROJECT_TYPE_PREFIX_MAP[project_type]
  if (!prefix) {
    throwError(
      'VALIDATION_ERROR',
      'Invalid project_type. Allowed: Software Development, Consultancy',
      'project_type'
    )
  }
  return prefix
}

const generateProjectCode = async ({ agency_id, prefix }) => {
  const lastProject = await prisma.project.findFirst({
    where: {
      agency_id,
      project_code: {
        startsWith: prefix + '-',
      },
    },
    orderBy: {
      created_at: 'desc',
    },
    select: {
      project_code: true,
    },
  })

  let nextNumber = 1

  if (lastProject?.project_code) {
    const lastNumber = parseInt(lastProject.project_code.split('-')[1], 10)
    if (!isNaN(lastNumber)) {
      nextNumber = lastNumber + 1
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, '0')}`
}


/* ---------------- CREATE PROJECT ---------------- */
exports.createProject = async (data, userId, agencyId) => {
  const {
    agency_id,
    client_id,
    project_name,
    project_manager_id,
    project_type,
    start_date,
    end_date,
  } = data

  agencyId = agency_id

  // Required fields
  if (!agency_id) throwError('VALIDATION_ERROR', 'agency_id is required', 'agency_id')
  if (!client_id) throwError('VALIDATION_ERROR', 'client_id is required', 'client_id')
  if (!project_name) throwError('VALIDATION_ERROR', 'project_name is required', 'project_name')
  if (!project_manager_id) throwError('VALIDATION_ERROR', 'project_manager_id is required', 'project_manager_id')
  if (!project_type) throwError('VALIDATION_ERROR', 'project_type is required', 'project_type')

  // ID validation
  if (![agency_id, client_id, project_manager_id].every(isValidNumber)) {
    throwError('VALIDATION_ERROR', 'Invalid numeric ID')
  }

  // Date validation
  if (start_date && isNaN(Date.parse(start_date))) {
    throwError('VALIDATION_ERROR', 'Invalid start_date', 'start_date')
  }
  if (end_date && isNaN(Date.parse(end_date))) {
    throwError('VALIDATION_ERROR', 'Invalid end_date', 'end_date')
  }
  if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
    throwError('VALIDATION_ERROR', 'end_date cannot be before start_date', 'end_date')
  }

  // Prefix + project code
  const task_prefix = getPrefixFromProjectType(project_type)
  const project_code = await generateProjectCode({
    agency_id,
    prefix: task_prefix,
  })

  // FK checks
  const [agency, client, manager] = await Promise.all([
    prisma.agency.findUnique({ where: { agency_id } }),
    prisma.client.findUnique({ where: { client_id } }),
    prisma.user.findUnique({ where: { user_id: project_manager_id } }),
  ])

  if (!agency) throwError('NOTUN_FOD', 'Agency not found', 'agency_id')
  if (!client) throwError('NOT_FOUND', 'Client not found', 'client_id')
  if (!manager) throwError('NOT_FOUND', 'Project manager not found', 'project_manager_id')

  if (agency_id !== agencyId) {
    throwError('FORBIDDEN', 'Cannot create project outside your agency')
  }

  const project = await prisma.project.create({
    data: {
      ...data,
      estimated_hours: sanitizeDecimal(data.estimated_hours),
      project_code,   // ✅ auto
      task_prefix,    // ✅ auto
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      created_by: userId,
    },
  })

  await NotificationService.createNotification({
    user_id: project.project_manager_id, // who receives it
    notification_type: 'PROJECT_CREATED',
    title: 'Project Created',
    message: `Project "${project.project_name}" has been created successfully.`,
    entity_type: 'PROJECT',
    entity_id: project.project_id,
    action_url: `/projects/${project.project_id}`,
    sent_via_email: true,
    send_to_admin: true,
    admin_message: `Admin alert: Project "${project.project_name}" has been created.`
  })

  return project;
}

/* ---------------- GET PROJECTS ---------------- */
exports.getProjectsByScope = async (user) => {
  const scope = user?.role?.permissions?.projects?.view;
  if (!scope) return [];

  const where = {
    // agency_id: user.agency_id,
    // is_active: true
  };

  switch (scope) {
    case 'all': break;

    case 'agency':
      where.agency_id = user.agency.agency_id;
      where.is_active = true;
      // agency filter already applied
      break;

    case 'assigned':
      where.OR = [
        { project_manager_id: user.user_id },
        {
          projectMembers: {
            some: {
              user_id: user.user_id,
              is_active: true
            }
          }
        }
      ];
      break;

    case 'own':
      where.created_by = user.user_id;
      break;

    case 'team':
      where.projectMembers = {
        some: {
          user: {
            teams: {
              some: {
                team_id: user.team.team_id
              }
            }
          }
        }
      };
      break;

    case 'department':
      where.projectMembers = {
        some: {
          user: {
            teams: {
              some: {
                department_id: user.department.department_id
              }
            }
          }
        }
      };
      break;

    default:
      return [];
  }

  return prisma.project.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      client: true,
      manager: true
    }
  });
};


/* ---------------- GET PROJECT BY ID ---------------- */
exports.getProjectById = async (projectId, userId, agencyId) => {
  if (!isValidNumber(projectId)) {
    throwError('VALIDATION_ERROR', 'Invalid project ID', 'project_id');
  }

  const project = await prisma.project.findUnique({
    where: { project_id: projectId },
    include: {
      projectMembers: {
        include: {
          user: {
            select: {
              user_id: true,
              full_name: true,
              email: true,

            }
          }
        }
      },
       tasks: {
        include: {
          timeLogs: true, // include time logs per task
        },
      },
    }
  });

  if (!project) throwError('NOT_FOUND', 'Project not found');
  // Access rules: allow if same agency, or the requesting user is project manager,
  // the creator, or is a project member.
  const isSameAgency = project.agency_id === agencyId;
  const isManager = project.project_manager_id === userId;
  const isCreator = project.created_by === userId;
  const memberIds = (project.projectMembers || []).map((m) => m.user_id);
  const isMember = memberIds.includes(userId);
  if (!isSameAgency && !isManager && !isCreator && !isMember) {
    throwError('FORBIDDEN', 'You do not have access to this project');
  }

  // ⏱️ TIME SUMMARY (SOURCE OF TRUTH)
 
  // Helper to convert minutes to HH:MM
  const toHHMM = (minutes = 0) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Flatten all time logs from all tasks
  const allLogs = project.tasks.flatMap((task) => task.timeLogs);

  let totalBillableMinutes = 0;
  let totalBillableAmount = 0;
  let totalBilledMinutes = 0;
  let totalBilledAmount = 0;
  let totalUnbilledMinutes = 0;
  let totalUnbilledAmount = 0;
  let totalActualMinutes = 0; // sum of all time logs, billable or not

  allLogs.forEach((log) => {
    const minutes = log.duration_minutes || 0;
    const rate = Number(log.hourly_rate || 0);
    totalActualMinutes += minutes;

    if (log.is_billable) {
      totalBillableMinutes += minutes;
      totalBillableAmount += (minutes / 60) * rate;

      if (log.is_invoiced) {
        totalBilledMinutes += minutes;
        totalBilledAmount += (minutes / 60) * rate;
      } else {
        totalUnbilledMinutes += minutes;
        totalUnbilledAmount += (minutes / 60) * rate;
      }
    }
  });

  project.time_summary = {
    currency: project.budget_currency || 'USD',
    actual_hours: toHHMM(totalActualMinutes),
    billable_hours: toHHMM(totalBillableMinutes),
    billable_amount: totalBillableAmount.toFixed(2),
    billed_hours: toHHMM(totalBilledMinutes),
    billed_amount: totalBilledAmount.toFixed(2),
    unbilled_hours: toHHMM(totalUnbilledMinutes),
    unbilled_amount: totalUnbilledAmount.toFixed(2),
  };


  return project;
};

//Pratik Testing continued
/* ---------------- UPDATE PROJECT ---------------- */
exports.updateProject = async (projectId, data, userId) => {
  const allowedFields = [
    'project_name',
    'description',
    'project_type',
    'project_manager_id',
    'start_date',
    'end_date',
    'estimated_hours',
    'actual_hours',
    'status',
    'priority',
    'budget_amount',
    'budget_currency',
    'billing_type',
    'progress_percentage',
    'is_billable',
    'is_public',
    'tags',
    'custom_fields',
    'notes',
    'is_active',
    'is_archived',
    'archived_at',
    'archived_by',
    'updated_at'
  ];

  const updateData = {};

  for (const key of allowedFields) {
    if (data[key] !== undefined) {
      // Convert dates
      if (key === 'start_date' || key === 'end_date' || key === 'archived_at' || key === 'updated_at') {
        updateData[key] = data[key] ? new Date(data[key]) : null;
      }
      // Convert booleans
      else if (key === 'is_billable' || key === 'is_public' || key === 'is_active' || key === 'is_archived') {
        updateData[key] = Boolean(data[key]);
      }
      // Convert numbers/decimals
      else if (key === 'budget_amount' || key === 'estimated_hours' || key === 'actual_hours' || key === 'progress_percentage') {
        updateData[key] = data[key] !== '' ? Number(data[key]) : null;
      }
      // Everything else
      else {
        updateData[key] = data[key];
      }
    }
  }

  if (Object.keys(updateData).length === 0) {
    throwError('VALIDATION_ERROR', 'No valid fields to update');
  }

  const project = await prisma.project.findUnique({
    where: { project_id: projectId }
  });

  if (!project) throwError('NOT_FOUND', 'Project not found');

  if (project.project_manager_id !== userId && project.created_by !== userId) {
    throwError('FORBIDDEN', 'Only project manager can update project');
  }

  const updatedProject = await prisma.project.update({
    where: { project_id: projectId },
    data: updateData
  });

  // =========================
  // 🔔 PROJECT UPDATED NOTIFICATION
  // =========================

  // Notify current project manager
  await NotificationService.createNotification({
    user_id: updatedProject.project_manager_id,
    notification_type: 'PROJECT_UPDATED',
    title: 'Project Updated',
    message: `Project "${updatedProject.project_name}" has been updated.`,
    entity_type: 'PROJECT',
    entity_id: updatedProject.project_id,
    action_url: `/projects/${updatedProject.project_id}`,
    sent_via_email: true,
    send_to_admin: true,
    admin_message: `Admin alert: Project "${updatedProject.project_name}" has been updated.`
  });

  // If project manager changed → notify new manager separately
  if (
    updateData.project_manager_id &&
    updateData.project_manager_id !== project.project_manager_id
  ) {
    await NotificationService.createNotification({
      user_id: updateData.project_manager_id,
      notification_type: 'PROJECT_ASSIGNED',
      title: 'New Project Assigned',
      message: `You have been assigned as project manager for "${updatedProject.project_name}".`,
      entity_type: 'PROJECT',
      entity_id: updatedProject.project_id,
      action_url: `/projects/${updatedProject.project_id}`,
      sent_via_email: true,
      send_to_admin: true
    });
  }

  return updatedProject;
};


exports.updateProjectStatus = async (projectId, status, userId) => {
  // Optional: check if project exists and belongs to user/agency
  const project = await prisma.project.findUnique({
    where: { project_id: projectId },
  })

  if (!project) {
    throw new Error('Project not found')
  }

  // Optional: you can also check if user has permission to update
  // if (project.agency_id !== userAgencyId) throw new Error('Forbidden')

  // Update only the status field
  const updatedProject = await prisma.project.update({
    where: { project_id: projectId },
    data: { status },
  })

  await NotificationService.createNotification({
    user_id: project.project_manager_id,
    notification_type: 'PROJECT_STATUS_UPDATED',
    title: 'Project Status Updated',
    message: `Project "${project.project_name}" status changed from "${project.status}" to "${status}".`,
    entity_type: 'PROJECT',
    entity_id: project.project_id,
    action_url: `/projects/${project.project_id}`,
    sent_via_email: true,
    send_to_admin: true,
    admin_message: `Admin alert: ${project.project_name}" status changed from "${project.status}" to "${status}`
  })

  return updatedProject
}

/* ---------------- ADD PROJECT MEMBER ---------------- */
exports.addProjectMember = async (
  projectId,
  userId,
  addedBy,
  role,
  role_in_project,
  hourly_rate,
  is_active,
  agencyId,
  projectAssignPermission
) => {
  if (!isValidNumber(userId)) {
    throwError('VALIDATION_ERROR', 'Invalid user_id', 'user_id');
  }

  const [project, user, addedByUser] = await Promise.all([
    prisma.project.findUnique({
      where: { project_id: projectId },
      select: {
        project_id: true,
        project_name: true,
        project_manager_id: true,
        agency_id: true
      }
    }),
    prisma.user.findUnique({
      where: { user_id: userId },
      select: { user_id: true, first_name: true, agency_id: true }
    }),
    prisma.user.findUnique({
      where: { user_id: addedBy },
      select: { first_name: true }
    })
  ])

  if (!project) throwError('NOT_FOUND', 'Project not found');
  if (!user) throwError('NOT_FOUND', 'User not found');

  /* ---------- Agency validation ---------- */
  if (project.agency_id !== user.agency_id) {
    throwError('FORBIDDEN', 'User and project must belong to same agency');
  }

  /* ---------- Permission check ---------- */
  const isProjectManager = project.project_manager_id === addedBy;

  if (!isProjectManager && projectAssignPermission !== true) {
    throwError(
      'FORBIDDEN',
      'You do not have permission to assign users to this project'
    );
  }

  /* ---------- Prevent duplicate ---------- */
  const exists = await prisma.projectMember.findFirst({
    where: {
      project_id: projectId,
      user_id: userId,
      is_active: true
    }
  });

  if (exists) {
    throwError('DUPLICATE', 'User already added to project', 'user_id');
  }

  /* ---------- Create member ---------- */
  const projectMember = await prisma.projectMember.create({
    data: {
      project_id: projectId,
      user_id: userId,
      added_by: addedBy,
      role_in_project,
      hourly_rate,
      is_active,
    }
  });

  // =========================
  // 🔔 NOTIFICATIONS
  // =========================

  // 1️⃣ Notify added user (+ admins)
  await NotificationService.createNotification({
    user_id: user.user_id,
    notification_type: 'PROJECT_MEMBER_ADDED',
    title: 'Added to Project',
    message: `You have been added to the project "${project.project_name}" by ${addedByUser?.first_name || 'a manager'}.`,
    entity_type: 'PROJECT',
    entity_id: project.project_id,
    action_url: `/projects/${project.project_id}`,
    sent_via_email: true,
    send_to_admin: true,
    admin_message: `Admin alert: ${user.first_name} added to ${project.project_name}`
  })

  // 2️⃣ Notify project manager (ONLY if different user) (+ admins)
  if (project.project_manager_id !== user.user_id) {
    await NotificationService.createNotification({
      user_id: project.project_manager_id,
      notification_type: 'PROJECT_MEMBER_ADDED',
      title: 'Project Member Added',
      message: `${user.first_name} was added to project "${project.project_name}".`,
      entity_type: 'PROJECT',
      entity_id: project.project_id,
      action_url: `/projects/${project.project_id}`,
      sent_via_email: false,
      send_to_admin: true,
      admin_message: `Admin alert: ${user.first_name} added to ${project.project_name}`
    })
  }

  return projectMember

};

/* ---------------- REMOVE PROJECT MEMBER ---------------- */
exports.removeProjectMember = async (projectId, userId, removedBy) => {
  const project = await prisma.project.findUnique({
    where: { project_id: projectId }
  });

  if (!project) throwError('NOT_FOUND', 'Project not found');

  if (project.project_manager_id !== removedBy) {
    throwError('FORBIDDEN', 'Only project manager can remove members');
  }

  return prisma.projectMember.deleteMany({
    where: {
      project_id: projectId,
      user_id: userId
    }
  });
};


exports.getProjectsManagedByUser = async (userId) => {
  return await prisma.project.findMany({
    where: {
      project_manager_id: userId,
      is_active: true,
      is_archived: false,
    },
    select: {
      project_id: true,
      project_name: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });
};

exports.getAvailableUsersForProject = async (
  projectId,
  loggedInUserId,
  projectViewPermission
) => {
  /* ---------- 1️⃣ Verify project ---------- */
  const project = await prisma.project.findFirst({
    where: {
      project_id: projectId,
      is_active: true,
      is_archived: false,
    },
    select: {
      project_id: true,
      agency_id: true,
      project_manager_id: true,
    },
  });

  if (!project) {
    throw new Error("PROJECT_NOT_FOUND");
  }

  /* ---------- 2️⃣ Permission scope check ---------- */
  // If scope is "own", only project manager allowed
  if (
    projectViewPermission === "own" &&
    project.project_manager_id !== loggedInUserId
  ) {
    throw new Error("NOT_PROJECT_MANAGER");
  }

  /* ---------- 3️⃣ Get already assigned users ---------- */
  const existingMembers = await prisma.projectMember.findMany({
    where: {
      project_id: projectId,
      is_active: true,
    },
    select: {
      user_id: true,
    },
  });

  const assignedUserIds = existingMembers.map((m) => m.user_id);

  /* ---------- 4️⃣ Build user filter based on scope ---------- */
  const userWhere = {
    is_active: true,
    user_id: {
      notIn: assignedUserIds.length ? assignedUserIds : undefined,
    },
  };

  // Agency scoped access
  if (projectViewPermission === "agency") {
    userWhere.agency_id = project.agency_id;
  }

  // true / "all" → no agency filter (global users)

  /* ---------- 5️⃣ Fetch users ---------- */
  return await prisma.user.findMany({
    where: userWhere,
    select: {
      user_id: true,
      full_name: true,
      email: true,
      role: {
      select: {
        role_name: true,
      },
    },
    },
    orderBy: {
      full_name: "asc",
    },
  });
};

exports.fetchProjectNotesService = async ({ user_id, role, agency }) => {
  const where = {
    notes: { not: null }
  }

  // 🔥 SUPER ADMIN → ALL NOTES (no filters)
  if (role.role_name === "Super Admin") {
    // no additional filters
  }

  // 🔥 ADMIN → AGENCY NOTES
  else if (role.role_name === "Admin") {
    where.agency_id = agency.agency_id
  }

  // 🔥 USER / QA / DEVELOPER → OWN NOTES
  else {
    where.agency_id = agency.agency_id
    where.created_by = user_id
  }

  return prisma.project.findMany({
    where,
    select: {
      project_id: true,
      project_name: true,
      notes: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })
}

exports.addProjectNoteService = async ({ project_id, title, notes, userId }) => {
  if (!project_id) throw new Error("Project ID is required")
  return prisma.project.update({
    where: { project_id },
    data: {
      notes,
      updated_at: new Date(),
      created_by: userId // optional
    }
  })
}

exports.getProjectsWithoutNotesService = async (agency_id) => {
  return prisma.project.findMany({
    where: {
      agency_id,
      is_active: true,
      is_archived: false,
      OR: [
        { notes: null },
        { notes: "" },
      ],
    },
    orderBy: {
      created_at: "desc",
    },
    select: {
      project_id: true,
      project_name: true,
      project_code: true,
      client_id: true,
      notes: true,
      created_at: true,
    },
  })
}

exports.leaveProject = async (projectId, userId) => {
  // Ensure member exists and is active
  const member = await prisma.projectMember.findFirst({
    where: {
      project_id: Number(projectId),
      user_id: Number(userId),
      is_active: true,
      left_at: null,
    },
  });

  if (!member) {
    throw new Error('Project member not found or already left');
  }

  // ✅ Use COMPOSITE UNIQUE KEY
  return prisma.projectMember.update({
    where: {
      project_id_user_id_is_active: {
        project_id: Number(projectId),
        user_id: Number(userId),
        is_active: true,
      },
    },
    data: {
      left_at: new Date(),
      is_active: false, // 🔥 important
    },
  });
};