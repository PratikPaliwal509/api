const prisma = require('../config/db'); // path apne project ke hisaab se adjust karna

// CREATE ROLE
exports.createRole = async (data) => {
  const { role_name, role_description, permissions } = data;

  if (!role_name) {
    throw new Error('ROLE_NAME_REQUIRED');
  }

  const existingRole = await prisma.role.findUnique({
    where: { role_name }
  });

  if (existingRole) {
    throw new Error('ROLE_ALREADY_EXISTS');
  }

  return prisma.role.create({
    data: {
      role_name,
      role_description,
      permissions,
      // is_system_role
    }
  });
};

// LIST ROLES
exports.getRoles = async () => {
  return prisma.role.findMany({
    where: { },
    orderBy: { created_at: 'desc' }
  });
};

// GET ROLE BY ID
exports.getRoleById = async (id) => {
  const role = await prisma.role.findUnique({
    where: { role_id: Number(id) }
  });

  if (!role) {
    throw new Error('ROLE_NOT_FOUND');
  }

  return role;
};

// UPDATE ROLE
exports.updateRole = async (id, data) => {
  await exports.getRoleById(id);

  return prisma.role.update({
    where: { role_id: Number(id) },
    data
  });
};

// DELETE ROLE (SOFT DELETE LOGIC OPTIONAL)
exports.deleteRole = async (id) => {
  const role = await exports.getRoleById(id);

  if (role.is_system_role) {
    throw new Error('SYSTEM_ROLE_CANNOT_BE_DELETED');
  }

  return prisma.role.delete({
    where: { role_id: Number(id) }
  });
};
