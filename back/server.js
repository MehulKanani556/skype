require("dotenv").config();
const express = require("express");
const { connectDB } = require("./db/db");
const server = express();
const port = process.env.PORT;
const socketPort = process.env.SOCKET_PORT || 4000;
const cors = require("cors");
const indexRoutes = require("./routes/indexRoutes");
const { Server } = require("socket.io");
const { saveMessage } = require("./controller/messageController");
const socketManager = require("./socketManager/SocketManager");

server.use(express.json());
server.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

server.use("/api", indexRoutes);

// Create HTTP server from Express app for Socket.IO
const http = require("http");
const socketServer = http.createServer(server);

// Initialize Socket.IO
const io = new Server(socketServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
  },
});

// Socket manager instance

// Socket connection handling
io.on("connection", (socket) => {
  console.log("New client connected");

  socketManager.handleConnection(socket);

  // Handle private messages
  socket.on("private-message", async (data) => {
    try {
      const { receiverId, message, senderId } = data;

      // Save message to database
      const savedMessage = await saveMessage({
        senderId,
        receiverId,
        message,
      });

      // Emit to recipient if online
      const recipientSocket = socketManager.getSocketByUserId(receiverId);
      if (recipientSocket) {
        recipientSocket.emit("private-message", {
          senderId,
          message,
          timestamp: savedMessage.createdAt,
        });
      }

      // Acknowledge message receipt
      socket.emit("message-sent-status", {
        status: "sent",
        timestamp: savedMessage.createdAt,
      });
    } catch (error) {
      console.error("Error handling private message:", error);
      socket.emit("error", {
        message: "Failed to send message",
      });
    }
  });

  // Handle typing status
  socket.on("typing", ({ receiverId, isTyping, userId }) => {
    const recipientSocket = socketManager.getSocketByUserId(receiverId);
    if (recipientSocket) {
      recipientSocket.emit("typing", {
        userId,
        isTyping,
      });
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("Client disconnected");
    socketManager.handleDisconnect(socket);
  });
});

// Start both servers
server.listen(port, () => {
  connectDB();
  console.log(`Database Server Is Connected At ${port}`);
});

socketServer.listen(socketPort, () => {
  console.log(`Socket.IO Server Is Running At ${socketPort}`);
});
