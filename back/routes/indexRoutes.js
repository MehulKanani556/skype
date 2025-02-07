const express = require("express");
const { createUser, getAllUsers } = require("../controller/userController");
const { userLogin } = require("../auth/auth");
const { auth } = require("../helper/auth");
const { getMessageHistory } = require("../controller/messageController");
const { getOnlineUsers } = require("../socketManager/SocketManager");
const indexRoutes = express.Router();

// Auth Routes

indexRoutes.post("/usrLogin", userLogin);

// User Routes

indexRoutes.post("/createUser", createUser);
indexRoutes.get("/allUsers", auth, getAllUsers);

// Message Routes
indexRoutes.get("/messages/:userId", auth, getMessageHistory);
indexRoutes.get("/online-users", auth, getOnlineUsers);

module.exports = indexRoutes;
