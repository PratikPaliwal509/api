const express = require('express')
const router = express.Router()
const usersController = require('../controllers/users.controller')
const authMiddleware = require('../middlewares/auth.middleware')

// GET ALL USERS
router.get('/user', authMiddleware, usersController.getAllUsers)
router.post("/users", authMiddleware, usersController.createUser);



router.get('/me', authMiddleware, usersController.getUserByToken)
router.put('/mee', authMiddleware, usersController.updateProfile)
// routes/users.routes.js

router.get('/users/by-agency', authMiddleware, usersController.getUsersBySameAgency)

router.get('/by-agency', authMiddleware, usersController.getAgencyUsers)
router.get('/managers/:agencyId',authMiddleware, usersController.getManagersByAgency)

router.get('/users/without-team', authMiddleware, usersController.getUsersWithoutTeam)
router.get("/:id", usersController.getUserByIdController);
router.put('/users/:id', authMiddleware, usersController.updateUser)

module.exports = router
