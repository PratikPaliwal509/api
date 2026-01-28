const prisma = require('../config/db');
const bcrypt = require('bcryptjs')
// GET ALL USERS
exports.getAllUsers = async () => {
  return prisma.user.findMany({
    
  })
}

exports.getUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { user_id: userId },
    select: { agency_id: true, user_id: true,
      full_name: true,
      email: true,
      role_id: true,
      role: {
        select: {
          role_id: true,
          role_name: true,
        },
      },
      department: {
        select: {
          department_id: true,
          department_name: true,
        },
      },
     },
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

exports.getUsersByAgencyId = async (agencyId) => {
  return prisma.user.findMany({
    where: { agency_id: agencyId },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      team_id:true,
      email: true,
      role: true,
    },
    orderBy: { first_name: 'asc' },
  })
}

// users.service.js
exports.getUsersWithoutTeam = async (agency_id) => {
  return prisma.user.findMany({
    where: {
      agency_id: Number(agency_id),
      team_id: null,          // ❌ Not in any team
      is_active: true,

      // ❌ Exclude users who are team leads
      NOT: {
        lead_of_teams: {
          some: {},          // user is team_lead in any team
        },
      },
    },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
    },
    orderBy: {
      first_name: 'asc',
    },
  })
}

exports.getUserByTokenService = async (userId) => {
  if (!userId) {
    const error = new Error('Invalid token')
    error.status = 401
    throw error
  }

  const user = await prisma.user.findUnique({
    where: {
      user_id: Number(userId)
    },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      email: true,
      is_active: true,
      created_at: true,
      role: {
        select: {
          role_id: true,
          role_name: true,
          permissions: true
        }
      }
    }
  })

  if (!user) {
    const error = new Error('User not found')
    error.status = 404
    throw error
  }

  if (!user.is_active) {
    const error = new Error('User is inactive')
    error.status = 403
    throw error
  }

  return user
}

exports.createUser = async (data) => {
  const {
    first_name,
    last_name,
    email,
    password,
    role_id,
    agency_id,
  } = data.formData;
console.log('Creating user with data:', data);
  // check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    throw new Error('User already exists with this email')
  }

  // hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // create user
  const user = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash: hashedPassword,
      // role_id,
      // agency_id,
      is_active: true,
      agency: {
      connect: {
        agency_id: Number(agency_id), // 👈 REQUIRED
      },
    },
      role: {
      connect: {
        role_id: Number(role_id), // 👈 REQUIRED
      },
    },
  },
    select: {
      user_id: true,
      full_name: true,
      email: true,
      role_id: true,
      created_at: true,
    },
  
  })

  return user
}
