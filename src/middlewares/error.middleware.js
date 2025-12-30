const { errorResponse } = require('../utils/response');

const errorMiddleware = (err, req, res, next) => {
  console.error(err);

  if (err.message === 'EMAIL_EXISTS') {
    return errorResponse(res, 'Email already registered', 400);
  }

  if (err.message === 'INVALID_CREDENTIALS') {
    return errorResponse(res, 'Invalid email or password', 401);
  }

  return errorResponse(res, 'Internal server error', 500);
};

module.exports = errorMiddleware;
