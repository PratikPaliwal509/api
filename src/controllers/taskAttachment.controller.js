const attachmentService = require('../services/taskAttachment.service');
const { successResponse, errorResponse } = require('../utils/response');

const addAttachment = async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    const attachment = await attachmentService.addAttachment(
      taskId,
      req.body,
      req.user.user_id
    );

    return successResponse(res, 'Attachment uploaded successfully', attachment, 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getAttachments = async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    const attachments = await attachmentService.getAttachmentsByTask(taskId);

    return successResponse(res, 'Attachments fetched successfully', attachments);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const attachmentId = Number(req.params.id);

    await attachmentService.deleteAttachment(
      attachmentId,
      req.user.user_id
    );

    return successResponse(res, 'Attachment deleted successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

module.exports = {
  addAttachment,
  getAttachments,
  deleteAttachment
};
