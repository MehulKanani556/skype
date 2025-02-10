const express = require("express");
const { createUser, getAllUsers } = require("../controller/userController");
const { userLogin, googleLogin,forgotPassword,verifyOtp,changePassword } = require("../auth/auth");
const { auth } = require("../helper/auth");
const { getOnlineUsers } = require("../socketManager/SocketManager");
const { getMessageHistory, getAllMessages } = require("../controller/messageController");
const indexRoutes = express.Router();

// Auth Routes

indexRoutes.post("/usrLogin", userLogin);
indexRoutes.post("/google-login", googleLogin);
indexRoutes.post('/forgotPassword', forgotPassword)
indexRoutes.post('/verifyOtp', verifyOtp)
indexRoutes.post('/changePassword/:id', changePassword)

// User Routes

indexRoutes.post("/createUser", createUser);
indexRoutes.get("/allUsers", auth, getAllUsers);

// Message Routes
indexRoutes.get("/messages/:userId", auth, getMessageHistory);
indexRoutes.get("/online-users", auth, getOnlineUsers);
indexRoutes.post("/allMessages", auth, getAllMessages);
module.exports = indexRoutes;
