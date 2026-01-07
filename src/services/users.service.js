const prisma = require('../config/db');
// GET ALL USERS
exports.getAllUsers = async () => {
  return prisma.user.findMany({
    
  })
}

exports.getUsersByAgencyId = async (agencyId) => {
    return prisma.user.findMany({
        where: {
            agency_id: Number(agencyId) 
        },
        // select: {
        //     user_id: true,
        //     name: true,
        //     email: true,
        //     role_id: true,
        //     agency_id: true
        // },
        // orderBy: {
        //     name: 'asc'
        // }
    })
}

exports.getManagersByAgencyId = async (agencyId) => {
  return prisma.user.findMany({
    where: {
      agency_id: agencyId,
      role: {
        role_name: 'MANAGER', // ✅ works with role_id relation
      },
    },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      agency_id: true,
      role_id: true,
      role: {
        select: {
          role_id: true,
          role_name: true,
        },
      },
    },
  })
}