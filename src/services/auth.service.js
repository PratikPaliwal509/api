const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../utils/jwt');

// ---------------- Signup Service ----------------
const signupService = async (data) => {
  const {
    email,
    password,
    first_name,
    last_name,
    role_id,
    agency_id,
    department_id,
    team_id
  } = data;
const full_name = `${first_name} ${last_name}`;
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('EMAIL_EXISTS');

  const password_hash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password_hash,
      first_name,
      last_name,
      full_name,
      role_id,
      agency_id,
      department_id,
      team_id
    }
  });

  const token = generateToken({ user_id: user.user_id });

  return { user, token };
};

// ---------------- Login Service ----------------
const loginService = async (email, password, login_ip) => {
  const user = await prisma.user.findUnique({
    where: { email },
  })

  if (!user) throw new Error('INVALID_CREDENTIALS')

  const isValid = await bcrypt.compare(password, user.password_hash)
  if (!isValid) throw new Error('INVALID_CREDENTIALS')

  // ✅ Update last login info AFTER successful auth
  const updatedUser = await prisma.user.update({
    where: { user_id: user.user_id },
    data: {
      last_login_at: new Date(),
      last_login_ip: login_ip,
    },
  })

  const token = generateToken({ user_id: updatedUser.user_id })

  return {
    user: updatedUser,
    token,
  }
}


module.exports = { signupService, loginService };
