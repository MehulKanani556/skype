require('dotenv').config();
const express = require('express');
const { connectDB } = require('./db/db');
const server = express();
const port = process.env.PORT
const cors = require('cors');
const indexRoutes = require('./routes/indexRoutes');


server.use(express.json());
server.use(cors());

server.use('/api', indexRoutes)

server.listen(port, () => {
    connectDB();
    console.log(`Server Is Connected At ${port}`);
}) 