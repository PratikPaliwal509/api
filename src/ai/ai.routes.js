const express = require("express");
const router = express.Router();

const aiController = require("./ai.controller");

// POST /api/ai/chat
router.post("/chat", aiController.chat);

module.exports = router;