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

exports.getAllDepartments = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
    select: { agency_id: true },
  });

  if (!user) {
    throw new Error('User not found');
  }
  return await prisma.department.findMany({
    where: {
      agency_id: user.agency_id,
    },
    orderBy: {
      created_at: 'desc',
    },
    include: {
      teams: {
        where: {
          agency_id: user.agency_id, // filter teams by same agency
        },
        select: {
          team_id: true,
          team_name: true,
        },
      },
    },
  })
}
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
    where: { department_id: Number(id) },
     include: {
      teams: {
        select: {
          team_id: true,
          team_name: true,
        },
      },
      // agency: {
      //   select: {
      //             agency_id: true,
      //     agency_name: true,
      //   },
      // },
    },
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
    data: {
      ...data,
      updated_at: new Date(), // ✅ correct
    },
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

exports.getSubDepartmentsByDepartmentId = async (departmentId) => {
  return await prisma.department.findMany({
    where: {
      parent_department_id: departmentId,
      is_active: true, // optional (remove if not needed)
    },
    orderBy: {
      department_name: 'asc',
    },
  })
}
