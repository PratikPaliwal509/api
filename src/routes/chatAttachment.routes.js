const express = require("express");
const router = express.Router();

const attachmentController = require("../controllers/chatAttachment.controller");

router.post("/", attachmentController.uploadAttachment);

router.get("/message/:messageId", attachmentController.getAttachmentsByMessage);

router.get("/:id", attachmentController.getAttachmentById);

router.delete("/:id", attachmentController.deleteAttachment);

module.exports = router;