const express = require('express');
const router = express.Router();

const clientsController = require('../controllers/clients.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Create client
router.post('/', authMiddleware, clientsController.createClient);

// List clients
router.get('/', authMiddleware, clientsController.getClients);

// Client details
router.get('/:id', authMiddleware, clientsController.getClientById);

// Update client
router.put('/:id', authMiddleware, clientsController.updateClient);

// Change client status
router.patch('/:id/status', authMiddleware, clientsController.updateClientStatus);

module.exports = router;
