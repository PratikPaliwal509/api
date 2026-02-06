const express = require('express')
const router = express.Router()
const authMiddleware = require('../middlewares/auth.middleware')
const timesheetController = require('../controllers/timesheet.controller')

// User timesheet
router.get('/team', authMiddleware, timesheetController.getTeamTimesheet);
router.get('/', authMiddleware, timesheetController.getTimesheetByUser)
module.exports = router
