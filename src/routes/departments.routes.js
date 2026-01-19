const express = require('express');
const router = express.Router();

const departmentsController = require('../controllers/departments.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Create department under agency
router.post('/', authMiddleware, departmentsController.createDepartment);

// Get departments by agency
router.get('/agency/:agencyId', authMiddleware, departmentsController.getDepartmentsByAgency);

// Get department by id
router.get('/', authMiddleware, departmentsController.getAllDepartments)
router.get('/only-one/:id', authMiddleware, departmentsController.getDepartmentById);
// Update department
router.put('/:id', authMiddleware, departmentsController.updateDepartment);

// Activate / Deactivate department
router.patch('/:id/status', authMiddleware, departmentsController.updateDepartmentStatus);

router.get('/:departmentId/sub-departments', authMiddleware, departmentsController.getSubDepartments)

module.exports = router;
