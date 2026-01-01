const express = require('express');
const router = express.Router();

const clientsController = require('../controllers/clients.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const logActivity = require('../middlewares/activityLog.middleware');

// Create client
router.post('/', authMiddleware,  logActivity({
    action: 'CREATE CLIENT',
    entityType: 'Client',
    getEntityId: (req, res, response) => response?.data?.client_id,
    getEntityName: (req, res, response) => response?.data?.client_name,
    getChanges: (req, res, response) => response?.data
  }), clientsController.createClient);

// List clients
router.get('/', authMiddleware, clientsController.getClients);

// Client details
router.get('/:id', authMiddleware, clientsController.getClientById);

// Update client
router.put('/:id', authMiddleware, logActivity({
    action: 'UPDATE CLIENT',
    entityType: 'Client',
    getEntityId: (req) => Number(req.params.id),
    getEntityName: (req, res, response) =>
      response?.data?.client_name || 'Client',
    getChanges: (req, res, response) => response?.data || req.body
  }),
 clientsController.updateClient);

// Change client status
router.patch('/:id/status', authMiddleware, logActivity({
    action: 'UPDATE STATUS CLIENT',
    entityType: 'Client',
    getEntityId: (req) => Number(req.params.id),
    getEntityName: (req, res, response) =>
      response?.data?.client_name || 'Client',
    getChanges: (req, res, response) => response?.data || req.body
  }), clientsController.updateClientStatus);

module.exports = router;
