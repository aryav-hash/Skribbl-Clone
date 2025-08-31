# Skribbl-Clone

A real-time multiplayer drawing and guessing game, inspired by skribbl.io.

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

### Server Features
- Real-time WebSocket communication using Socket.IO
- CORS enabled for frontend communication
- Room state persistence using local file storage
- Configurable server port and client URL through environment variables
