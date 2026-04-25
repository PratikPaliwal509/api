// routes/ai.routes.js
const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// POST /ai
router.post("/", authMiddleware, aiController.handleAIRequest);

module.exports = router;