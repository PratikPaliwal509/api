
const messageService = require("../services/chatMessage.service");

const { getIO } =
  require("../socket");

exports.sendMessage = async (
  req,
  res
) => {

  try {

    const data =
      await messageService.sendMessage(
        req.body
      );

    const io = getIO();

    /* =================================
        CHAT MESSAGE EMIT
    ================================= */

    io.to(
      `chat_${data.chat_id}`
    ).emit(
      "chat:new-message",
      data
    );

    /* =================================
        PERSONAL NOTIFICATION
    ================================= */

    if (
      data.receiver_id
    ) {

      io.to(
        `user_${data.receiver_id}`
      ).emit(
        "notification:new",
        {
          type: "message",
          title: "New Message",
          data,
        }
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Message sent successfully",
      data,
    });

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      message:
        error.message,
    });
  }
};
exports.getMessagesByChat = async (req, res) => {
  try {
    const chatId = Number(req.params.chatId);

    const data = await messageService.getMessagesByChat(chatId);

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

exports.getMessageById = async (req, res) => {
  try {
    const messageId = Number(req.params.id);

    const data = await messageService.getMessageById(messageId);

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

exports.editMessage = async (req, res) => {
  try {
    const messageId = Number(req.params.id);

    const data = await messageService.editMessage(
      messageId,
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const messageId = Number(req.params.id);

    const data = await messageService.deleteMessage(messageId);

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
exports.markMessageAsRead = async (
  req,
  res
) => {

  try {
console.log("Marking message as read with params:", req.params, "and user:", req.user);
    const messageId =
      Number(req.params.id);

    // LOGGED IN USER
    const currentUserId =
      req.user.user_id;

    const data =
      await messageService.markMessageAsRead(
        messageId,
        currentUserId
      );

    // SOCKET EVENT
    const io = getIO();

    io.to(
      `chat_${data.chat_id}`
    ).emit(
      "message:read",
      {
        message_id:
          data.message_id,

        user_id:
          currentUserId,
      }
    );

    return res.status(200).json({
      success: true,
      message:
        "Message marked as read",
      data,
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};