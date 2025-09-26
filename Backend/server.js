const express = require('express');
//const mongoose = require('mongoose'); if we later use MongoDB
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv').config();
const cors = require('cors');
const { router: apiRoutes, registerSocketEvents } = require('./routes/Apis');

const app = express();

app.use(cors());
app.use(express.json());


const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: process.env.client_url || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const port = process.env.PORT || 5000;

/*mongoose.connect('mongodb uri to be entered here', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log('MongoDB connection error:', err));
*/



// Register real-time socket events
registerSocketEvents(io);

httpServer.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
});