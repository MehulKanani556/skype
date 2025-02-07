const express = require('express')
const { createUser, getAllUsers } = require('../controller/userController')
const { userLogin, googleLogin } = require('../auth/auth')
const { auth } = require('../helper/auth')
const { getOnlineUsers } = require('../socketManager/SocketManager')
const { getMessageHistory } = require('../controller/messageController')
const indexRoutes = express.Router()


// Auth Routes

indexRoutes.post('/usrLogin', userLogin);
indexRoutes.post('/google-login', googleLogin);

// User Routes

indexRoutes.post("/createUser", createUser);
indexRoutes.get("/allUsers", auth, getAllUsers);

// Message Routes
indexRoutes.get("/messages/:userId", auth, getMessageHistory);
indexRoutes.get("/online-users", auth, getOnlineUsers);

module.exports = indexRoutes;
