# SpinDeck 🎛️

> A collaborative Spotify queue app — create a room, share the PIN, and let everyone add tracks.

## What It Is

SpinDeck lets you create a shared music experience. Host starts a room, gets a 4-digit PIN, and shares it with friends. Anyone can search Spotify, add tracks to the queue, and see the queue update in real-time. Host controls playback, guests can skip-vote.

## Features

- **Room Creation** — Host creates a room and gets a shareable 4-digit PIN
- **Numpad Join** — Guests enter the PIN to join (mobile-friendly)
- **Real-time Sync** — WebSocket-powered queue, playback state, and skip votes
- **QR Join** — Scan a QR code to instantly join a room
- **PWA Ready** — Installable on mobile (with offline support)
- **Skip Voting** — Guests can vote to skip; threshold-based skip triggers

## Tech Stack

### Client
- **React 18** — UI framework
- **Vite** — Build tool + PWA plugin
- **Zustand** — State management
- **Tailwind CSS** — Styling with custom neon palette
- **qrcode.react** — QR code generation

### Server
- **Fastify** — Node.js web framework
- **@fastify/websocket** — Real-time room management
- **@fastify/cors** — Cross-origin requests
- **UUID** — Room ID generation

## Project Structure

```
social-jukebox/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components (Room, Queue, Search, etc.)
│   │   ├── stores/        # Zustand state stores
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Helpers
│   │   ├── App.jsx        # Main app component
│   │   └── index.css      # Tailwind + custom styles
│   ├── index.html
│   ├── tailwind.config.js # Neon palette + animations
│   └── vite.config.js     # PWA config
│
├── server/                 # Fastify backend
│   ├── server.js          # WebSocket + REST endpoints
│   └── .env               # Environment config
│
└── docs/
    ├── SRS.md             # Software Requirements Specification
    └── BRS.md             # Business Requirements Specification
```

## Getting Started

### Prerequisites

- Node.js 18+
- Spotify Developer account (for API credentials)

### Setup

```bash
# Clone the repo
git clone https://github.com/CodeByMAB/spindeck.git
cd spindeck

# Install client dependencies
cd client && npm install

# Install server dependencies
cd ../server && npm install

# Configure Spotify credentials
cp server/.env.example server/.env
# Edit .env with your Spotify API keys
```

### Running

```bash
# Terminal 1: Start the server
cd server
npm run dev    # or: npm start

# Terminal 2: Start the client
cd client
npm run dev
```

The client runs at `http://localhost:5173` by default.

## Design System

### Typography
- **Space Grotesk** — Display headings
- **JetBrains Mono** — PIN cells, BPM, timecodes
- **Inter** — Body text

### Theme
Custom neon palette with dark base — vinyl textures, glowing buttons, waveform animations. The vinyl disc rotates during playback; album art drops into the center label.

## API

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `create-room` | client → server | `{ hostId }` |
| `room-created` | server → client | `{ roomId, pin }` |
| `join-room` | client → server | `{ pin }` |
| `room-joined` | server → client | `{ room, tracks, users }` |
| `add-track` | client → server | `{ roomId, track }` |
| `track-added` | server → client | `{ track }` |
| `skip-vote` | client → server | `{ roomId, trackId }` |
| `track-skipped` | server → client | `{ trackId }` |
| `playback-update` | bidirectional | `{ isPlaying, elapsed }` |

### REST Endpoints

- `GET /health` — Server health check
- `GET /room/:pin` — Get room state by PIN
- `POST /search` — Spotify search proxy

## License

MIT

---