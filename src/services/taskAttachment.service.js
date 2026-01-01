const prisma = require('../config/db');

// Helper to convert BigInt to string for JSON serialization
const formatAttachment = (attachment) => ({
  ...attachment,
  file_size: attachment.file_size?.toString() || null
});

const addAttachment = async (taskId, data, userId) => {
  const attachment = await prisma.taskAttachment.create({
    data: {
      task_id: taskId,
      file_name: data.file_name,
      file_original_name: data.file_original_name,
      file_path: data.file_path,
      file_url: data.file_url,
      file_size: BigInt(data.file_size),
      file_type: data.file_type,
      file_extension: data.file_extension,
      image_width: data.image_width,
      image_height: data.image_height,
      uploaded_by: userId
    }
  });
  return formatAttachment(attachment);
};

const getAttachmentsByTask = async (taskId) => {
  const attachments = await prisma.taskAttachment.findMany({
    where: {
      task_id: taskId,
      is_deleted: false
    },
    orderBy: { uploaded_at: 'desc' }
  });
  return attachments.map(formatAttachment);
};

const deleteAttachment = async (attachmentId, userId) => {
  const attachment = await prisma.taskAttachment.update({
    where: { attachment_id: attachmentId },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      deleted_by: userId
    }
  });
  return formatAttachment(attachment);
};

module.exports = {
  addAttachment,
  getAttachmentsByTask,
  deleteAttachment
};
