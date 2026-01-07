const express = require('express')
const router = express.Router()
const usersController = require('../controllers/users.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// GET ALL USERS
router.get('/', authMiddleware, usersController.getAllUsers)
router.get('/by-agency', authMiddleware, usersController.getAgencyUsers)
router.get('/managers/:agencyId', usersController.getManagersByAgency)
module.exports = router
