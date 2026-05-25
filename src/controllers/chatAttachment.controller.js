const attachmentService = require("../services/chatAttachment.service");

exports.uploadAttachment = async (req, res) => {
  try {
    console.log("Received attachment upload request with body:", req.body); 
    const data = await attachmentService.uploadAttachment(req.body);

    return res.status(201).json({
      success: true,
      message: "Attachment uploaded successfully",
      data,
    });
  } catch (error) {
    console.log("Error uploading attachment:", error);  
    return res.status(500).json({
      success: false,
      message: error.message,
    });
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