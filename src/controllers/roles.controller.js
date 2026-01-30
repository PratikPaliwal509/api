const rolesService = require('../services/roles.service');
const { successResponse } = require('../utils/response');

// CREATE ROLE
exports.createRole = async (req, res, next) => {
  try {
    const role = await rolesService.createRole(req.body);
    return successResponse(res, 'Role created successfully', role);
  } catch (error) {
    console.log(error)
    next(error);
  }
};

// LIST ROLES
exports.getRoles = async (req, res, next) => {
  try {
    const roles = await rolesService.getRoles();
    return successResponse(res, 'Roles fetched successfully', roles);
  } catch (error) {
    next(error);
  }
};

// GET ROLE BY ID
exports.getRoleById = async (req, res, next) => {
  try {
    const role = await rolesService.getRoleById(req.params.id);
    return successResponse(res, 'Role fetched successfully', role);
  } catch (error) {
    next(error);
  }
};

// UPDATE ROLE
exports.updateRole = async (req, res, next) => {
  try {
    const role = await rolesService.updateRole(req.params.id, req.body);
    return successResponse(res, 'Role updated successfully', role);
  } catch (error) {
    next(error);
  }
};

// DELETE ROLE (SOFT DELETE)
exports.deleteRole = async (req, res, next) => {
  try {
    await rolesService.deleteRole(req.params.id);
    return res.status(200).json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    console.error('Delete Role Error:', error); // ✅ Log the full error

    // Send proper error message to frontend
    let message = 'Failed to delete role';
    if (error.message === 'SYSTEM_ROLE_CANNOT_BE_DELETED') {
      message = 'This system role cannot be deleted';
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }
};
