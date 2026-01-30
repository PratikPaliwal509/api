const prisma = require('../config/db');
const bcrypt = require('bcryptjs')


const generateEmployeeId = async () => {
  const lastUser = await prisma.user.findFirst({
    orderBy: { user_id: 'desc' },
    select: { employee_id: true },
  })

  if (!lastUser || !lastUser.employee_id) {
    return 'EMP-0001'
  }

  const lastNumber = parseInt(lastUser.employee_id.split('-')[1])
  const newNumber = lastNumber + 1

  return `EMP-${String(newNumber).padStart(4, '0')}`
}
// GET ALL USERS
exports.getAllUsers = async () => {
  return prisma.user.findMany({

  })
}

exports.getUserById = async (userId) => {
  return prisma.user.findUnique({
    where: { user_id: userId },
    select: {
      agency_id: true, user_id: true,
      first_name: true,
      last_name: true,
      full_name: true,
      email: true,
      role_id: true,
      created_at: true,
      updated_at: true,
      is_active: true,
      phone: true,
      mobile: true,
      avatar_url: true,
      bio: true,
      job_title: true,
      date_of_joining: true,
      timezone: true,
      agency: {
        select: {
          agency_id: true,
          agency_name: true,
        },
      },
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
      team: {
        select: {
          team_id: true,  
          team_name: true,
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
      team_id: true,
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
      phone: true,
      mobile: true,
      avatar_url: true,
      bio: true,
      job_title: true,
      date_of_joining: true,
      timezone: true,
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
    bio,
    date_of_joining,
    hourly_rate,
    job_title
  } = data.formData;
  const created_by = data.created_by;
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
  const employee_id = await generateEmployeeId()
  const parsedDateOfJoining =
    date_of_joining ? new Date(date_of_joining) : null
  const parsedHourlyRate =
    hourly_rate !== undefined && hourly_rate !== ''
      ? Number(hourly_rate)
      : null

  // create user
  const user = await prisma.user.create({
    data: {
      first_name,
      last_name,
      email,
      password_hash: hashedPassword,
      employee_id: employee_id,
      bio,
      date_of_joining: parsedDateOfJoining,
      hourly_rate: parsedHourlyRate,
      job_title,
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
      creator: {
        connect: { user_id: created_by },
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

exports.updateProfile = async (userId, data) => {
  console.log('Updating user:', userId, 'with data:', data);

  const allowedFields = [
    'first_name',
    'last_name',
    'phone',
    'mobile',
    'avatar_url', // ✅ Cloudinary URL
    'bio',
    'job_title',
    'date_of_joining',
    'timezone',
    'language',
    'notification_preferences',
  ];

  const updateData = {};

  for (const field of allowedFields) {
    if (data[field] === "") {
      delete data[field];
    }
    if (data[field] !== undefined) {
      updateData[field] = data[field];
      console.log(`Updating field: ${field} with value: ${data[field]}`);
    }


  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error('No valid fields provided for update');
    err.statusCode = 400;
    throw err;
  }

  // Optional: auto-update full_name
  if (updateData.first_name || updateData.last_name) {
    const user = await prisma.user.findUnique({
      where: { user_id: Number(userId) },
      select: { first_name: true, last_name: true },
    });

    updateData.first_name ??= user.first_name;
    updateData.last_name ??= user.last_name;
    updateData.full_name = `${updateData.first_name} ${updateData.last_name}`;
  }

  return prisma.user.update({
    where: { user_id: Number(userId) },
    data: updateData,
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      full_name: true,
      email: true,
      phone: true,
      mobile: true,
      avatar_url: true,
      bio: true,
      job_title: true,
      date_of_joining: true,
      timezone: true,
      language: true,
      notification_preferences: true,
      updated_at: true,
    },
  });
};


/**
 * UPDATE USER SERVICE
 */
exports.updateUser = async (userId, data) => {
  // ✅ Allowed editable fields ONLY
  const allowedFields = [
    'first_name',
    'last_name',
    'email',
    'phone',
    'mobile',
    'job_title',
    'bio',
    'department_id',
    'team_id',
    'is_active',
    'avatar_url',
  ]

  const updateData = {}

  // ✅ Prevent empty string overwrite
  for (const field of allowedFields) {
    if (data[field] !== undefined && data[field] !== '') {
      updateData[field] = data[field]
    }
  }

  if (Object.keys(updateData).length === 0) {
    const err = new Error('No valid fields provided for update')
    err.statusCode = 400
    throw err
  }

  // ✅ Ensure user exists
  const user = await prisma.user.findUnique({
    where: { user_id: userId },
  })

  if (!user) {
    const err = new Error('User not found')
    err.statusCode = 404
    throw err
  }

  // ✅ Update user
  return prisma.user.update({
    where: { user_id: userId },
    data: updateData,
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      full_name: true,
      email: true,
      phone: true,
      mobile: true,
      job_title: true,
      bio: true,
      avatar_url: true,
      department_id: true,
      team_id: true,
      is_active: true,
      updated_at: true,
    },
  })
}
