const prisma = require('../config/db');
exports.addReaction = async (body) => {
  return await prisma.chatReaction.create({
    data: {
      message_id: body.message_id,
      user_id: body.user_id,
      reaction: body.reaction,
    },
    include: {
      user: true,
      message: true,
    },
  });
};

exports.getReactionsByMessage = async (messageId) => {
  return await prisma.chatReaction.findMany({
    where: {
      message_id: messageId,
    },
    include: {
      user: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });
};

exports.removeReaction = async (reactionId) => {
  return await prisma.chatReaction.delete({
    where: {
      reaction_id: reactionId,
    },
  });
};