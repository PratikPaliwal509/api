const express = require('express')
const router = express.Router()
const usersController = require('../controllers/users.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// GET ALL USERS
router.get('/user', authMiddleware, usersController.getAllUsers)
// routes/users.routes.js
router.get(
  '/users/by-agency',
  authMiddleware, // JWT middleware
  usersController.getUsersBySameAgency
)

router.get('/by-agency', authMiddleware, usersController.getAgencyUsers)
router.get('/managers/:agencyId',authMiddleware, usersController.getManagersByAgency)

router.get('/users/without-team', authMiddleware, usersController.getUsersWithoutTeam)

module.exports = router
