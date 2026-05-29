const express = require("express");
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware')
const chatController = require("../controllers/chat.controller");

router.post("/", authMiddleware, chatController.createChat);

router.get("/", chatController.getAllChats);

router.get("/:id", chatController.getChatById);

// GET USER CHATS
router.get("/user/:userId", chatController.getUserChats);

router.put("/:id", chatController.updateChat);

router.delete("/:id", chatController.deleteChat);

router.get("/:id/messages", chatController.getChatMessages);

router.get("/:id/participants", chatController.getChatParticipants);

module.exports = router;