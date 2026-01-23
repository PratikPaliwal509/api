const express = require('express');
const router = express.Router();

const commentController = require('../controllers/taskComment.controller');
const authMiddleware = require('../middlewares/auth.middleware');

router.use(authMiddleware);

router.post('/:id/comments', commentController.createComment);
router.get('/:id/comments', commentController.getTaskComments);
router.delete('/comments/:id', commentController.deleteComment);

// Comment Replies
router.post('/:id/comments/:commentId/replies', commentController.createReply);
router.get('/:id/comments/:commentId/replies', commentController.getCommentReplies);
router.delete('/comments/:commentId/replies/:replyId', commentController.deleteReply);
router.put(
    '/comments/:comment_id',
    commentController.updateComment
)
module.exports = router;
