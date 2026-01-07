const prisma = require('../config/db');

/* ---------------- HELPERS ---------------- */
const throwError = (code, message, field = null) => {
  const err = new Error(message);
  err.code = code;
  err.field = field;
  throw err;
};

const isValidNumber = (v) => Number.isInteger(v) && v > 0;

/* ---------------- CREATE PROJECT ---------------- */
exports.createProject = async (data, userId, agencyId) => {
    console.log('Creating project with data:', data, 'by user:', userId, 'in agency:', agencyId);
  const {
    agency_id,
    client_id,
    project_name,
    project_code,
    project_manager_id,
    start_date,
    end_date
  } = data;
  
  agencyId = agency_id; // Temporary assignment for testing purposes
  // Required fields
  if (!agency_id) throwError('VALIDATION_ERROR', 'agency_id is required', 'agency_id');
  if (!client_id) throwError('VALIDATION_ERROR', 'client_id is required', 'client_id');
  if (!project_name) throwError('VALIDATION_ERROR', 'project_name is required', 'project_name');
  if (!project_code) throwError('VALIDATION_ERROR', 'project_code is required', 'project_code');
  if (!project_manager_id) throwError('VALIDATION_ERROR', 'project_manager_id is required', 'project_manager_id');

  // ID validation
  if (![agency_id, client_id, project_manager_id].every(isValidNumber)) {
    throwError('VALIDATION_ERROR', 'Invalid numeric ID');
  }

  // Date validation
  if (start_date && isNaN(Date.parse(start_date))) {
    throwError('VALIDATION_ERROR', 'Invalid start_date', 'start_date');
  }
  if (end_date && isNaN(Date.parse(end_date))) {
    throwError('VALIDATION_ERROR', 'Invalid end_date', 'end_date');
  }
  if (start_date && end_date && new Date(end_date) < new Date(start_date)) {
    throwError('VALIDATION_ERROR', 'end_date cannot be before start_date', 'end_date');
  }

  // Foreign key existence
  const [agency, client, manager] = await Promise.all([
    prisma.agency.findUnique({ where: { agency_id } }),
    prisma.client.findUnique({ where: { client_id } }),
    prisma.user.findUnique({ where: { user_id: project_manager_id } })
  ]);

  if (!agency) throwError('NOT_FOUND', 'Agency not found', 'agency_id');
  if (!client) throwError('NOT_FOUND', 'Client not found', 'client_id');
  if (!manager) throwError('NOT_FOUND', 'Project manager not found', 'project_manager_id');

  // Agency match
  console.log('agency_id:', agency_id, 'agencyId:', agencyId);
  if (agency_id !== agencyId) {
    throwError('FORBIDDEN', 'Cannot create project outside your agency');
  }

  return prisma.project.create({
    data: {
      ...data,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      created_by: userId
    }
  });
};

/* ---------------- GET PROJECTS ---------------- */
exports.getProjects = async (userId, agencyId) => {
  return prisma.project.findMany({
    where: {
      agency_id: agencyId,
      is_active: true
    },
    orderBy: { created_at: 'desc' }
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
              email: true
            }
          }
        }
      }
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

  return prisma.project.update({
    where: { project_id: projectId },
    data: updateData
  });
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

  return updatedProject
}

/* ---------------- ADD PROJECT MEMBER ---------------- */
exports.addProjectMember = async (projectId, userId, addedBy, agencyId) => {
  if (!isValidNumber(userId)) {
    throwError('VALIDATION_ERROR', 'Invalid user_id', 'user_id');
  }

  const [project, user] = await Promise.all([
    prisma.project.findUnique({ where: { project_id: projectId } }),
    prisma.user.findUnique({ where: { user_id: userId } })
  ]);

  if (!project) throwError('NOT_FOUND', 'Project not found');
  if (!user) throwError('NOT_FOUND', 'User not found');

  if (project.agency_id !== user.agency_id) {
    throwError('FORBIDDEN', 'User and project must belong to same agency');
  }

  if (project.project_manager_id !== addedBy) {
    throwError('FORBIDDEN', 'Only project manager can add members');
  }

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

  return prisma.projectMember.create({
    data: {
      project_id: projectId,
      user_id: userId,
      added_by: addedBy
    }
  });
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
