# Software Requirements Specification (SRS)
# Social Jukebox Application

**Document Version:** 1.0  
**Date:** 2026-05-16  
**Status:** Draft  
**Related BRS:** v1.0  
**Author:** MistaKrabs 🦀

---

## 1. Introduction

### 1.1 Purpose

This document provides a detailed software specification for the Social Jukebox application. It defines functional and non-functional requirements, technical architecture, and implementation guidelines for development teams.

### 1.2 Scope

The Social Jukebox is a mobile-first PWA that enables collaborative music playback across multiple devices. The MVP scope includes:
- Room creation with PIN codes
- Guest joining via PIN
- YouTube search and playback
- Real-time queue synchronization
- FIFO queue with skip voting

### 1.3 Definitions, Acronyms, and Abbreviations

| Term | Definition |
|------|------------|
| **Host** | User who creates the room and controls playback |
| **Guest** | User who joins a room via PIN |
| **Room** | A shared session containing a queue and connected users |
| **Queue** | Ordered list of songs to be played |
| **PIN** | 4-digit code for room routing (like Jack Box games — enables multiple concurrent sessions) |
| **PWA** | Progressive Web App |
| **WebSocket** | Real-time bidirectional communication protocol |
| **FIFO** | First In, First Out queue behavior |
| **Skip Vote** | User vote to skip current track |

---

## 2. User Stories

### 2.1 Host Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-H1 | As a host, I want to create a room so that I can start a music session | - Room created with unique 4-digit PIN displayed on screen |
| US-H2 | As a host, I want to see the current queue so that I know what's playing | - Queue displays in order with song title, artist, thumbnail |
| US-H3 | As a host, I want to control playback so that I can pause/skip/skip to next | - Play, pause, skip, and next controls functional |
| US-H4 | As a host, I want to see who is in the room so that I know who joined | - List of connected users displayed with their names |
| US-H5 | As a host, I want to promote a guest to host if I leave | - Button to transfer host status to another user |

### 2.2 Guest Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-G1 | As a guest, I want to join a room using a PIN so that I can participate | - Enter 4-digit PIN → join room successfully |
| US-G2 | As a guest, I want to search for songs so that I can add them to the queue | - Search YouTube → see results → select song to add |
| US-G3 | As a guest, I want to see the queue update in real-time so that I know what's playing | - Queue updates within 500ms of any change |
| US-G4 | As a guest, I want to vote to skip a song so that we can move to the next track | - Click skip button → vote recorded → queue updates when majority reached |
| US-G5 | As a guest, I want to play songs directly on my phone if no speaker is available | - Toggle to play audio locally through phone speaker |

### 2.3 System Stories

| ID | Story | Acceptance Criteria |
|----|-------|---------------------|
| US-S1 | As the system, I want to expire inactive rooms so that resources are freed | - Room closes after 30 minutes of inactivity if no timeout set |
| US-S2 | As the system, I want to handle host disconnection gracefully | - Most active user promoted to host automatically |

---

## 3. Use Cases

### 3.1 UC-001: Create Room

**Actor:** Host  
**Preconditions:** User has opened the application  
**Flow:**
1. User clicks "Create Room" button
2. System generates unique 4-digit PIN
3. System creates room session with host as owner
4. System displays PIN to host
5. System displays empty queue and room controls

**Postconditions:** Room exists with unique PIN, host is connected

### 3.2 UC-002: Join Room

**Actor:** Guest  
**Preconditions:** Guest has opened the application, knows room PIN  
**Flow:**
1. User clicks "Join Room" button
2. User enters 4-digit PIN
3. System validates PIN against active rooms
4. If valid: System adds user to room, syncs current queue
5. If invalid: System displays error message

**Postconditions:** Guest is connected to room, sees current queue

### 3.3 UC-003: Add Song to Queue

**Actor:** Guest (or Host)  
**Preconditions:** User is connected to a room  
**Flow:**
1. User clicks "Add Song" button
2. User enters search query
3. System queries YouTube Data API
4. System displays search results
5. User selects a song
6. System adds song to queue (end of FIFO)
7. System broadcasts queue update to all connected users

**Postconditions:** Song added to queue, all clients updated

### 3.4 UC-005: Vote to Skip

**Actor:** Guest  
**Preconditions:** User is connected to a room, song is playing  
**Flow:**
1. User clicks "Skip" button on current song
2. System records skip vote
3. System broadcasts vote count to all clients
4. If votes >= threshold (ceil(n/2)), system skips to next song
5. If votes < threshold, current song continues

**Postconditions:** Vote recorded, possibly skipped to next song

### 3.5 UC-006: Playback on Host Device

**Actor:** Host  
**Preconditions:** Host has created room, queue has songs  
**Flow:**
1. System plays first song in queue (via YouTube IFrame)
2. Host's device outputs audio
3. When song ends, system automatically plays next in queue
4. If queue empty, system displays "Queue empty" state

**Postconditions:** Audio plays, queue advances automatically

---

## 4. Functional Requirements

### 4.1 Room Management

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-001 | Room Creation | System shall allow a user to create a new room and receive a unique 4-digit PIN |
| FR-002 | Room Joining | System shall allow users to join an existing room using a valid PIN |
| FR-003 | Room Disconnect | System shall remove user from room when they disconnect |
| FR-004 | Room Expiry | System shall close room after configured inactivity period (default: 30 min) |
| FR-005 | Host Transfer | System shall allow host to transfer host status to another user |
| FR-006 | Auto Host Transfer | System shall automatically promote most active user to host if host disconnects |

### 4.2 Queue Management

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-010 | Add to Queue | System shall allow any connected user to add songs to the queue |
| FR-011 | View Queue | System shall display current queue to all connected users |
| FR-012 | Remove from Queue | System shall allow host to remove any song from queue |
| FR-013 | Clear Queue | System shall allow host to clear all songs from queue |
| FR-014 | Reorder Queue | System shall allow host to drag-and-drop reorder queue |

### 4.3 Playback Control

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-020 | Play | System shall play the first song in queue |
| FR-021 | Pause | System shall pause current playback |
| FR-022 | Skip | System shall skip to next song in queue |
| FR-023 | Auto-Advance | System shall automatically play next song when current ends |
| FR-024 | Host Playback | System shall output audio through host's device |
| FR-025 | Guest Playback | System shall optionally output audio through guest's device |

### 4.4 Search & Source Integration

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-030 | YouTube Search | System shall search YouTube for songs matching user query |
| FR-031 | YouTube Playback | System shall play YouTube audio via embedded player (video optional/disabled by default) |
| FR-032 | Spotify Integration | System shall support Spotify (future phase) |
| FR-033 | Apple Music Integration | System shall support Apple Music (future phase) |
| FR-034 | Amazon Music Integration | System shall support Amazon Music (future phase) |

### 4.5 Skip Voting

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-040 | Submit Skip Vote | System shall allow any guest to vote to skip current song |
| FR-041 | Vote Threshold | System shall skip song when votes >= ceil(room_users / 2) |
| FR-042 | Vote Reset | System shall reset vote count when new song starts |
| FR-043 | One Vote Per User | System shall allow only one skip vote per user per song |

### 4.6 Real-Time Synchronization

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-050 | WebSocket Connection | System shall maintain persistent WebSocket connection for each client |
| FR-051 | Queue Sync | System shall broadcast queue changes to all clients within 500ms |
| FR-052 | Playback Sync | System shall synchronize playback state across clients |
| FR-053 | User Join/Leave | System shall broadcast user join/leave events |

### 4.7 User Interface

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-060 | Mobile-First Design | UI shall be optimized for mobile screens (320px-428px) |
| FR-061 | PWA Support | Application shall be installable as PWA |
| FR-062 | Offline State | Application shall display appropriate offline message |
| FR-063 | Loading States | UI shall show loading indicators during async operations |

---

## 5. Technical Architecture

### 5.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (PWA)                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   React     │  │   Zustand   │  │  YouTube IFrame Player  │ │
│  │   Views     │  │   Store     │  │                         │ │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘ │
│         │                │                      │               │
│         └────────────────┼──────────────────────┘               │
│                          │ WebSocket                             │
├──────────────────────────┼──────────────────────────────────────┤
│                     BACKEND                                      │
│  ┌────────────────┐  ┌─────────────┐  ┌───────────────────────┐ │
│  │  Room Manager  │  │ Queue Engine│  │  WebSocket Handler    │ │
│  │  Service       │  │             │  │                       │ │
│  └───────┬────────┘  └──────┬──────┘  └───────────┬───────────┘ │
│          │                  │                     │              │
│  ┌───────┴──────────────────┴─────────────────────┴───────────┐ │
│  │                    Core Services                            │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │ │
│  │  │ Room Store  │  │ Auth Service│  │  YouTube API Client │ │ │
│  │  │ (In-Memory) │  │             │  │                     │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Technology Stack

| Layer | Technology | Justification |
|-------|------------|---------------|
| Frontend Framework | React 18 + Vite | Fast development, excellent developer experience |
| State Management | Zustand | Lightweight, simple API, great for real-time state |
| Styling | Tailwind CSS | Rapid UI development, mobile-first utilities |
| PWA | Vite PWA Plugin | Offline support, installability |
| Backend Runtime | Node.js + Fastify | Fast I/O, excellent WebSocket support (ws library) |
| **Upgradeability Note** | All music source integrations must be implemented as pluggable adapters following a common interface (e.g., `MusicSourceAdapter`) to enable easy addition of Spotify, Apple Music, Amazon Music in future phases. | |
| Real-time | WebSocket (ws) | Bidirectional, low-latency communication |
| Database | In-Memory (MVP) | Simple, fast for ephemeral room data |
| Music Source | YouTube Data API v3 | Free tier available, extensive catalog |
| Player | YouTube IFrame API | Reliable playback, no DRM issues |

### 5.3 API Specification

#### 5.3.1 REST Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/rooms | Create a new room |
| GET | /api/rooms/:pin | Get room details by PIN |
| DELETE | /api/rooms/:id | Close a room |
| POST | /api/rooms/:id/join | Join a room (with user info) |
| POST | /api/rooms/:id/leave | Leave a room |
| GET | /api/rooms/:id/queue | Get room queue |
| POST | /api/search/youtube | Search YouTube for tracks |

#### 5.3.2 WebSocket Events

**Client → Server:**

| Event | Payload | Description |
|-------|---------|-------------|
| `room:join` | `{ pin, username }` | Join a room |
| `room:leave` | `{}` | Leave current room |
| `queue:add` | `{ track }` | Add song to queue |
| `queue:remove` | `{ trackId }` | Remove song from queue |
| `playback:control` | `{ action }` | Play/pause/skip |
| `vote:skip` | `{}` | Vote to skip current song |

**Server → Client:**

| Event | Payload | Description |
|-------|---------|-------------|
| `room:created` | `{ pin, roomId }` | Room created successfully |
| `room:joined` | `{ room, queue, users }` | Joined room with state |
| `room:user-joined` | `{ user }` | User joined room |
| `room:user-left` | `{ userId }` | User left room |
| `room:host-changed` | `{ newHostId }` | Host transferred |
| `queue:updated` | `{ queue }` | Queue changed |
| `playback:state` | `{ playing, currentTrack, progress }` | Playback state |
| `vote:updated` | `{ skipVotes, threshold }` | Skip vote count |

### 5.4 Data Models

#### 5.4.1 Room

```typescript
interface Room {
  id: string;           // UUID
  pin: string;          // 4-digit PIN
  hostId: string;       // User ID of host
  users: User[];        // Connected users
  queue: Track[];       // Current queue
  createdAt: number;    // Unix timestamp
  lastActivity: number; // Unix timestamp
  settings: RoomSettings;
}
```

#### 5.4.2 User

```typescript
interface User {
  id: string;           // UUID
  username: string;     // Display name
  isHost: boolean;      // Host status
  hasVotedSkip: boolean; // Skip vote for current track
  lastActivity: number; // For auto-host promotion
}
```

#### 5.4.3 Track

```typescript
interface Track {
  id: string;           // Unique track ID
  source: 'youtube';    // Music source
  sourceId: string;     // YouTube video ID
  title: string;        // Track title
  artist: string;       // Artist name
  thumbnail: string;    // Thumbnail URL
  duration: number;     // Duration in seconds
  addedBy: string;      // User ID who added
  addedAt: number;      // Unix timestamp
}
```

#### 5.4.4 RoomSettings

```typescript
interface RoomSettings {
  maxUsers: number;           // Max users (default: 5)
  inactivityTimeout: number;  // Minutes (default: 30, 0 = never)
  skipThreshold: number;      // Votes needed (default: 50% + 1)
  playbackMode: 'host' | 'guest'; // Where audio plays
}
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NF-001 | Page Load Time | <3 seconds on 3G |
| NF-002 | WebSocket Latency | <100ms round-trip |
| NF-003 | Queue Sync Latency | <500ms to all clients |
| NF-004 | Search Response | <2 seconds for YouTube search |
| NF-005 | Playback Start | <2 seconds after pressing play |

### 6.2 Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NF-010 | Uptime | 99.9% (excluding planned maintenance) |
| NF-011 | Auto-reconnect | WebSocket reconnects automatically on disconnect |
| NF-012 | Queue Persistence | Queue survives host refresh (session memory) |

### 6.3 Usability

| ID | Requirement | Target |
|----|-------------|--------|
| NF-020 | Mobile Support | Full functionality on iOS Safari and Android Chrome |
| NF-021 | PWA Install | Add to Home Screen works on iOS and Android |
| NF-022 | Accessibility | WCAG 2.1 AA compliant (future) |

### 6.4 Security

| ID | Requirement | Target |
|----|-------------|--------|
| NF-030 | PIN Complexity | 4-digit numeric (MVP), consider alphanumeric for v2 |
| NF-031 | Input Sanitization | All user inputs sanitized |
| NF-032 | YouTube API Key | Server-side only, not exposed to client |

---

## 7. Component Design

### 7.1 Frontend Components

| Component | Responsibility |
|-----------|---------------|
| `App` | Root component, routing, WebSocket provider |
| `CreateRoomScreen` | Host creates new room |
| `JoinRoomScreen` | Guest enters PIN to join |
| `RoomScreen` | Main room view with queue and controls |
| `SearchModal` | YouTube search interface |
| `QueueList` | Displays current queue |
| `NowPlaying` | Current track info and controls |
| `SkipButton` | Vote to skip with vote counter |
| `UserList` | Shows connected users |

### 7.2 Backend Services

| Service | Responsibility |
|---------|---------------|
| `RoomManager` | Create, close, expire rooms |
| `QueueEngine` | Add, remove, reorder tracks |
| `PlaybackController` | Manage playback state |
| `WebSocketHandler` | Handle client connections |
| `YouTubeClient` | Search and fetch track metadata |

---

## 8. Error Handling

| Scenario | User Message | System Action |
|----------|--------------|---------------|
| Invalid PIN | "Room not found. Check the PIN and try again." | Return 404 |
| Room full | "This room is full. Maximum 5 users allowed." | Return 400 |
| Search failed | "Search unavailable. Check your connection." | Show toast |
| Playback error | "Couldn't play track. Skipping to next." | Auto-skip |
| WebSocket disconnect | "Connection lost. Reconnecting..." | Auto-reconnect |

---

## 9. Future Requirements (Post-MVP)

| ID | Requirement | Description |
|----|-------------|-------------|
| FR-100 | Spotify Integration | Connect Spotify Premium accounts |
| FR-101 | Apple Music Integration | Connect Apple Music accounts |
| FR-102 | Amazon Music Integration | Connect Amazon Music accounts |
| FR-103 | Cast from Phone | Guest streams audio from their device |
| FR-104 | Shared Room Account | Room has shared credentials for group access |
| FR-105 | Bluetooth Discovery | Find nearby rooms via Bluetooth |
| FR-106 | LAN Discovery | Find rooms on local network via mDNS |
| FR-107 | Turntable Mode | DJ-style mixing interface |

---

## 10. Appendix

### 10.1 YouTube API Requirements

- YouTube Data API v3 key required
- Quota: 10,000 units/day (free tier)
- Search costs 100 units, thumbnail fetch costs 1 unit

### 10.2 Browser Support (MVP)

| Browser | Version |
|---------|---------|
| Chrome | 80+ |
| Safari | 14+ |
| Firefox | 75+ |
| Edge | 80+ |

### 10.3 PWA Requirements

- Service Worker for offline fallbacks
- Web App Manifest with icons
- Add to Home Screen prompt

---

**End of SRS**