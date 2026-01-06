const prisma = require('../config/db');

// CREATE AGENCY
exports.createAgency = async (data) => {
  const { agency_name, agency_slug, email } = data;

  if (!agency_name || !agency_slug) {
    throw new Error('AGENCY_REQUIRED_FIELDS_MISSING');
  }

  const existingAgency = await prisma.agency.findUnique({
    where: { agency_slug }
  });

  if (existingAgency) {
    throw new Error('AGENCY_ALREADY_EXISTS');
  }

  return prisma.agency.create({
    data
  });
};

exports.getAllAgencies = async () => {
    return await prisma.agency.findMany({
        where: { is_active: true },
        orderBy: { created_at: 'desc' },
    })
}

// GET AGENCY BY ID
exports.getAgencyById = async (id) => {
  const agency = await prisma.agency.findUnique({
    where: { agency_id: Number(id) }
  });

  if (!agency) {
    throw new Error('AGENCY_NOT_FOUND');
  }

  return agency;
};



// UPDATE AGENCY
exports.updateAgency = async (id, data) => {
  await exports.getAgencyById(id);

  return prisma.agency.update({
    where: { agency_id: Number(id) },
    data
  });
};

// ACTIVATE / SUSPEND AGENCY
exports.updateAgencyStatus = async (id, status) => {
  if (!['active', 'suspended'].includes(status)) {
    throw new Error('INVALID_AGENCY_STATUS');
  }

  await exports.getAgencyById(id);

  return prisma.agency.update({
    where: { agency_id: Number(id) },
    data: {
      subscription_status: status
    }
  });
};
