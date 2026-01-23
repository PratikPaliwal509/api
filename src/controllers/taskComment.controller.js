const commentService = require('../services/taskComment.service');
const { successResponse, errorResponse } = require('../utils/response');

const createComment = async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    const comment = await commentService.createComment(
      taskId,
      req.body,
      req.user.user_id
    );

    return successResponse(res, 'Comment added successfully', comment, 201);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const getTaskComments = async (req, res) => {
  try {
    const taskId = Number(req.params.id);

    const comments = await commentService.getCommentsByTask(taskId);

    return successResponse(res, 'Comments fetched successfully', comments);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const deleteComment = async (req, res) => {
  try {
    const commentId = Number(req.params.id);

    await commentService.deleteComment(commentId, req.user.user_id);

    return successResponse(res, 'Comment deleted successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const createReply = async (req, res) => {
  try {
    const taskId = Number(req.params.id);
    const commentId = Number(req.params.commentId);
    const reply = await commentService.createReply(
      commentId,
      { ...req.body, task_id: taskId },
      req.user.user_id
    );
    return successResponse(res, 'Reply added successfully', reply, 201);
  } catch (err) {
    console.log(err)
    return errorResponse(res, err.message);
  }
};

const getCommentReplies = async (req, res) => {
  try {
    const commentId = Number(req.params.commentId);
    const replies = await commentService.getCommentReplies(commentId);
    return successResponse(res, 'Replies fetched successfully', replies);
  } catch (err) {
    return errorResponse(res, err.message);
  }
};

const deleteReply = async (req, res) => {
  try {
    const replyId = Number(req.params.replyId);
    await commentService.deleteReply(replyId, req.user.user_id);
    return successResponse(res, 'Reply deleted successfully');
  } catch (err) {
    return errorResponse(res, err.message);
  }
};
const updateComment = async (req, res) => {
    try {
        const { comment_id } = req.params
        const { comment_text } = req.body
        const user_id = req.user.user_id   // from JWT middleware

        if (!comment_text || !comment_text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Comment text is required',
            })
        }

        const updatedComment =
            await commentService.updateComment(
                comment_id,
                user_id,
                comment_text
            )

        return res.status(200).json({
            success: true,
            message: 'Comment updated successfully',
            data: updatedComment,
        })
    } catch (error) {
        console.error('Update Comment Error:', error)

        return res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Something went wrong',
        })
    }
}

module.exports = {
  createComment,
  getTaskComments,
  deleteComment,
  createReply,
  getCommentReplies,
  deleteReply,
  updateComment
};
