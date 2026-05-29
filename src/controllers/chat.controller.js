const chatService = require("../services/chat.service");
// const { errorResponse } = require("../utils/response");

exports.createChat = async (req, res) => {
  try {

    req.body.agency_id =
      req.user.agency.agency_id;

    console.log(
      "Request body:",
      req.body
    );

    const data =
      await chatService.createChat(
        req.body
      );

    return res.status(201).json({
      success: true,
      message: "Chat created successfully",
      data,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllChats = async (req, res) => {
  try {
    const data = await chatService.getAllChats();

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

exports.getChatById = async (req, res) => {
  try {
    const chatId = Number(req.params.id);

    const data = await chatService.getChatById(chatId);

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

exports.updateChat = async (req, res) => {
  try {
    const chatId = Number(req.params.id);

    const data = await chatService.updateChat(chatId, req.body);

    return res.status(200).json({
      success: true,
      message: "Chat updated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteChat = async (req, res) => {
  try {
    const chatId = Number(req.params.id);

    const data = await chatService.deleteChat(chatId);

    return res.status(200).json({
      success: true,
      message: "Chat deleted successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getChatMessages = async (req, res) => {
  try {
    const chatId = Number(req.params.id);

    const data = await chatService.getChatMessages(chatId);

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

exports.getChatParticipants = async (req, res) => {
  try {
    const chatId = Number(req.params.id);

    const data = await chatService.getChatParticipants(chatId);

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

// GET USER CHATS
exports.getUserChats = async (req, res) => {
  try {
    const data =
      await chatService.getUserChats(
        req.params.userId
      );

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: error.message,
    });
  }
};
