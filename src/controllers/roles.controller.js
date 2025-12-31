const rolesService = require('../services/roles.service');
const { successResponse } = require('../utils/response');

// CREATE ROLE
exports.createRole = async (req, res, next) => {
  try {
    const role = await rolesService.createRole(req.body);
    return successResponse(res, 'Role created successfully', role);
  } catch (error) {
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
    return successResponse(res, 'Role deleted successfully');
  } catch (error) {
    next(error);
  }
};
