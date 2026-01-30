const departmentsService = require('../services/departments.service');
const { successResponse } = require('../utils/response');
const usersService = require('../services/users.service')
// CREATE DEPARTMENT
exports.createDepartment = async (req, res, next) => {
  try {

    const userId = req.user.user_id
    console.log(userId)
    // ✅ 2. Fetch user to get agency_id
    const user = await usersService.getUserById(userId)

    if (!user || !user.agency_id) {
      return res.status(400).json({
        message: 'Agency not found for this user',
      })
    }
    const departmentData = {
      ...req.body,
      agency_id: user.agency_id,
    }
    const department = await departmentsService.createDepartment(departmentData);
    return successResponse(res, 'Department created successfully', department);
  } catch (error) {
  console.log('Create Department Error:', error)

  return res.status(400).json({
    success: false,
    message:
      error.message === 'DEPARTMENT_REQUIRED_FIELDS_MISSING'
        ? 'Required fields are missing'
        : error.message === 'AGENCY_NOT_FOUND'
        ? 'Agency not found'
        : error.message === 'DEPARTMENT_ALREADY_EXISTS'
        ? 'Department name already exists'
        : error.message === 'DEPARTMENT_CODE_ALREADY_EXISTS'
        ? 'Department code already exists for this agency'
        : 'Failed to create department',
  })
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

// controllers/departments.controller.js

exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await departmentsService.getAllDepartments(req.user)

    return res.status(200).json({
      success: true,
      message: 'Departments fetched successfully',
      data: departments,
    })
  } catch (error) {
    console.error('Get Departments Error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch departments',
    })
  }
}

// GET DEPARTMENT BY ID
exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await departmentsService.getDepartmentById(req.params.id);
    return successResponse(res, 'Department fetched successfully', department);
  } catch (error) {
    console.log(error)
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


exports.getSubDepartments = async (req, res) => {
  try {
    const { departmentId } = req.params

    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: 'Department ID is required',
      })
    }

    const subDepartments = await departmentsService.getSubDepartmentsByDepartmentId(
      Number(departmentId)
    )

    return res.status(200).json({
      success: true,
      data: subDepartments,
    })
  } catch (error) {
    console.error('Get sub-departments error:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-departments',
    })
  }
}
