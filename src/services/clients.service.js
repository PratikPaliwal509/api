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
    data
  });
};

// services/clients.service.js
exports.getClientsByScope = async (user) => {
  console.log(user)
  console.log(user?.role?.permissions?.clients?.view)
  console.log(user?.agency?.agency_id)
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
    where: { client_id: Number(id) }
  });

  if (!client) {
    throw new Error('CLIENT_NOT_FOUND');
  }

  return client;
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
    data
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
console.log('Fetching client notes for user:', user_id, 'with role:', role.role_name, 'in agency:', agency.agency_id)
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
    console.log('Applying filter for own notes only')
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
