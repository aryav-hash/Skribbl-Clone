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
//============================================================================================================================================
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
          scores: {}
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
        scores: {}
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

//API to join a room

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

//API to leave a room

router.route('/leave').post((req,res)=>{
  const { roomID, playerName } = req.body;
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
        res.status(200).json({ message: 'Left room successfully', room: rooms[idx] });
      }
    });
  });
});

router.route('/').get((req,res)=>{

});

module.exports = router;