const attachmentService = require("../services/chatAttachment.service");
const { getIO } = require("../socket");          // ← ADD
const { PrismaClient } = require("@prisma/client"); // ← ADD
const prisma = require('../config/db');           // ← ADD

exports.uploadAttachment = async (req, res) => {
  try {
    const data = await attachmentService.uploadAttachment(req.body);

    const io = getIO();

    const fullMessage = await prisma.chatMessage.findUnique({
      where: { message_id: req.body.message_id },
      include: { attachments: true, sender: true },  // ← include sender too
    });

    // ← CHANGE THIS: was "chat:new-message", now "chat:message-updated"
    io.to(`chat_${fullMessage.chat_id}`).emit("chat:message-updated", fullMessage);

    return res.status(201).json({
      success: true,
      message: "Attachment uploaded successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
exports.getAttachmentsByMessage = async (req, res) => {
  try {
    const messageId = Number(req.params.messageId);

    const data = await attachmentService.getAttachmentsByMessage(messageId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAttachmentById = async (req, res) => {
  try {
    const attachmentId = Number(req.params.id);

    const data = await attachmentService.getAttachmentById(attachmentId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const attachmentId = Number(req.params.id);

    const data = await attachmentService.deleteAttachment(attachmentId);

    return res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};