const express = require('express')
const router = express.Router()
const hierarchyController = require('../controllers/hierarchyController')
const authMiddleware  = require('../middlewares/auth.middleware')

// GET /api/hierarchy
router.get('/', authMiddleware, hierarchyController.getHierarchy)

module.exports = router