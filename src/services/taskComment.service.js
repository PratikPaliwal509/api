const prisma = require('../config/db');
const NotificationService = require('../services/notification.service');
const createComment = async (taskId, data, userId) => {
  const comment = await prisma.taskComment.create({
    data: {
      task_id: taskId,
      parent_comment_id: data.parent_comment_id || null,
      user_id: userId,
      comment_text: data.comment_text,
      mentioned_users: data.mentioned_users || []
    }
  });
  // fetch task info
  const task = await prisma.task.findUnique({
    where: { task_id: taskId },
    select: {
      task_id: true,
      task_title: true,
      task_number: true,
      project_id: true,
      assigned_to: true,
      created_by: true
    }
  })

  if (!task) return comment

  // 🧠 build notification user list
  const notifyUserIds = new Set()

    // 1️⃣ task assignees
    ; (task.assigned_to || []).forEach(id => notifyUserIds.add(id))

    // 2️⃣ mentioned users
    ; (data.mentioned_users || []).forEach(id => notifyUserIds.add(id))

  // 3️⃣ task creator
  if (task.created_by) notifyUserIds.add(task.created_by)

  // ❌ remove commenter
  notifyUserIds.delete(userId)

  // 🔔 send notifications
  for (const notifyUserId of notifyUserIds) {
    const isMentioned = (data.mentioned_users || []).includes(notifyUserId)

    await NotificationService.createNotification({
      user_id: notifyUserId,
      notification_type: isMentioned
        ? 'TASK_COMMENT_MENTION'
        : 'TASK_COMMENT_ADDED',
      title: isMentioned
        ? 'You were mentioned in a comment'
        : 'New comment on task',
      message: isMentioned
        ? `You were mentioned in a comment on "${task.task_title}" (${task.task_number}).`
        : `A new comment was added to "${task.task_title}" (${task.task_number}).`,
      entity_type: 'TASK',
      entity_id: task.task_id,
      action_url: `/projects/${task.project_id}/tasks/${task.task_id}`,

      sent_via_email: true,
      sent_via_push: false,

      // optional admin visibility
      send_to_admin: true,
      admin_message: `New comment added on task "${task.task_title}" (${task.task_number}).`
    })
  }

  return comment
};

const getCommentsByTask = async (taskId) => {
  const allComments = await prisma.taskComment.findMany({
    where: {
      task_id: taskId,
      is_deleted: false
    },
    include: {
      user: true,
    },
    orderBy: {
      created_at: 'asc'
    }
  });

  // Build a nested tree
  const commentsMap = {};
  allComments.forEach(comment => {
    comment.replies = [];
    commentsMap[comment.comment_id] = comment;
  });

  const topLevelComments = [];

  allComments.forEach(comment => {
    if (comment.parent_comment_id) {
      const parent = commentsMap[comment.parent_comment_id];
      if (parent) {
        parent.replies.push(comment);
      }
    } else {
      topLevelComments.push(comment);
    }
  });

  return topLevelComments;
};

const deleteComment = async (commentId, userId) => {
  // 1️⃣ Fetch the comment first
  const comment = await prisma.taskComment.findUnique({
    where: { comment_id: commentId },
    select: {
      comment_id: true,
      task_id: true,
      user_id: true,
      mentioned_users: true
    }
  });

  if (!comment) {
    const error = new Error('Comment not found');
    error.status = 404;
    throw error;
  }

  // 2️⃣ Mark as deleted
  const deletedComment = await prisma.taskComment.update({
    where: { comment_id: commentId },
    data: {
      is_deleted: true,
      deleted_at: new Date(),
      updated_at: new Date()
    }
  });

  // 3️⃣ Fetch task info
  const task = await prisma.task.findUnique({
    where: { task_id: comment.task_id },
    select: {
      task_id: true,
      task_title: true,
      task_number: true,
      project_id: true,
      assigned_to: true
    }
  });

  if (task) {
    const notifyUserIds = new Set();

    // 🔹 Task assignees
    (task.assigned_to || []).forEach(id => notifyUserIds.add(id));

    // 🔹 Mentioned users in comment
    (comment.mentioned_users || []).forEach(id => notifyUserIds.add(id));

    // ❌ Remove the user who deleted the comment
    notifyUserIds.delete(userId);

    // 4️⃣ Send notifications in parallel
    await Promise.all([...notifyUserIds].map((notifyUserId) =>
      NotificationService.createNotification({
        user_id: notifyUserId,
        notification_type: 'TASK_COMMENT_DELETED',
        title: 'A comment was deleted',
        message: `A comment on task "${task.task_title}" (${task.task_number}) was deleted.`,
        entity_type: 'TASK',
        entity_id: task.task_id,
        action_url: `/projects/${task.project_id}/tasks/${task.task_id}`,
        sent_via_email: true,  // ✅ email enabled for this notification
        sent_via_push: true,
        send_to_admin: true,   // admin will also get email inside your service
        admin_message: `Comment on task "${task.task_title}" (${task.task_number}) was deleted by user ID ${userId}.`
      })
    ));

  }

  return deletedComment;
};

const createReply = async (commentId, data, userId) => {
  const parentComment = await prisma.taskComment.findUnique({
    where: { comment_id: commentId },
  });

  if (!parentComment) {
    throw new Error("Parent comment not found");
  }

  // 2. Check if the parent comment belongs to the same task
  if (parentComment.task_id !== data.task_id) {
    throw new Error("Cannot reply to a comment from a different task");
  }

  const reply = await prisma.taskComment.create({
    data: {
      task_id: data.task_id,
      parent_comment_id: commentId,
      user_id: userId,
      comment_text: data.comment_text,
      mentioned_users: data.mentioned_users || []
    },
    include: { user: true }
  });

  // 4️⃣ Fetch task info
  const task = await prisma.task.findUnique({
    where: { task_id: data.task_id },
    select: {
      task_id: true,
      task_title: true,
      task_number: true,
      project_id: true,
      assigned_to: true
    }
  })

  if (!task) return reply

  // 5️⃣ Build notification list
  const notifyUserIds = new Set()

  // 🔹 parent comment author (most important)
  notifyUserIds.add(parentComment.user_id)

    // 🔹 mentioned users
    ; (data.mentioned_users || []).forEach(id => notifyUserIds.add(id))

    // 🔹 task assignees
    ; (task.assigned_to || []).forEach(id => notifyUserIds.add(id))

  // ❌ remove reply author
  notifyUserIds.delete(userId)

  // 6️⃣ Send notifications
  for (const notifyUserId of notifyUserIds) {
    const isMentioned = (data.mentioned_users || []).includes(notifyUserId)
    const isParentAuthor = notifyUserId === parentComment.user_id

    let notificationType = 'TASK_REPLY_ADDED'
    let title = 'New reply on task comment'
    let message = `A reply was added on "${task.task_title}" (${task.task_number}).`

    if (isMentioned) {
      notificationType = 'TASK_REPLY_MENTION'
      title = 'You were mentioned in a reply'
      message = `You were mentioned in a reply on "${task.task_title}" (${task.task_number}).`
    } else if (isParentAuthor) {
      title = 'Someone replied to your comment'
      message = `Someone replied to your comment on "${task.task_title}" (${task.task_number}).`
    }

    await NotificationService.createNotification({
      user_id: notifyUserId,
      notification_type: notificationType,
      title,
      message,
      entity_type: 'TASK',
      entity_id: task.task_id,
      action_url: `/projects/${task.project_id}/tasks/${task.task_id}`,

      sent_via_email: true,
      sent_via_push: false,

      // optional admin visibility
      send_to_admin: true,
      admin_message: `New reply added on task "${task.task_title}" (${task.task_number}).`
    })
  }

  return reply
};

const getCommentReplies = async (commentId) => {
  return prisma.taskComment.findMany({
    where: { parent_comment_id: commentId, is_deleted: false },
    include: { user: true },
    orderBy: { created_at: 'asc' }
  });
};

const deleteReply = async (replyId, userId) => {
  // 1️⃣ Fetch the reply first
  const reply = await prisma.taskComment.findUnique({
    where: { comment_id: replyId },
    select: {
      comment_id: true,
      task_id: true,
      user_id: true,
      mentioned_users: true,
      parent_comment_id: true
    }
  });

  if (!reply) {
    const error = new Error('Reply not found');
    error.status = 404;
    throw error;
  }

  // 2️⃣ Mark as deleted

  const deletedReply = await prisma.taskComment.update({
    where: { comment_id: replyId },
    data: { is_deleted: true, deleted_at: new Date(), updated_at: new Date() }
  });

  // 3️⃣ Fetch task info
  const task = await prisma.task.findUnique({
    where: { task_id: reply.task_id },
    select: {
      task_id: true,
      task_title: true,
      task_number: true,
      project_id: true,
      assigned_to: true
    }
  });
  if (task) {
    const notifyUserIds = new Set();

    // 🔹 Task assignees
    (task.assigned_to || []).forEach(id => notifyUserIds.add(id));

    // 🔹 Mentioned users
    (reply.mentioned_users || []).forEach(id => notifyUserIds.add(id));

    // 🔹 Parent comment author
    if (reply.parent_comment_id) {
      const parentComment = await prisma.taskComment.findUnique({
        where: { comment_id: reply.parent_comment_id },
        select: { user_id: true }
      });
      if (parentComment) notifyUserIds.add(parentComment.user_id);
    }

    // ❌ Remove the user who deleted the reply
    notifyUserIds.delete(userId);

    // 4️⃣ Send notifications in parallel
    await Promise.all([...notifyUserIds].map((notifyUserId) =>
      NotificationService.createNotification({
        user_id: notifyUserId,
        notification_type: 'TASK_REPLY_DELETED',
        title: 'A reply was deleted',
        message: `A reply on task "${task.task_title}" (${task.task_number}) was deleted.`,
        entity_type: 'TASK',
        entity_id: task.task_id,
        action_url: `/projects/${task.project_id}/tasks/${task.task_id}`,
        sent_via_email: false,
        sent_via_push: true,
        send_to_admin: true,
        admin_message: `Reply on task "${task.task_title}" (${task.task_number}) was deleted by user ID ${userId}.`
      })
    ));
  }

  return deletedReply;
};

const updateComment = async (comment_id, user_id, comment_text) => {
  const comment = await prisma.taskComment.findUnique({
    where: { comment_id: Number(comment_id) },
  })

  if (!comment) {
    const error = new Error('Comment not found')
    error.status = 404
    throw error
  }

  // permission check
  if (comment.user_id !== user_id) {
    const error = new Error('You are not allowed to edit this comment')
    error.status = 403
    throw error
  }

  const updatedComment = await prisma.taskComment.update({
    where: { comment_id: Number(comment_id) },
    data: {
      comment_text,
      edited_at: new Date(),
      is_edited: true
    },
  })
  // 4️⃣ Fetch task info
  const task = await prisma.task.findUnique({
    where: { task_id: comment.task_id },
    select: {
      task_id: true,
      task_title: true,
      task_number: true,
      project_id: true,
      assigned_to: true
    }
  })

  if (task) {
    const notifyUserIds = new Set([
      ...(task.assigned_to || []),
      ...(comment.mentioned_users || [])
    ])
    notifyUserIds.delete(user_id) // remove editor

    // send notifications in parallel
    await Promise.all([...notifyUserIds].map((notifyUserId) =>
      NotificationService.createNotification({
        user_id: notifyUserId,
        notification_type: 'TASK_COMMENT_EDITED',
        title: 'A comment was edited',
        message: `A comment on task "${task.task_title}" (${task.task_number}) was edited.`,
        entity_type: 'TASK',
        entity_id: task.task_id,
        action_url: `/projects/${task.project_id}/tasks/${task.task_id}`,
        sent_via_email: false,
        sent_via_push: true,
        send_to_admin: true,
        admin_message: `Comment on task "${task.task_title}" (${task.task_number}) was edited by user ID ${user_id}.`
      })
    ))
  }

  return updatedComment
}

module.exports = {
  createComment,
  getCommentsByTask,
  deleteComment,
  createReply,
  getCommentReplies,
  deleteReply,
  updateComment
};
