const express = require('express');
const fs = require('fs');
const router = express.Router();
const path = require('path');

const DATA_PATH = path.join(__dirname,'../dummy_data.txt');



//==========================Helper Functions=============================================================================================
//generates a random room ID
function generateRoomID() {
  return Math.random().toString(36).substring(2, 10);
}
function getWord(callback) {
  fs.readFile(path.join(__dirname, '../skribbl_words.txt'), 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading words file:', err);
      callback(null);
      return;
    }
  const lines = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const randomIndex = Math.floor(Math.random() * lines.length);
  const [word, count] = lines[randomIndex].split(',').map(s => s.trim());
  callback({ word, count});
  });
}
//saves room data to the dummy_data.txt file
function saveRoomData(roomID, roomData, callback) {
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err && err.code !== 'ENOENT') {
      callback(err);
      return;
    }

    let rooms = [];
    if (!err) {
      try {
        rooms = JSON.parse(data);
      } 
      catch (parseErr) {
        callback(parseErr);
        return;
      }
    }
    const idx = rooms.findIndex(room => room.roomID === roomID);
    if (idx >= 0) {
      rooms[idx] = { roomID, ...roomData };
    } 
    else {
      rooms.push({ roomID, ...roomData });
    }
    const json = JSON.stringify(rooms, null, 2);
    fs.writeFile(DATA_PATH, json, 'utf8', (writeErr) => {
      if (writeErr) {
        callback(writeErr);
      } 
      else {
        callback(null);
      }
    });
  });
}

//=====================================APIs for Skribblclone==================================================================================


//==========================Room Management APIs===========================================================================================
//1.API to find room available to play
router.route('/find').get((req,res)=>{
  playerName=req.query.playerName;
  if(!playerName){
    playerName='Guest'+Math.floor(Math.random()*1000);
  }
  fs.readFile(DATA_PATH,'utf8',(err,data)=>{
    let rooms=[];
    if(err){
      return res.status(500).json({error:'Failed to read room data'});
    }
    try{
      rooms=JSON.parse(data);
    } catch {
      return res.status(500).json({error:'Failed to parse room data'});
    }
    for(let room of rooms){
      if(room.state==='waiting' && room.players.length < 10){
        room.players.push(playerName);
        return res.status(200).json({message: playerName + " joined the room", roomID: room.roomID});
      }
    }
    return res.status(404).json({ error: 'No available rooms found' });
  });
});
//2.API to create a room or fetch an existing room based on roomID
router.route('/room').get((req, res) => {
  const roomID = req.query.roomID;

  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    let rooms = [];
    if (!err) {
      try {
        rooms = JSON.parse(data);
      } catch {
        // Treat as empty array if parse error
      }
    }

    if (roomID) {
      const idx = rooms.findIndex(room => room.roomID === roomID);
      if (idx >= 0) {
        res.status(200).json({ found: true, room: rooms[idx] });
      } else {
        const newRoomID = generateRoomID();
        const newRoomData = {
          players: [],
          currentWord: '',
          round: 0,
          drawerSocketId: '',
          roundTime: 60,
          scores: {},
          state: 'waiting',
        };
        saveRoomData(newRoomID, newRoomData, (saveErr) => {
          if (saveErr) {
            res.status(500).json({ error: 'Failed to save new room data' });
          } else {
            res.status(200).json({ found: false, roomID: newRoomID });
          }
        });
      }
    } else {
      const newRoomID = generateRoomID();
      const newRoomData = {
        players: [],
        currentWord: '',
        round: 0,
        drawerSocketId: '',
        roundTime: 60,
        scores: {},
        state: 'waiting'
      };
      saveRoomData(newRoomID, newRoomData, (saveErr) => {
        if (saveErr) {
          res.status(500).json({ error: 'Failed to save new room data' });
        } else {
          res.status(200).json({ found: false, roomID: newRoomID });
        }
      });
    }
  });
});

//3.API to join a room

router.route('/join').post((req, res) => {

  const roomID =req.query.roomID;
  const playerName =req.query.playerName;
  if (!roomID || !playerName) {
    res.status(400).json({ error: 'roomID and playerName are required' });
    return;
  }

  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read room data' });
      return;
    }

    let rooms = [];
    try {
      rooms = JSON.parse(data);
    } catch {
      res.status(500).json({ error: 'Failed to parse room data' });
      return;
    }

    const idx = rooms.findIndex(room => room.roomID === roomID);
    if (idx === -1) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    if(rooms[idx].players.includes(playerName)){
      res.status(400).json({ error: 'Player name already taken in this room' });
      return;
    }
    if(rooms[idx].players.length >= 10){
      res.status(400).json({ error: 'Room is full' });
      return;
    }
    rooms[idx].players.push(playerName);
    rooms[idx].scores[playerName] = 0;

    const json = JSON.stringify(rooms, null, 2);
    fs.writeFile(DATA_PATH, json, 'utf8', (writeErr) => {
      if (writeErr) {
        res.status(500).json({ error: 'Failed to update room data' });
      } else {
        res.status(200).json({ message: 'Joined room successfully', room: rooms[idx] });
      }
    });
  });

});

//4.API to leave a room

router.route('/leave').post((req,res)=>{
  const roomID =req.query.roomID;
  const playerName =req.query.playerName;
  if (!roomID || !playerName) {
    res.status(400).json({ error: 'roomID and playerName are required' });
    return;
  }

  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read room data' });
      return;
    }

    let rooms = [];
    try {
      rooms = JSON.parse(data);
    } catch {
      res.status(500).json({ error: 'Failed to parse room data' });
      return;
    }

    const idx = rooms.findIndex(room => room.roomID === roomID);
    if (idx === -1) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    const playerIdx = rooms[idx].players.indexOf(playerName);
    if (playerIdx === -1) {
      res.status(400).json({ error: 'Player not found in this room' });
      return;
    }

    rooms[idx].players.splice(playerIdx, 1);
    delete rooms[idx].scores[playerName];

    const json = JSON.stringify(rooms, null, 2);
    fs.writeFile(DATA_PATH, json, 'utf8', (writeErr) => {
      if (writeErr) {
        res.status(500).json({ error: 'Failed to update room data' });
      } else {
        if (rooms[idx].players.length === 0) {
          rooms[idx].state = 'ended';
          rooms.splice(idx, 1); //delete the room if no players are left in the room
        }
        res.status(200).json({ message: 'Left room successfully', room: rooms[idx] });
      }
    });
  });
});

router.route('/').get((req,res)=>{

});

//==========================Game Lifecycle APIs=========================================================================================
// 5.Start game
router.route('/game/start').post((req, res) => {
  const roomID = req.query.roomID;
  if (!roomID) {
    res.status(400).json({ error: 'roomID is required' });
    return;
  }
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read room data' });
      return;
    }
    let rooms = [];
    try {
      rooms = JSON.parse(data);
    } catch {
      res.status(500).json({ error: 'Failed to parse room data' });
      return;
    }
    const idx = rooms.findIndex(room => room.roomID === roomID);
    if (idx === -1) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    rooms[idx].state = 'started';
    const json = JSON.stringify(rooms, null, 2);
    fs.writeFile(DATA_PATH, json, 'utf8', (writeErr) => {
      if (writeErr) {
        res.status(500).json({ error: 'Failed to update room state' });
      } else {
        res.status(200).json({ message: 'Game started', room: rooms[idx] });
      }
    });
  });
});

// 6.End game
router.route('/game/end').post((req, res) => {
  const roomID = req.query.roomID;
  if (!roomID) {
    res.status(400).json({ error: 'roomID is required' });
    return;
  }
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read room data' });
      return;
    }
    let rooms = [];
    try {
      rooms = JSON.parse(data);
    } catch {
      res.status(500).json({ error: 'Failed to parse room data' });
      return;
    }
    const idx = rooms.findIndex(room => room.roomID === roomID);
    if (idx === -1) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    rooms[idx].state = 'ended';
    rooms.splice(idx, 1); //delete the room when the game ends
    const json = JSON.stringify(rooms, null, 2);
    fs.writeFile(DATA_PATH, json, 'utf8', (writeErr) => {
      if (writeErr) {
        res.status(500).json({ error: 'Failed to update room state' });
      } else {
        res.status(200).json({ message: 'Game ended', room: rooms[idx] });
      }
    });
  });
});

// 7.Fetch game state
router.route('/game/state').get((req, res) => {
  const roomID=req.query.roomID;
  if (!roomID) {
    res.status(400).json({ error: 'roomID is required' });
    return;
  }
  fs.readFile(DATA_PATH,'utf8',(err,data)=>{
    if(err){
      return res.status(500).json({error:'Failed to read room data'});
    }
    let rooms=[];
    try{
      rooms=JSON.parse(data);
    } catch {
      return res.status(500).json({error:'Failed to parse room data'});
    }
    const idx=rooms.findIndex(room=>room.roomID===roomID);
    if(idx===-1){
      return res.status(404).json({error:'Room not found'});
    }
    res.status(200).json({state:rooms[idx].state});
  });
});

//===========================Words APIs===============================================================================================
// 8.Get word for round
router.route('/word').get((req,res)=>{
  getWord((result)=>{
    if(result && result.word){
      res.status(200).json({word: result.word, count: result.count });
    } else {
      res.status(500).json({error:'Failed to get a word'});
    }
  });
});

//===========================Scores APIs==============================================================================================
// 9.Get current scores
router.route('/scores').get((req,res)=>{
  const roomID = req.query.roomID;
  if (!roomID) {
    res.status(400).json({ error: 'roomID is required' });
    return;
  }
  fs.readFile(DATA_PATH, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Failed to read room data' });
      return;
    }

    let rooms = [];
    try {
      rooms = JSON.parse(data);
    } catch {
      res.status(500).json({ error: 'Failed to parse room data' });
      return;
    }

    const idx = rooms.findIndex(room => room.roomID === roomID);
    if (idx === -1) {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    const scores = rooms[idx].scores || {};
    res.status(200).json({ scores });
  });
});


function registerSocketEvents(io) {
  // Room events
  io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomID, username }) => {
      socket.join(roomID);
      io.to(roomID).emit('chatUpdate', { message: `${username} joined the room.` });
    });

    socket.on('leaveRoom', ({ roomID, username }) => {
      socket.leave(roomID);
      io.to(roomID).emit('chatUpdate', { message: `${username} left the room.` });
    });

    // Drawing events
    socket.on('draw', ({ roomID, data }) => {
      socket.to(roomID).emit('draw', data);
    });

    socket.on('clearCanvas', (roomID) => {
      io.to(roomID).emit('clearCanvas');
    });

    // Game events
    socket.on('startGame', (roomID) => {
      io.to(roomID).emit('startGame');
    });

    socket.on('nextTurn', (roomID) => {
      io.to(roomID).emit('nextTurn');
    });

    socket.on('gameUpdate', ({ roomID, state }) => {
      io.to(roomID).emit('gameUpdate', state);
    });

    socket.on('endGame', (roomID) => {
      io.to(roomID).emit('endGame');
    });

    // Chat events
    socket.on('sendMessage', ({ roomID, username, message }) => {
      io.to(roomID).emit('chatUpdate', { username, message });
    });

    socket.on('correctGuess', ({ roomID, username }) => {
      io.to(roomID).emit('correctGuess', { username });
    });

    // Kick player from room
    socket.on('kickPlayer', ({ roomID, targetSocketId, by }) => {
      io.to(targetSocketId).emit('kicked', { roomID, by });
      io.to(roomID).emit('chatUpdate', { message: `${by} kicked a player.` });
    });

    socket.on('changeSettings', ({ roomID, settings }) => {
      io.to(roomID).emit('settingsChanged', settings);
    });

    socket.on('updateAvatar', ({ roomID, username, avatarUrl }) => {
      io.to(roomID).emit('avatarUpdated', { username, avatarUrl });
    });

    socket.on('fetchAvatar', ({ username }) => {
      socket.emit('avatarData', { username, avatarUrl: null });
    });

    // Profanity filtering for messages
    socket.on('sendMessageFiltered', ({ roomID, username, message }) => {
      const badWords = ['badword1', 'badword2'];//update these with actual bad words
      let cleanMessage = message;
      for (const word of badWords) {
        const regex = new RegExp(word, 'gi');
        cleanMessage = cleanMessage.replace(regex, '****');
      }
      io.to(roomID).emit('chatUpdate', { username, message: cleanMessage });
    });
  });
}

module.exports = { router, registerSocketEvents };