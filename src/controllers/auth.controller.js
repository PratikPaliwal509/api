const {
  signupService,
  loginService
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
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await loginService(email, password);
    return successResponse(res, 'Login successful', result);
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login };
