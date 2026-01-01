const express = require('express');
const router = express.Router();

const attachmentController = require('../controllers/taskAttachment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/:id/attachments', attachmentController.addAttachment);
router.get('/:id/attachments', attachmentController.getAttachments);
router.delete('/attachments/:id', attachmentController.deleteAttachment);

module.exports = router;
