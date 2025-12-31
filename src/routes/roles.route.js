const express = require('express');
const router = express.Router();

const rolesController = require('../controllers/roles.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', authMiddleware, rolesController.createRole);
router.get('/', authMiddleware, rolesController.getRoles);
router.get('/:id', authMiddleware, rolesController.getRoleById);
router.put('/:id', authMiddleware, rolesController.updateRole);
router.delete('/:id', authMiddleware, rolesController.deleteRole);

module.exports = router;
