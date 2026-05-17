# SpinDeck

**The floor writes the set.**

SpinDeck is a collaborative jukebox for any room. The host drops the needle — guests request tracks, vote to skip, and watch the queue move in real-time. No accounts, no installs, no friction. Just a 4-digit PIN and a shared love of music.

Built as a mobile-first PWA with a neon/vinyl aesthetic. YouTube powers playback. WebSockets keep everyone in sync.

---

## How It Works

1. **Host** opens SpinDeck, enters their DJ tag, and spins up a room. A slot machine reveals a 4-digit PIN.
2. **Guests** enter the PIN (or scan the QR code) on their own phones to join.
3. Everyone can search YouTube and add tracks to the shared queue.
4. Music plays through the host's device — or speakers if connected.
5. Guests vote to skip. Majority rules.

That's it. No sign-up, no pairing, no Bluetooth hassle.

---

## Features

- Slot machine PIN reveal animation on room creation
- QR code deep-link join (`?pin=XXXX`) — scan and land straight in the room
- Real-time queue sync across all connected devices via WebSocket
- FIFO queue with majority-vote skip (threshold: `ceil(users / 2)`)
- Host controls: play/pause, skip, remove tracks, clear upcoming queue
- Manual host transfer — promote any guest to the deck
- Auto host promotion on disconnect (most active user takes over)
- Auto-reconnect with exponential backoff if the connection drops
- "Connection lost · Reconnecting…" banner so users always know what's happening
- YouTube playback error → automatic track skip
- Room inactivity expiry (default 30 min, configurable)
- PWA installable — Add to Home Screen on iOS and Android
- Neon/vinyl design system with spinning disc, waveform progress, and EQ bars

---

## Tech Stack

**Client** — React 18, Vite 5, Zustand, Tailwind CSS, `qrcode.react`, YouTube IFrame API

**Server** — Node.js, Fastify 4, `@fastify/websocket`, `@fastify/static`, in-memory room store

The server statically serves the built client from `client/dist/`, so there's only one process to run in production.

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [YouTube Data API v3 key](https://console.cloud.google.com/) (free tier: 10,000 units/day)

### Setup

```bash
# Clone
git clone https://github.com/CodeByMAB/SpinDeck.git
cd SpinDeck

# Install deps
cd client && npm install
cd ../server && npm install

# Configure environment
cp server/.env.example server/.env
# Add your YouTube API key to server/.env
```

`server/.env`:
```
YOUTUBE_API_KEY=your_key_here
```

### Development

```bash
# Terminal 1 — server (port 3030)
cd server && node server.js

# Terminal 2 — client dev server with HMR (port 5173)
cd client && npm run dev
```

### Production

```bash
cd client && npm run build   # outputs to client/dist/
cd ../server && node server.js   # serves dist/ + handles /api and /ws
```

App runs at `http://localhost:3030`.

---

## Project Structure

```
SpinDeck/
├── client/
│   └── src/
│       ├── components/        # All UI screens and widgets
│       │   ├── HomeScreen.jsx
│       │   ├── CreateRoomScreen.jsx
│       │   ├── JoinRoomScreen.jsx
│       │   ├── RoomScreen.jsx
│       │   ├── NowPlaying.jsx
│       │   ├── QueueList.jsx
│       │   ├── SearchModal.jsx
│       │   ├── UserList.jsx
│       │   ├── Brand.jsx      # VinylDisc, Waveform, EqBars, Wordmark
│       │   ├── SlotMachine.jsx
│       │   └── PinQRCode.jsx
│       ├── stores/
│       │   └── useStore.js    # Zustand store — WS, room, queue, playback
│       ├── App.jsx
│       └── index.css          # Design system (neon palette, vinyl, animations)
│
├── server/
│   ├── server.js              # Fastify: REST + WebSocket + static serving
│   └── .env                   # YOUTUBE_API_KEY (never committed)
│
└── docs/
    ├── BRS.md                 # Business Requirements Specification
    └── SRS.md                 # Software Requirements Specification
```

---

## WebSocket Protocol

**Client → Server**

| Event | Payload |
|-------|---------|
| `room:join` | `{ roomId, userId }` |
| `room:leave` | `{}` |
| `queue:add` | `{ track }` |
| `queue:remove` | `{ trackId }` |
| `queue:clear` | `{}` |
| `playback:control` | `{ action }` — `play` / `pause` / `next` / `skip` |
| `host:transfer` | `{ targetUserId }` |

**Server → Client**

| Event | Payload |
|-------|---------|
| `room:state` | Full room snapshot (room, queue, currentTrack, isPlaying, skipVotes) |
| `queue:updated` | `{ queue }` |
| `room:user-joined` | `{ user }` |
| `room:user-left` | `{ userId }` |
| `room:host-changed` | `{ newHostId }` |
| `vote:updated` | `{ skipVotes, threshold }` |
| `room:closed` | `{}` |
| `error` | `{ message }` |

---

## Design System

The visual language is neon-on-dark — think record store at 2am. Key elements:

- **Vinyl disc** — spins during playback, carries album art in the center label
- **Waveform** — procedurally generated, scrubs with playback progress
- **Slot machine** — individual digit reels with staggered deceleration on PIN reveal
- **Neon palette** — cyan `#00D9FF`, primary purple `#A855F7`, magenta `#FF2D8E`
- **Fonts** — Space Grotesk (display), JetBrains Mono (PIN/timecodes), Inter (body)

---

## Roadmap

The MVP covers YouTube playback. Future phases planned in the SRS:

- Spotify, Apple Music, Amazon Music integrations (pluggable adapter pattern)
- Guest playback mode — audio on the guest's own device
- Drag-to-reorder queue
- Room persistence across sessions
- Bluetooth/LAN proximity room discovery
- DJ mode with turntable controls

---

## License

MIT
