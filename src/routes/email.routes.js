const express = require('express');
const router = express.Router();

const { sendEmailController } = require('../controllers/sendEmail.controller');

// POST /api/email/send
router.post('/send', sendEmailController);

module.exports = router;