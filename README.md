# Skribbl-Clone

A real-time multiplayer drawing and guessing game, inspired by skribbl.io.

## Word List Source

To generate the word list used in this project, We used the following gist to convert a CSV file to a txt file:

https://gist.github.com/mvark/9e0682c62d75625441f6ded366245203#file-skribbl-words-csv

The converted txt file is then used in the backend for word selection.

## Backend Setup

### Prerequisites
- Node.js (v14 or higher)
- npm (Node Package Manager)

### Installation

1. Navigate to the Backend directory:
```bash
cd Backend
```

2. Install dependencies:
```bash
npm install express socket.io dotenv cors
npm install nodemon --save-dev
```

3. Update `.env` file in the Backend directory with the following content:
```env
PORT=3700
client_url=http://localhost:3000
```

### Running the Server

#### Development Mode (with auto-reload)
```bash
npm run dev
```

#### Production Mode
```bash
node server.js
```

### API Endpoints

#### Room Management
- **Create New Room**
  ```
  GET /api/room
  ```
  Response: `{ "found": false, "roomID": "<new_room_id>" }`

- **Join Existing Room**
  ```
  GET /api/room?roomID=<room_id>
  ```
  Response: 
  - If room exists: `{ "found": true, "room": { <room_data> } }`
  - If room doesn't exist: `{ "found": false, "roomID": "<new_room_id>" }`

#### Player Management

- **Join Room**
  - Endpoint: `POST /api/join`
  - Accepts parameters either as JSON body or as URL query parameters.
  - Example using JSON body:
    - Body:
      ```json
      {
        "roomID": "<room_id>",
        "playerName": "<player_name>"
      }
      ```
  - Example using query params:
    `/api/join?roomID=<room_id>&playerName=<player_name>`
  - Response:
    - Success: `{ "message": "Joined room successfully", "room": { <room_data> } }`
    - Errors: 400 (missing params or name taken), 404 (room not found)

- **Leave Room**
  - Endpoint: `POST /api/leave`
  - Accepts parameters as JSON body:
    - Body:
      ```json
      {
        "roomID": "<room_id>",
        "playerName": "<player_name>"
      }
      ```
  - Response:
    - Success: `{ "message": "Left room successfully", "room": { <room_data> } }`
    - Errors: 400 (missing params or player not found), 404 (room not found)

### Server Features

### Real-time Features (Socket.IO Events)

- **Room events**
  - `joinRoom`: User joins a room
  - `leaveRoom`: User leaves a room
- **Drawing events**
  - `draw`: Sends real-time drawing data to all clients
  - `clearCanvas`: Clears drawing board
- **Game events**
  - `startGame`: Begins the game
  - `nextTurn`: Assigns next drawing/guessing player
  - `gameUpdate`: Broadcast current round/game state
  - `endGame`: Signals game end
- **Chat events**
  - `sendMessage`: Player sends chat/guess
  - `correctGuess`: Someone guesses the word
  - `chatUpdate`: Broadcast chat to room

#### Optional/Advanced Real-time Features
- `kickPlayer`: Kick a player from a room (admin/moderator only)
- `changeSettings`: Change room settings (rounds, time, etc.)
- `updateAvatar` / `fetchAvatar`: Profile/avatar customization (upload, fetch)
- `sendMessageFiltered`: Profanity filtering for messages (simple example)

- CORS enabled for frontend communication
- Room state persistence using local file storage
- Configurable server port and client URL through environment variables
