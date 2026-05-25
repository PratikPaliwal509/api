// const { Server } = require('socket.io');
// let io = null;
// const jwt = require("jsonwebtoken");
// const SECRET_KEY = process.env.JWT_SECRET;

// function initSocket(server) {
//   io = new Server(server, {
//     cors: {
//       origin: '*',
//       methods: ['GET', 'POST', 'PATCH', 'DELETE']
//     }
//   });

//  io.on('connection', (socket) => {
//   try {
//     const token = socket.handshake.auth.token;

//     if (!token) {
//       console.log("No token provided");
//       return socket.disconnect();
//     }

//     const decoded = jwt.verify(token, SECRET_KEY);
//     const userId = decoded.user_id;

//     console.log("User connected:", userId);

//     socket.join(userId);

//     socket.on("disconnect", () => {
//       console.log("User disconnected:", userId);
//     });

//   } catch (error) {
//     console.log("JWT Error:", error.message);
//     socket.disconnect();
//   }
// });

//   return io;
// }

// function getIO() {
//   if (!io) {
//     throw new Error('Socket.io not initialized!');
//   }
//   return io;
// }

// module.exports = { initSocket, getIO };
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