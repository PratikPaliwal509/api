const prisma = require('../config/db');

// CREATE CLIENT
exports.createClient = async (data) => {
  const { agency_id, company_name } = data;

  if (!agency_id || !company_name) {
    throw new Error('CLIENT_REQUIRED_FIELDS_MISSING');
  }

  const agency = await prisma.agency.findUnique({
    where: { agency_id: Number(agency_id) }
  });

  if (!agency) {
    throw new Error('AGENCY_NOT_FOUND');
  }

  const existingClient = await prisma.client.findFirst({
    where: {
      agency_id: Number(agency_id),
      company_name
    }
  });

  if (existingClient) {
    throw new Error('CLIENT_ALREADY_EXISTS');
  }

  return prisma.client.create({
    data: {
      ...data,
      client_since: new Date(), 
    },
  });
};

// services/clients.service.js
exports.getClientsByScope = async (user) => {
  const scope = user?.role?.permissions?.clients?.view;

  if (!scope) {
    return [];
  }

  const where = {};

  switch (scope) {
    case 'all':
      // no filter
      break;

    case 'agency':
      where.agency_id = user.agency.agency_id;
      break;

    case 'department':
      where.agency_id = user.agency.agency_id;
      where.projects = {
        some: {
          projectMembers: {
            some: {
              user: {
                teams: {
                  some: {
                    department_id: user.department.department_id
                  }
                }
              }
            }
          }
        }
      };
      break;


    case 'team':
      where.projects = {
        some: {
          projectMembers: {
            some: {
              user: {
                teams: {
                  some: {
                    team_id: user.team.team_id
                  }
                }
              }
            }
          }
        }
      };
      break;

    case 'assigned':
      where.agency_id = user.agency.agency_id;
      where.account_manager_id = user.user_id;
      break;

    case 'own':
      where.created_by = user.user_id;
      break;

    default:
      return [];
  }

  return prisma.client.findMany({
    where,
    orderBy: {
      created_at: 'desc'
    }
  });
};


// CLIENT DETAILS
exports.getClientById = async (id) => {
  const client = await prisma.client.findUnique({
    where: { client_id: Number(id) },
     include: {
      projects: {
        include: {
          tasks: {
            include: {
              timeLogs: true
            }
          }
        }
      }
    }
  });

  if (!client) {
    throw new Error('CLIENT_NOT_FOUND');
  }

  // Helper: convert minutes to HH:MM
  const toHHMM = (minutes = 0) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  // Compute project cost summary for each project
  const projectCost = client.projects.map((project) => {
    let totalActualMinutes = 0;
    let totalBillableMinutes = 0;
    let totalBilledMinutes = 0;
    let totalUnbilledMinutes = 0;

    let totalBillableAmount = 0;
    let totalBilledAmount = 0;
    let totalUnbilledAmount = 0;

    project.tasks.forEach((task) => {
      task.timeLogs.forEach((log) => {
        const minutes = log.duration_minutes || 0;
        const rate = Number(log.hourly_rate || 0);
        const hours = minutes / 60;

        // Actual hours includes all logs
        totalActualMinutes += minutes;

        if (log.is_billable) {
          totalBillableMinutes += minutes;
          totalBillableAmount += hours * rate;

          if (log.is_invoiced) {
            totalBilledMinutes += minutes;
            totalBilledAmount += hours * rate;
          } else {
            totalUnbilledMinutes += minutes;
            totalUnbilledAmount += hours * rate;
          }
        }
      });
    });

    return {
      project_id: project.project_id,
      project_name: project.project_name,
      currency: project.budget_currency || "USD",
      actual_hours: toHHMM(totalActualMinutes),
      billable_hours: toHHMM(totalBillableMinutes),
      billed_hours: toHHMM(totalBilledMinutes),
      unbilled_hours: toHHMM(totalUnbilledMinutes),
      billable_amount: totalBillableAmount.toFixed(2),
      billed_amount: totalBilledAmount.toFixed(2),
      unbilled_amount: totalUnbilledAmount.toFixed(2)
    };
  });

  return {
    ...client,
    projectCost
  };
};

exports.getAllClients = async (agency_id) => {
  const where = {}

  if (agency_id) {
    where.agency_id = Number(agency_id)
  }

  return prisma.client.findMany({
    where,
    orderBy: {
      created_at: 'desc',
    },
  })
}
// UPDATE CLIENT
exports.updateClient = async (id, data) => {
  await exports.getClientById(id);
  return prisma.client.update({
    where: { client_id: Number(id) },
    data:{
      ...data,
      account_manager_id: data.account_manager_id !== undefined ? Number(data.account_manager_id) : null,
      portal_user_id: data.portal_user_id !== undefined ? Number(data.portal_user_id) : null,
    }
  });
};

// CHANGE CLIENT STATUS
exports.updateClientStatus = async (id, status) => {
  if (!['active', 'inactive'].includes(status)) {
    throw new Error('INVALID_CLIENT_STATUS');
  }

  await exports.getClientById(id);

  return prisma.client.update({
    where: { client_id: Number(id) },
    data: {
      status,
      is_active: status === 'active'
    }
  });
};

exports.deleteClient = async (clientId, userId) => {
  if (!clientId) {
    throw new Error('CLIENT_ID_REQUIRED')
  }

  // Check client exists
  const client = await prisma.client.findUnique({
    where: { client_id: clientId },
  })

  if (!client) {
    throw new Error('CLIENT_NOT_FOUND')
  }

  // OPTIONAL: permission check
  // if (client.created_by !== userId) {
  //   throw new Error('UNAUTHORIZED_ACTION')
  // }

  // Soft delete (recommended)
  const deletedClient = await prisma.client.update({
    where: { client_id: clientId },
    data: {
      is_active: false,
      status: 'inactive',
      updated_at: new Date(),
    },
  })

  return deletedClient
}

exports.fetchClientNotesService = async ({ user_id, role, agency }) => {
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

  return prisma.client.findMany({
    where,
    select: {
      client_id: true,
      company_name: true,
      notes: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: {
      created_at: "desc",
    },
  })
}

exports.getClientsWithoutNotesService = async (agency_id) => {
  return prisma.client.findMany({
    where: {
      agency_id,
      OR: [
        { notes: null },
        { notes: "" },
      ],
    },
    orderBy: {
      created_at: "desc",
    },
  })
}
