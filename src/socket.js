
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

let io = null;

const SECRET_KEY = process.env.JWT_SECRET;

function initSocket(server) {

  io = new Server(server, {
    cors: {
      origin: "*",
      methods: [
        "GET",
        "POST",
        "PATCH",
        "DELETE",
      ],
    },
  });

  /* =================================
      SOCKET AUTH MIDDLEWARE
  ================================= */

  io.use((socket, next) => {

    try {

      const token =
        socket.handshake.auth.token;

      if (!token) {
        return next(
          new Error("Authentication error")
        );
      }

      const decoded = jwt.verify(
        token,
        SECRET_KEY
      );

      socket.user = decoded;

      next();

    } catch (error) {

      next(
        new Error("Authentication error")
      );
    }
  });

  io.on("connection", (socket) => {

    const userId =
      socket.user.user_id;

    console.log(
      "User connected:",
      userId
    );

    /* =================================
        JOIN USER ROOM
    ================================= */

    socket.join(
      `user_${userId}`
    );

    /* =================================
        JOIN CHAT ROOM
    ================================= */

    socket.on(
      "chat:join",
      (chatId) => {

        socket.join(
          `chat_${chatId}`
        );

        console.log(
          `User ${userId} joined chat_${chatId}`
        );
      }
    );
    socket.on("chat:delete-message", ({ message_id, chat_id }) => {
      // Broadcast to everyone else in the chat room
      socket.to(`chat_${chat_id}`).emit("chat:message-deleted", {
        message_id,
        chat_id,
      });

      console.log(`Message ${message_id} deleted in chat_${chat_id}`);
    });
    /* =================================
        EDIT MESSAGE
    ================================= */

    socket.on(
      "chat:edit-message",
      (updatedMessage) => {

        socket
          .to(`chat_${updatedMessage.chat_id}`)
          .emit(
            "chat:message-edited",
            updatedMessage
          );

        console.log(
          "Message edited:",
          updatedMessage.message_id
        );
      }
    );
    /* =================================
        LEAVE CHAT ROOM
    ================================= */

    socket.on(
      "chat:leave",
      (chatId) => {

        socket.leave(
          `chat_${chatId}`
        );

        console.log(
          `User ${userId} left chat_${chatId}`
        );
      }
    );

    /* =================================
        USER TYPING
    ================================= */
    /* =================================
        USER TYPING
    ================================= */
    /* =================================
        UPDATE MESSAGE
    ================================= */
    socket.on(
      "chat:message-updated",
      (updatedMessage) => {

        setMessages((prev) =>
          prev.map((msg) => {

            if (
              msg.message_id !==
              updatedMessage.message_id
            ) {
              return msg;
            }

            return {
              ...msg,
              ...updatedMessage,

              attachments:
                updatedMessage.attachments || [],

              replyTo:
                updatedMessage.replyTo
                  ? {
                    message_id:
                      updatedMessage.replyTo.message_id,

                    text:
                      updatedMessage.replyTo.message_text || "",

                    sender_name:
                      updatedMessage.replyTo.sender?.full_name ||
                      "User",

                    attachments:
                      updatedMessage.replyTo.attachments || [],

                    message_type:
                      updatedMessage.replyTo.message_type || "text",
                  }
                  : null,
            };
          })
        );
      }
    );

    /* =================================
        USER TYPING
    ================================= */

    socket.on(
      "chat:typing",
      ({
        chat_id,
        user_id,
        user_name,
      }) => {

        console.log(
          "User typing:",
          user_name
        );

        socket
          .to(`chat_${chat_id}`)
          .emit(
            "chat:typing",
            {
              chat_id,
              user_id,
              user_name,
            }
          );
      }
    );

    /* =================================
        STOP TYPING
    ================================= */

    socket.on(
      "chat:stop-typing",
      ({
        chat_id,
        user_id,
      }) => {

        socket
          .to(`chat_${chat_id}`)
          .emit(
            "chat:stop-typing",
            {
              chat_id,
              user_id,
            }
          );
      }
    );

    /* =================================
        DISCONNECT
    ================================= */

    socket.on(
      "disconnect",
      () => {

        console.log(
          "User disconnected:",
          userId
        );
      }
    );
  });

  return io;
}

function getIO() {

  if (!io) {

    throw new Error(
      "Socket.io not initialized!"
    );
  }

  return io;
}

module.exports = {
  initSocket,
  getIO,
};