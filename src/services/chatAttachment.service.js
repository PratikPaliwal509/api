const prisma = require('../config/db');
exports.uploadAttachment = async (body) => {
  const attachments = body.attachments || [];

  return await prisma.chatMessageAttachment.createMany({
    data: attachments.map((file) => ({
      message_id: body.message_id,
      file_name: file.file_name,
      file_url: file.file_url,
      file_type: file.file_type,
      file_size: file.file_size,
    })),
  });
};

exports.getAttachmentsByMessage = async (messageId) => {
  return await prisma.chatMessageAttachment.findMany({
    where: {
      message_id: messageId,
    },
    orderBy: {
      created_at: "desc",
    },
  });
};

exports.getAttachmentById = async (attachmentId) => {
  return await prisma.chatMessageAttachment.findUnique({
    where: {
      attachment_id: attachmentId,
    },
    include: {
      message: true,
    },
  });
};

exports.deleteAttachment = async (attachmentId) => {
  return await prisma.chatMessageAttachment.delete({
    where: {
      attachment_id: attachmentId,
    },
  });
};