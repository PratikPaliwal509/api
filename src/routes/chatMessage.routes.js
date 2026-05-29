const express = require("express");
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware')
const messageController = require("../controllers/chatMessage.controller");

router.post("/", messageController.sendMessage);

router.get("/chat/:chatId", messageController.getMessagesByChat);

router.get("/:id", messageController.getMessageById);

router.put("/:id", messageController.editMessage);

router.delete("/:id", messageController.deleteMessage);

router.post("/:id/read", authMiddleware, messageController.markMessageAsRead);

module.exports = router;