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

// LIST CLIENTS (agency scoped)
exports.getClients = async () => {
  return prisma.client.findMany({
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