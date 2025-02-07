const express = require('express')
const { createUser, getAllUsers } = require('../controller/userController')
const { userLogin } = require('../auth/auth')
const { auth } = require('../helper/auth')
const indexRoutes = express.Router()


// Auth Routes

indexRoutes.post('/usrLogin', userLogin)

// User Routes 

indexRoutes.post('/createUser', createUser);
indexRoutes.get('/allUsers', auth, getAllUsers);

module.exports = indexRoutes