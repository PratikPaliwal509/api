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

  const lastTeam = await prisma.team.findFirst({
    orderBy: { team_id: 'desc' },
    select: { team_code: true },
  })

  let nextNumber = 1

  if (lastTeam?.team_code) {
    const parts = lastTeam.team_code.split('-') // TEAM-0004
    nextNumber = Number(parts[1]) + 1
  }

  const teamCode = `TEAM-${String(nextNumber).padStart(4, '0')}`

  if (!agency_id || !team_name) {
    throw new Error('TEAM_REQUIRED_FIELDS_MISSING');
  }

  // Agency check
  const agency = await prisma.agency.findUnique({
    where: { agency_id: Number(agency_id) }
  });
  if (!agency) throw new Error('AGENCY_NOT_FOUND');

  // Department check
  if (department_id) {
    const department = await prisma.department.findUnique({
      where: { department_id: Number(department_id) }
    });
    if (!department) throw new Error('DEPARTMENT_NOT_FOUND');
  }

  // Team code uniqueness
  if (team_code) {
    const existingTeam = await prisma.team.findFirst({
      where: {
        agency_id: Number(agency_id),
        team_code
      }
    });
    if (existingTeam) throw new Error('TEAM_CODE_ALREADY_EXISTS');
  }

  // Team lead validation
  let teamLead = null;
  if (team_lead_id) {
    teamLead = await prisma.user.findUnique({
      where: { user_id: Number(team_lead_id) }
    });
    if (!teamLead) throw new Error('TEAM_LEAD_NOT_FOUND');
  }

  // ✅ Use transaction to keep data consistent
  const team = await prisma.$transaction(async (tx) => {
    // 1️⃣ Create team
    const createdTeam = await tx.team.create({
      data: {
        agency_id: Number(agency_id),
        department_id: department_id ? Number(department_id) : null,
        team_name,
        team_code: teamCode,
        description,
        team_lead_id: team_lead_id ? Number(team_lead_id) : null,

        // Connect to UserTeams
        users: team_lead_id
          ? {
            connect: { user_id: Number(team_lead_id) }
          }
          : undefined
      }
    });

    // 2️⃣ Set primary team (team_id) in User table
    if (team_lead_id) {
      await tx.user.update({
        where: { user_id: Number(team_lead_id) },
        data: {
          team_id: createdTeam.team_id
        }
      });
    }

    return createdTeam;
  });

  return team;
};

// services/teams.service.js
// services/teams.service.js

exports.getTeams = async (user) => {
  const { team_visibility } = user // all | agency | department | own | team | assigned | none
  const where = {}
  console.log(user)
  // console.log(filters)
  // optional filters
  // if (filters.agency_id) where.agency_id = Number(filters.agency_id)
  // if (filters.department_id) where.department_id = Number(filters.department_id)

  const scope = user?.role?.permissions?.teams?.view;

  if (!scope) {
    return [];
  }

  // visibility cases (NO ROLE CHECK)
  switch (scope) {
    case 'all':
      break

    case 'agency':
      where.agency_id = user.agency.agency_id
      break

    case 'department':
      console.log("deeeeeeeeeeeepartment")
      where.department_id = user.department.department_id
      break

    case 'own':
      where.team_lead_id = user.user_id
      break

    case 'team':
      console.log("teams" + user.user_id)
      // where.users = {
      //   // some: { user_id: user.user_id },
      // }
      where.team_id = user.team.team_id
      break


    case 'assigned':
        console.log("assign")
      where.users = {
        some: {
          project_members: {
            some: {
              user_id: user.user_id,
            },
          },
        },
      }
      break


    default:
      where.team_id = -1
  }

  const teams = await prisma.team.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      department: true,
      team_lead: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  })

  if (!teams.length) return []

  const users = await prisma.user.findMany({
    where: {
      team_id: { in: teams.map(t => t.team_id) },
      is_active: true,
    },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
      team_id: true,
    },
  })

  return teams.map(team => ({
    ...team,
    members: users.filter(u => u.team_id === team.team_id),
  }))
}





// TEAM DETAILS
exports.getTeamById = async (id) => {
  const teamId = Number(id);

  const team = await prisma.team.findUnique({
    where: { team_id: teamId },
    include: {
      department: true,
      team_lead: {
        select: {
          user_id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      },
    },
  });

  if (!team) {
    throw new Error('TEAM_NOT_FOUND');
  }

  // ✅ Get team members using user.team_id
  const teamMembers = await prisma.user.findMany({
    where: {
      team_id: teamId,
      is_active: true,
    },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
      role_id: true,
      department_id: true,
    },
  });

  return {
    ...team,
    members: teamMembers,
  };
};


// UPDATE TEAM
exports.updateTeam = async (id, data) => {
  const teamId = Number(id)

  // 1️⃣ Ensure team exists
  const existingTeam = await exports.getTeamById(teamId)

  const newTeamLeadId = data.team_lead_id
    ? Number(data.team_lead_id)
    : null

  const oldTeamLeadId = existingTeam.team_lead_id

  return prisma.$transaction(async (tx) => {
    // 2️⃣ Update team
    const updatedTeam = await tx.team.update({
      where: { team_id: teamId },
     data: {
    ...data,
    updated_at: new Date(), // 🔥 force update
  },
    })

    // 3️⃣ If team lead changed
    if (newTeamLeadId && newTeamLeadId !== oldTeamLeadId) {
      // Remove team from old lead (optional but correct)
      if (oldTeamLeadId) {
        await tx.user.update({
          where: { user_id: oldTeamLeadId },
          data: {
            team_id: null,
          },
        })
      }

      // Assign team to new lead
      await tx.user.update({
        where: { user_id: newTeamLeadId },
        data: {
          team_id: teamId,
        },
      })
    }

    return updatedTeam
  })
}

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

exports.addTeamMembers = async ({ team_id, user_ids }) => {
  if (!team_id || !Array.isArray(user_ids) || user_ids.length === 0) {
    throw new Error('TEAM_MEMBER_DATA_INVALID');
  }

  const teamId = Number(team_id);

  // 1️⃣ Validate team
  const team = await prisma.team.findUnique({
    where: { team_id: teamId },
    select: { team_id: true, agency_id: true }
  });

  if (!team) {
    throw new Error('TEAM_NOT_FOUND');
  }

  // 2️⃣ Validate users
  const users = await prisma.user.findMany({
    where: {
      user_id: { in: user_ids.map(Number) },
      is_active: true
    },
    select: {
      user_id: true,
      agency_id: true,
      team_id: true
    }
  });

  if (users.length !== user_ids.length) {
    throw new Error('ONE_OR_MORE_USERS_NOT_FOUND');
  }

  // 3️⃣ Agency validation
  const invalidAgencyUser = users.find(
    (u) => u.agency_id !== team.agency_id
  );
  if (invalidAgencyUser) {
    throw new Error('USER_AGENCY_MISMATCH');
  }

  // 4️⃣ Transaction
  await prisma.$transaction(async (tx) => {
    // Connect users to team (UserTeams)
    await tx.team.update({
      where: { team_id: teamId },
      data: {
        users: {
          connect: users.map((u) => ({
            user_id: u.user_id
          }))
        }
      }
    });

    // Update primary team (UserPrimaryTeam)
    await tx.user.updateMany({
      where: {
        user_id: { in: users.map((u) => u.user_id) },
        team_id: null // ⛔ prevent overwriting existing primary team
      },
      data: {
        team_id: teamId
      }
    });
  });

  return {
    message: 'Team members added successfully',
    team_id: teamId,
    added_members: users.map((u) => u.user_id)
  };
};
