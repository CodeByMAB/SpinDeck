# Social Jukebox 🎵

A collaborative music queue PWA where hosts create rooms with PIN codes and guests join to add songs to a shared queue. Built with React, Node.js, Fastify, and WebSockets.

## Features

- **Room Creation** - Hosts create rooms and get a 4-digit PIN (like Jack Box games)
- **PIN-based Joining** - Guests join by entering the room PIN
- **YouTube Search** - Search and add songs from YouTube
- **Real-time Sync** - Queue and playback state sync across all devices via WebSocket
- **FIFO Queue** - Songs play in order
- **Skip Voting** - Guests can vote to skip (majority wins)
- **Auto Host Transfer** - If host leaves, most active user becomes host
- **PWA** - Installable on mobile devices

## Quick Start

### Prerequisites

- Node.js 18+
- YouTube Data API v3 key (free from Google Cloud Console)

### Setup

1. **Clone and install dependencies:**

```bash
# Server
cd server
cp .env.example .env
# Edit .env with your YouTube API key
npm install

# Client
cd ../client
npm install
```

2. **Get YouTube API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a project
   - Enable YouTube Data API v3
   - Create credentials (API Key)
   - Add to `server/.env`

### Run Development

```bash
# Terminal 1 - Server
cd server
npm run dev

# Terminal 2 - Client  
cd client
npm run dev
```

- Server: http://localhost:3001
- Client: http://localhost:5173

### Build for Production

```bash
cd client
npm run build
```

The built PWA will be in `client/dist/`

## Architecture

```
┌─────────────────────┐     WebSocket      ┌─────────────────────┐
│   React PWA Client │◄──────────────────►│   Node.js Server    │
│   - Zustand Store  │     (ws://:3001)    │   - Fastify         │
│   - Tailwind CSS   │                    │   - Room Manager    │
│   - PWA Plugin     │                    │   - YouTube API     │
└─────────────────────┘                    └─────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Zustand, Tailwind CSS, Vite PWA |
| Backend | Node.js, Fastify, @fastify/websocket |
| Real-time | WebSocket |
| Music Source | YouTube Data API v3 |

## MVP Limitations

- Only YouTube (audio-first)
- Max 5 users per room
- In-memory room storage (rooms lost on server restart)
- No persistent user accounts

## Future Features (Post-MVP)

- Spotify, Apple Music, Amazon Music integrations
- "Cast from phone" hybrid model
- Shared room login
- Bluetooth proximity joining
- DJ mode with turntable

## License

MIT