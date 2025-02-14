require("dotenv").config();
const express = require("express");
const { connectDB } = require("./db/db");
const server = express();
const port = process.env.PORT;
const socketPort = process.env.SOCKET_PORT || 4000;
const cors = require("cors");
const indexRoutes = require("./routes/indexRoutes");
const { Server } = require("socket.io");
const socketManager = require("./socketManager/SocketManager");
const path = require("path");
server.use(express.json());
server.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
server.use("/uploads", express.static(path.join(__dirname, "uploads")));
server.use("/api", indexRoutes);

// Create HTTP server from Express app for Socket.IO
const http = require("http");
const socketServer = http.createServer(server);

// Initialize Socket.IO
const io = new Server(socketServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

global.io = io;
socketManager.initializeSocket(io);
// Socket manager instance

// Socket connection handling
// io.on("connection", (socket) => {
//   console.log("New client connected");

//   socketManager.handleConnection(socket);

//   socket.on("disconnect", () => {
//     console.log("Client disconnected");
//     socketManager.handleDisconnect(socket);
//   });
// });

// Start both servers
server.listen(port,() => {
  connectDB();
  console.log(`Database Server Is Connected At ${port}`);
});

socketServer.listen(socketPort,  () => {
  console.log(`Socket.IO Server Is Running At ${socketPort}`);
});
