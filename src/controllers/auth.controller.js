const {
  signupService,
  loginService,
} = require('../services/auth.service');

const { successResponse, errorResponse } = require('../utils/response');

// ---------------- Signup ----------------
const signup = async (req, res, next) => {
  try {
    const result = await signupService(req.body);
    return successResponse(res, 'Signup successful', result, 201);
  } catch (err) {
    next(err);
  }
};

// ---------------- Login ----------------
// ---------------- Login ----------------
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    // ✅ Secure IP detection (supports proxy / load balancer)
    const login_ip =
      req.headers['x-forwarded-for']?.split(',')[0] ||
      req.socket.remoteAddress

    const result = await loginService(email, password, login_ip)

    return successResponse(res, 'Login successful', result)
  } catch (error) {
      let message = 'Something went wrong'

    if (error.message === 'INVALID_CREDENTIALS') {
      message = 'Invalid Email or Password'
    }

    res.status(401).json({
      success: false,
      message,
    })
  }
}


// ADD MULTIPLE USERS 

module.exports = { signup, login };
