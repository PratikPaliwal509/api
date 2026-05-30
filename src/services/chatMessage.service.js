const prisma = require('../config/db');;
const taskService = require('./task.service');
exports.sendMessage = async (body) => {

  // TASK MESSAGE
  if (body.message_type === "task") {
    console.log("Creating task message with body:", body);
    const task = await taskService.createTask(
      body.task,
      body.sender_id
    );
console.log("Task created:", task);
    return await prisma.chatMessage.create({
      data: {
        chat_id: body.chat_id,
        sender_id: body.sender_id,
        message_type: "task",
        message_text: `Assigned task: ${task.task_title}`,
        task_id: task.task_id
      },
      include: {
        sender: true,
        task: {
          include: {
            assignments: {
              include: {
                user: true
              }
            }
          }
        },
        attachments: true,
        reactions: true,
        reads: true
      }
    });
  }

  // NORMAL MESSAGE
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
    },
    include: {
      sender: true,

      task: {
        include: {
          project: {
            select: {
              project_id: true,
              project_name: true,
            },
          },
          assignments: {
            where: {
              is_active: true,
            },
            include: {
              user: {
                select: {
                  user_id: true,
                  full_name: true,
                  avatar_url: true,
                  email: true,
                },
              },
            },
          },
        },
      },

      attachments: true,
      reactions: true,
      reads: true,

      replyTo: {
        include: {
          sender: true,
          task: true,
          attachments: true,
          reactions: true,
          reads: true,
        },
      },

      replies: {
        include: {
          sender: true,
          task: true,
        },
      },
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
      task:true,
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

exports.getTaskByMessageId = async (
  task_id
) => {
  return await prisma.task.findFirst({
    where: {
      task_id,
    },
  });
};