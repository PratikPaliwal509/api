const express = require('express');
const router = express.Router();

const agenciesController = require('../controllers/agencies.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Create agency
router.post('/', authMiddleware, agenciesController.createAgency);

// Get agency profile
router.get('/', authMiddleware, agenciesController.getAgencies);

// Get agency profile
router.get('/:id', authMiddleware, agenciesController.getAgencyById);

// Update agency
router.put('/:id', authMiddleware, agenciesController.updateAgency);

// Activate / Suspend agency
router.patch('/:id/status', authMiddleware, agenciesController.updateAgencyStatus);

module.exports = router;
