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

exports.getAllDepartments = async (req, res) => {
    try {
      const userId = req.user.user_id;
      console.log("req.user.user_id"+req.user.user_id)
      // console.log(JSON.stringify(req))
        const departments = await departmentsService.getAllDepartments(userId)

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
