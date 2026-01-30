const prisma = require('../config/db');

// CREATE DEPARTMENT 

exports.createDepartment = async (data) => {
  try {
    const { agency_id, department_name, department_code } = data

    if (!agency_id || !department_name || !department_code?.trim()) {
      throw new Error('DEPARTMENT_REQUIRED_FIELDS_MISSING')
    }

    const agency = await prisma.agency.findUnique({
      where: { agency_id: Number(agency_id) },
    })

    if (!agency) {
      throw new Error('AGENCY_NOT_FOUND')
    }

    // optional: name-level check
    const existingDepartment = await prisma.department.findFirst({
      where: {
        agency_id: Number(agency_id),
        department_name,
      },
    })
    const existingDepartmentCode = await prisma.department.findFirst({
      where: {
        agency_id: Number(agency_id),
        department_code,
      },
    })

    if (existingDepartment) {
      throw new Error('DEPARTMENT_ALREADY_EXISTS')
    }
    if (existingDepartmentCode) {
      throw new Error('DEPARTMENT_CODE_ALREADY_EXISTS')
    }

    const manager_id =
      data.manager_id && Number(data.manager_id) > 0
        ? Number(data.manager_id)
        : null

    return await prisma.department.create({
      data: {
        ...data,
        manager_id,
      },
    })
  } catch (error) {
    // ✅ HANDLE UNIQUE CONSTRAINT
    // if (
    //   error instanceof Prisma.PrismaClientKnownRequestError &&
    //   error.code === 'P2002'
    // ) {
    //   throw new Error('DEPARTMENT_CODE_ALREADY_EXISTS')
    // }
console.log(error)
    throw error
  }
}

// services/departments.service.js

exports.getAllDepartments = async (user) => {
  const where = {}
  console.log(user)
  console.log(user?.role?.permissions?.departments?.view)
  console.log(user?.agency?.agency_id)
const scope = user?.role?.permissions?.departments?.view;

  if (!scope) {
    return [];
  }

  switch (scope) {
    case 'all':
      // no restriction
      break

    case 'agency':
      where.agency_id = user.agency.agency_id
      break

    case 'department':
      console.log("department", user.department.department_id)
      where.department_id = user.department.department_id
      break

    case 'own':
      where.manager_id = user.user_id
      break

    case 'team':
      where.teams = {
        some: {
          users: {
            some: { user_id: user.user_id },
          },
        },
      }
      break

    case 'assigned':
      where.teams = {
        some: {
          users: {
            some: {
              project_members: {
                some: { user_id: user.user_id },
              },
            },
          },
        },
      }
      break

    default:
      where.department_id = -1
  }

  return prisma.department.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: {
      teams: {
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
      sub_departments: {
      select: {
        department_id: true,
        department_name: true,
        teams: {
          select: {
            team_id: true,
            team_name: true,
          },
        },
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
console.log(JSON.stringify(department))
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
