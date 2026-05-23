const participantService = require("../services/chatParticipant.service");

exports.addParticipant = async (req, res) => {
  try {
    const data = await participantService.addParticipant(req.body);

    return res.status(201).json({
      success: true,
      message: "Participant added successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getParticipantsByChat = async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);

    const data = await participantService.getParticipantsByChat(chatId);

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

exports.getParticipantById = async (req, res) => {
  try {
    const participantId = Number(req.params.id);

    const data = await participantService.getParticipantById(participantId);

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

exports.updateParticipant = async (req, res) => {
  try {
    const participantId = Number(req.params.id);

    const data = await participantService.updateParticipant(
      participantId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Participant updated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.removeParticipant = async (req, res) => {
  try {
    const participantId = Number(req.params.id);

    const data = await participantService.removeParticipant(participantId);

    return res.status(200).json({
      success: true,
      message: "Participant removed successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};