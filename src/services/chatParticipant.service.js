const prisma = require('../config/db');

exports.addParticipant = async (body) => {
  return await prisma.chatParticipant.create({
    data: {
      chat_id: body.chat_id,
      user_id: body.user_id,
      role: body.role || "member",
    },
    include: {
      user: true,
      chat: true,
    },
  });
};

exports.getParticipantsByChat = async (chatId) => {
  return await prisma.chatParticipant.findMany({
    where: {
      chat_id: chatId,
    },
    include: {
      user: true,
    },
    orderBy: {
      joined_at: "asc",
    },
  });
};

exports.getParticipantById = async (participantId) => {
  return await prisma.chatParticipant.findUnique({
    where: {
      participant_id: participantId,
    },
    include: {
      user: true,
      chat: true,
    },
  });
};

exports.updateParticipant = async (participantId, body) => {
  return await prisma.chatParticipant.update({
    where: {
      participant_id: participantId,
    },
    data: body,
    include: {
      user: true,
      chat: true,
    },
  });
};

exports.removeParticipant = async (participantId) => {
  return await prisma.chatParticipant.delete({
    where: {
      participant_id: participantId,
    },
  });
};