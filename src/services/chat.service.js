const prisma = require('../config/db');

const { getIO } =
  require("../socket");
exports.createChat = async (body) => {

  const currentUserId = Number(body.created_by);
  const otherUserId = Number(body.user_id);

  // Validation
  if (!otherUserId) {
    throw new Error("user_id is required");
  }

  /* =========================================
      CHECK EXISTING DIRECT CHAT
  ========================================= */

  const existingChats = await prisma.chat.findMany({
    where: {
      agency_id: body.agency_id,
      chat_type: "direct",
      is_active: true,
    },
    include: {
      participants: {
        select: {
          user_id: true,
          user: true,
        },
      },
      messages: {
        orderBy: {
          created_at: "desc",
        },
        take: 1,
      },
    },
  });

  const existingChat = existingChats.find((chat) => {

    const ids = chat.participants.map((p) =>
      Number(p.user_id)
    );

    return (
      ids.length === 2 &&
      ids.includes(currentUserId) &&
      ids.includes(otherUserId)
    );
  });

  console.log("Existing chat:", existingChat);

  // Return existing chat
  if (existingChat) {
    return existingChat;
  }

  /* =========================================
      CREATE NEW CHAT
  ========================================= */

  const newChat = await prisma.chat.create({
    data: {
      agency_id: body.agency_id,
      chat_type: "direct",
      created_by: currentUserId,

      participants: {
        create: [
          {
            user: {
              connect: {
                user_id: currentUserId,
              },
            },
          },
          {
            user: {
              connect: {
                user_id: otherUserId,
              },
            },
          },
        ],
      },
    },

    include: {
      participants: {
        include: {
          user: true,
        },
      },
      messages: true,
    },
  });

  /* =========================================
      SOCKET EMIT NEW CHAT
  ========================================= */

  const io = getIO();

  io.to(`user_${otherUserId}`).emit(
    "chat:new-chat",
    newChat
  );

  return newChat;
};
// GET USER CHATS
exports.getUserChats = async (userId) => {
  const chats = await prisma.chat.findMany({
    where: {
      participants: {
        some: {
          user_id: Number(userId),
        },
      },
    },

    include: {
      participants: {
        include: {
          user: true,
        },
      },

      messages: {
        orderBy: {
          created_at: "desc",
        },
        take: 1,
        include: {
          sender: true,
          reads: true,
          attachments: true,
        },
      },
    },
  });

  const chatsWithUnread = await Promise.all(
    chats.map(async (chat) => {
      const unread_count = await prisma.chatMessage.count({
        where: {
          chat_id: chat.chat_id,
          is_deleted: false,

          sender_id: {
            not: Number(userId),
          },

          reads: {
            none: {
              user_id: Number(userId),
            },
          },
        },
      });

      return {
        ...chat,
        unread_count,
      };
    })
  );

  // SORT BY LAST MESSAGE
  chatsWithUnread.sort((a, b) => {
    const aTime = a.messages?.[0]?.created_at
      ? new Date(a.messages[0].created_at).getTime()
      : 0;

    const bTime = b.messages?.[0]?.created_at
      ? new Date(b.messages[0].created_at).getTime()
      : 0;

    return bTime - aTime;
  });

  return chatsWithUnread;
};
exports.getAllChats = async () => {
  const chats = await prisma.chat.findMany({
    include: {
      creator: true,

      participants: {
        include: {
          user: true,
        },
      },

      messages: {
        take: 1,
        orderBy: {
          created_at: "desc",
        },
      },

      project: true,
      task: true,
    },
  });

  // SORT BY LAST MESSAGE
  chats.sort((a, b) => {
    const aTime = a.messages?.[0]?.created_at
      ? new Date(a.messages[0].created_at).getTime()
      : 0;

    const bTime = b.messages?.[0]?.created_at
      ? new Date(b.messages[0].created_at).getTime()
      : 0;

    return bTime - aTime;
  });

  return chats;
};

exports.getChatById = async (chatId) => {
  return await prisma.chat.findUnique({
    where: {
      chat_id: chatId,
    },
    include: {
      creator: true,
      participants: {
        include: {
          user: true,
        },
      },
      messages: {
        include: {
          sender: true,
          attachments: true,
          reactions: true,
          reads: true,
        },
        orderBy: {
          created_at: "asc",
        },
      },
      project: true,
      task: true,
    },
  });
};

exports.updateChat = async (chatId, body) => {
  return await prisma.chat.update({
    where: {
      chat_id: chatId,
    },
    data: body,
  });
};

exports.deleteChat = async (chatId) => {
  return await prisma.chat.delete({
    where: {
      chat_id: chatId,
    },
  });
};

exports.getChatMessages = async (chatId) => {
  return await prisma.chatMessage.findMany({
    where: {
      chat_id: chatId,
    },
    include: {
      sender: true,
      attachments: true,
      reactions: true,
      reads: true,
      replyTo: true,
    },
    orderBy: {
      created_at: "asc",
    },
  });
};

exports.getChatParticipants = async (chatId) => {
  return await prisma.chatParticipant.findMany({
    where: {
      chat_id: chatId,
    },
    include: {
      user: true,
    },
  });
};