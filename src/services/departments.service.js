const prisma = require('../config/db');

// CREATE DEPARTMENT 
exports.createDepartment = async (data) => {
  const { agency_id, department_name } = data;

  if (!agency_id || !department_name) {
    throw new Error('DEPARTMENT_REQUIRED_FIELDS_MISSING');
  }

  const agency = await prisma.agency.findUnique({
    where: { agency_id: Number(agency_id) }
  });

  if (!agency) {
    throw new Error('AGENCY_NOT_FOUND');
  }

  const existingDepartment = await prisma.department.findFirst({
    where: {
      agency_id: Number(agency_id),
      department_name
    }
  });

  if (existingDepartment) {
    throw new Error('DEPARTMENT_ALREADY_EXISTS');
  }

  return prisma.department.create({
    data
  });
};

// GET DEPARTMENTS BY AGENCY
exports.getDepartmentsByAgency = async (agencyId) => {
  return prisma.department.findMany({
    where: {
      agency_id: Number(agencyId)
    },
    orderBy: {
      created_at: 'desc'
    }
  });
};

// GET DEPARTMENT BY ID
exports.getDepartmentById = async (id) => {
  const department = await prisma.department.findUnique({
    where: { department_id: Number(id) }
  });

  if (!department) {
    throw new Error('DEPARTMENT_NOT_FOUND');
  }

  return department;
};

// UPDATE DEPARTMENT
exports.updateDepartment = async (id, data) => {
  await exports.getDepartmentById(id);

  return prisma.department.update({
    where: { department_id: Number(id) },
    data
  });
};

// ACTIVATE / DEACTIVATE DEPARTMENT
exports.updateDepartmentStatus = async (id, is_active) => {
  if (typeof is_active !== 'boolean') {
    throw new Error('INVALID_DEPARTMENT_STATUS');
  }

  await exports.getDepartmentById(id);

  return prisma.department.update({
    where: { department_id: Number(id) },
    data: { is_active }
  });
};
