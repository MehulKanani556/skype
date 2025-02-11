const express = require("express");
const { createUser, getAllUsers, getAllMessageUsers } = require("../controller/userController");
const { userLogin, googleLogin,forgotPassword,verifyOtp,changePassword } = require("../auth/auth");
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
const { createGroup, updateGroup, deleteGroup, getAllGroups, getGroupById } = require("../controller/groupController");

const indexRoutes = express.Router();

// Auth Routes

indexRoutes.post("/usrLogin", userLogin);
indexRoutes.post("/google-login", googleLogin);
indexRoutes.post('/forgotPassword', forgotPassword)
indexRoutes.post('/verifyOtp', verifyOtp)
indexRoutes.post('/changePassword', changePassword)

// User Routes

indexRoutes.post("/createUser", createUser);
indexRoutes.get("/allUsers", auth, getAllUsers);
indexRoutes.get("/allMessageUsers", auth, getAllMessageUsers);

// Group Routes
indexRoutes.post("/createGroup", auth, createGroup);
indexRoutes.put("/updateGroup/:groupId", auth, updateGroup);
indexRoutes.delete("/deleteGroup/:groupId", auth, deleteGroup);
indexRoutes.get("/allGroups", auth, getAllGroups);
indexRoutes.get("/getGroupById/:groupId", auth, getGroupById);

// Message Routes
indexRoutes.get("/messages/:userId", auth, getMessageHistory);
indexRoutes.get("/online-users", auth, getOnlineUsers);
indexRoutes.post("/allMessages", auth, getAllMessages);
indexRoutes.get("/deleteMessage/:messageId", auth, deleteMessage);
indexRoutes.put("/updateMessage/:messageId", auth, updateMessage);

// File upload endpoint
indexRoutes.post("/upload",auth,upload.single("file"),uploadController.uploadFile);

module.exports = indexRoutes;
