const prisma = require('../config/db');

// CREATE TEAM
exports.createTeam = async (data) => {
  const {
    agency_id,
    department_id,
    team_name,
    team_code,
    description,
    team_lead_id
  } = data;

  if (!agency_id || !team_name) {
    throw new Error('TEAM_REQUIRED_FIELDS_MISSING');
  }

  // ✅ Agency check
  const agency = await prisma.agency.findUnique({
    where: { agency_id: Number(agency_id) }
  });
  if (!agency) {
    throw new Error('AGENCY_NOT_FOUND');
  }

  // ✅ Department check (optional)
  if (department_id) {
    const department = await prisma.department.findUnique({
      where: { department_id: Number(department_id) }
    });
    if (!department) {
      throw new Error('DEPARTMENT_NOT_FOUND');
    }
  }

  // ✅ Team code unique per agency
  if (team_code) {
    const existingTeam = await prisma.team.findFirst({
      where: {
        agency_id: Number(agency_id),
        team_code
      }
    });
    if (existingTeam) {
      throw new Error('TEAM_CODE_ALREADY_EXISTS');
    }
  }

  // ✅ TEAM LEAD VALIDATION (THIS WAS MISSING ❗)
  if (team_lead_id) {
    const teamLead = await prisma.user.findUnique({
      where: { user_id: Number(team_lead_id) }
    });

    if (!teamLead) {
      throw new Error('TEAM_LEAD_NOT_FOUND');
    }
  }

  return prisma.team.create({
    data
  });
};


// LIST TEAMS (FILTERABLE)
exports.getTeams = async (filters) => {
  const { agency_id, department_id } = filters;

  const where = {};

  if (agency_id) where.agency_id = Number(agency_id);
  if (department_id) where.department_id = Number(department_id);

  return prisma.team.findMany({
    where,
    orderBy: {
      created_at: 'desc'
    }
  });
};

// TEAM DETAILS
exports.getTeamById = async (id) => {
  const team = await prisma.team.findUnique({
    where: { team_id: Number(id) }
  });

  if (!team) {
    throw new Error('TEAM_NOT_FOUND');
  }

  return team;
};

// UPDATE TEAM
exports.updateTeam = async (id, data) => {
  await exports.getTeamById(id);

  return prisma.team.update({
    where: { team_id: Number(id) },
    data
  });
};

// ACTIVATE / DEACTIVATE TEAM
exports.updateTeamStatus = async (id, is_active) => {
  if (typeof is_active !== 'boolean') {
    throw new Error('INVALID_TEAM_STATUS');
  }

  await exports.getTeamById(id);

  return prisma.team.update({
    where: { team_id: Number(id) },
    data: { is_active }
  });
};

// UPDATE TEAM LEAD
exports.updateTeamLead = async (id, team_lead_id) => {
  await exports.getTeamById(id);

  if (team_lead_id) {
    const user = await prisma.user.findUnique({
      where: { user_id: Number(team_lead_id) }
    });

    if (!user) {
      throw new Error('TEAM_LEAD_NOT_FOUND');
    }
  }

  return prisma.team.update({
    where: { team_id: Number(id) },
    data: { team_lead_id }
  });
};

