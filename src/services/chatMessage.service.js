const prisma = require('../config/db');;

exports.sendMessage = async (body) => {
  console.log("services chat message")
  console.log(body)
  return await prisma.chatMessage.create({
    data: {
      chat_id: body.chat_id,
      sender_id: body.sender_id,
      message_type: body.message_type || "text",
      message_text: body.message_text,
      reply_to_message_id:
        body.reply_to_message_id || null,
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
      // is_deleted: false,
    },
    include: {
      sender: true,
      attachments: true,
      reactions: true,
      reads: true,
      replyTo: {
        include: {

          sender: true,

          attachments: true,

          reactions: true,

          reads: true,
        },
      },
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
      replyTo: {
        include: {
          sender: true,
          attachments: true,
        },
      },
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

exports.markMessageAsRead = async (
  messageId,
  userId
) => {

  // CHECK MESSAGE
  const message =
    await prisma.chatMessage.findUnique({
      where: {
        message_id: messageId,
      },
    });

  if (!message) {
    throw new Error("Message not found");
  }

  // PREVENT DUPLICATE READS
  const existingRead =
    await prisma.chatMessageRead.findFirst({
      where: {
        message_id: messageId,
        user_id: userId,
      },
    });

  if (!existingRead) {

    await prisma.chatMessageRead.create({
      data: {
        message_id: messageId,
        user_id: userId,
      },
    });
  }

  // UPDATE LAST READ MESSAGE
  await prisma.chatParticipant.update({
    where: {
      chat_id_user_id: {
        chat_id: message.chat_id,
        user_id: userId,
      },
    },

    data: {
      last_read_message_id:
        messageId,
    },
  });

  return {
    message_id: messageId,
    chat_id: message.chat_id,
    user_id: userId,
  };
};