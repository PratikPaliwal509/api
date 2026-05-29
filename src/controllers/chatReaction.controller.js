const reactionService = require("../services/chatReaction.service");

exports.addReaction = async (req, res) => {
  try {
    const data = await reactionService.addReaction(req.body);

    return res.status(201).json({
      success: true,
      message: "Reaction added successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getReactionsByMessage = async (req, res) => {
  try {
    const messageId = Number(req.params.messageId);

    const data = await reactionService.getReactionsByMessage(messageId);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.removeReaction = async (req, res) => {
  try {
    const reactionId = Number(req.params.id);

    const data = await reactionService.removeReaction(reactionId);

    return res.status(200).json({
      success: true,
      message: "Reaction removed successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};