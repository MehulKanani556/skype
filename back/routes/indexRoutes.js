const express = require("express");
const { createUser, getAllUsers } = require("../controller/userController");
const { userLogin, googleLogin } = require("../auth/auth");
const { auth } = require("../helper/auth");
const { getOnlineUsers } = require("../socketManager/SocketManager");
const {
  getMessageHistory,
  getAllMessages,
  deleteMessage,
  updateMessage,
} = require("../controller/messageController");
const upload = require("../helper/upload");
const uploadController = require("../controller/uploadController");

const indexRoutes = express.Router();

// Auth Routes

indexRoutes.post("/usrLogin", userLogin);
indexRoutes.post("/google-login", googleLogin);

// User Routes

indexRoutes.post("/createUser", createUser);
indexRoutes.get("/allUsers", auth, getAllUsers);

// Message Routes
indexRoutes.get("/messages/:userId", auth, getMessageHistory);
indexRoutes.get("/online-users", auth, getOnlineUsers);
indexRoutes.post("/allMessages", auth, getAllMessages);
indexRoutes.get("/deleteMessage/:messageId", auth, deleteMessage);
indexRoutes.put("/updateMessage/:messageId", auth, updateMessage);

// File upload endpoint
indexRoutes.post("/upload",auth,upload.single("file"),uploadController.uploadFile);

module.exports = indexRoutes;
