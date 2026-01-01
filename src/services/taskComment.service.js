const prisma = require('../config/db');

const createComment = async (taskId, data, userId) => {
  return prisma.taskComment.create({
    data: {
      task_id: taskId,
      parent_comment_id: data.parent_comment_id || null,
      user_id: userId,
      comment_text: data.comment_text,
      mentioned_users: data.mentioned_users || []
    }
  });
};

const getCommentsByTask = async (taskId) => {
  return prisma.taskComment.findMany({
    where: {
      task_id: taskId,
      is_deleted: false
    },
    include: {
      user: true,
      replies: {
        where: { is_deleted: false },
        include: { user: true }
      }
    },
    orderBy: { created_at: 'asc' }
  });
};

const deleteComment = async (commentId, userId) => {
  return prisma.taskComment.update({
    where: { comment_id: commentId },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      updated_at: new Date()
    }
  });
};

const createReply = async (commentId, data, userId) => {
  return prisma.taskComment.create({
    data: {
      task_id: data.task_id,
      parent_comment_id: commentId,
      user_id: userId,
      comment_text: data.comment_text,
      mentioned_users: data.mentioned_users || []
    },
    include: { user: true }
  });
};

const getCommentReplies = async (commentId) => {
  return prisma.taskComment.findMany({
    where: { parent_comment_id: commentId, is_deleted: false },
    include: { user: true },
    orderBy: { created_at: 'asc' }
  });
};

const deleteReply = async (replyId, userId) => {
  return prisma.taskComment.update({
    where: { comment_id: replyId },
    data: { is_deleted: true, deleted_at: new Date(), updated_at: new Date() }
  });
};

module.exports = {
  createComment,
  getCommentsByTask,
  deleteComment,
    createReply,
  getCommentReplies,
  deleteReply
};
