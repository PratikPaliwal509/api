const prisma = require('../config/db');

exports.uploadAttachment = async (body) => {
  return await prisma.chatMessageAttachment.create({
    data: {
      message_id: body.message_id,
      file_name: body.file_name,
      file_url: body.file_url,
      file_type: body.file_type,
      file_size: body.file_size,
    },
    include: {
      message: true,
    },
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