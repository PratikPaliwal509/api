const prisma = require('../config/db');;

exports.sendMessage = async (body) => {
  console.log("services chat message")
  return await prisma.chatMessage.create({
    data: {
      chat_id: body.chat_id,
      sender_id: body.sender_id,
      message_type: body.message_type || "text",
      message_text: body.message_text,
      reply_to_message_id: body.reply_to_message_id || null,
    },
    include: {
      sender: true,
      attachments: true,
      reactions: true,
      reads: true,
    },
  });
};

exports.getMessagesByChat = async (chatId) => {
  return await prisma.chatMessage.findMany({
    where: {
      chat_id: chatId,
      is_deleted: false,
    },
    include: {
      sender: true,
      attachments: true,
      reactions: true,
      reads: true,
      replyTo: true,
      replies: true,
    },
    orderBy: {
      created_at: "asc",
    },
  });
};

exports.getMessageById = async (messageId) => {
  return await prisma.chatMessage.findUnique({
    where: {
      message_id: messageId,
    },
    include: {
      sender: true,
      attachments: true,
      reactions: true,
      reads: true,
      replyTo: true,
      replies: true,
    },
  });
};

exports.editMessage = async (messageId, body) => {
  return await prisma.chatMessage.update({
    where: {
      message_id: messageId,
    },
    data: {
      message_text: body.message_text,
      is_edited: true,
      edited_at: new Date(),
    },
    include: {
      sender: true,
    },
  });
};

exports.deleteMessage = async (messageId) => {
  return await prisma.chatMessage.update({
    where: {
      message_id: messageId,
    },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
    },
  });
};

exports.markMessageAsRead = async (messageId, userId) => {
  return await prisma.chatMessageRead.create({
    data: {
      message_id: messageId,
      user_id: userId,
    },
  });
};