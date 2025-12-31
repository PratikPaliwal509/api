const departmentsService = require('../services/departments.service');
const { successResponse } = require('../utils/response');

// CREATE DEPARTMENT
exports.createDepartment = async (req, res, next) => {
  try {
    const department = await departmentsService.createDepartment(req.body);
    return successResponse(res, 'Department created successfully', department);
  } catch (error) {
    next(error);
  }
};

// GET DEPARTMENTS BY AGENCY
exports.getDepartmentsByAgency = async (req, res, next) => {
  try {
    const departments = await departmentsService.getDepartmentsByAgency(
      req.params.agencyId
    );
    return successResponse(res, 'Departments fetched successfully', departments);
  } catch (error) {
    next(error);
  }
};

// GET DEPARTMENT BY ID
exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await departmentsService.getDepartmentById(req.params.id);
    return successResponse(res, 'Department fetched successfully', department);
  } catch (error) {
    next(error);
  }
};

// UPDATE DEPARTMENT
exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await departmentsService.updateDepartment(
      req.params.id,
      req.body
    );
    return successResponse(res, 'Department updated successfully', department);
  } catch (error) {
    next(error);
  }
};

// ACTIVATE / DEACTIVATE DEPARTMENT
exports.updateDepartmentStatus = async (req, res, next) => {
  try {
    const department = await departmentsService.updateDepartmentStatus(
      req.params.id,
      req.body.is_active
    );
    return successResponse(res, 'Department status updated successfully', department);
  } catch (error) {
    next(error);
  }
};
