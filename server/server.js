import Fastify from 'fastify';
import cors from '@fastify/cors';
import websocket from '@fastify/websocket';
import fastifyStatic from '@fastify/static';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// Register plugins
await fastify.register(cors, { 
  origin: '*',
  methods: ['GET', 'POST', 'DELETE']
});
await fastify.register(websocket);

// Serve static client files
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../client/dist'),
  prefix: '/',
});

// Fallback to index.html for SPA routing
await fastify.setNotFoundHandler((request, reply) => {
  reply.sendFile('index.html');
});

// In-memory storage (MVP)
const rooms = new Map();
const wsClients = new Map(); // roomId -> Set of WebSocket connections
const disconnectTimers = new Map(); // `${roomId}:${userId}` -> timerId

// Generate unique 4-digit PIN
function generatePIN() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Room management functions
function createRoom(hostUsername) {
  let pin;
  do {
    pin = generatePIN();
  } while ([...rooms.values()].some(r => r.pin === pin));

  const room = {
    id: uuidv4(),
    pin,
    hostId: null,
    users: [],
    queue: [],
    currentTrack: null,
    isPlaying: false,
    skipVotes: new Set(),
    createdAt: Date.now(),
    lastActivity: Date.now(),
    settings: {
      maxUsers: 5,
      inactivityTimeout: 30, // minutes, 0 = never
      skipThreshold: 0.5 // 50% + 1
    }
  };

  rooms.set(room.id, room);
  return room;
}

function getRoomByPIN(pin) {
  return [...rooms.values()].find(r => r.pin === pin);
}

function addUserToRoom(roomId, username) {
  const room = rooms.get(roomId);
  if (!room) return null;
  if (room.users.length >= room.settings.maxUsers) return null;

  const user = {
    id: uuidv4(),
    username,
    isHost: room.users.length === 0, // First user is host
    hasVotedSkip: false,
    lastActivity: Date.now()
  };

  if (user.isHost) {
    room.hostId = user.id;
  }

  room.users.push(user);
  room.lastActivity = Date.now();
  return user;
}

function removeUserFromRoom(roomId, userId) {
  const room = rooms.get(roomId);
  if (!room) return;

  const userIndex = room.users.findIndex(u => u.id === userId);
  if (userIndex === -1) return;

  const wasHost = room.users[userIndex].isHost;
  room.users.splice(userIndex, 1);

  // Auto-host promotion
  if (wasHost && room.users.length > 0) {
    const mostActive = room.users.reduce((prev, curr) => 
      curr.lastActivity > prev.lastActivity ? curr : prev
    );
    mostActive.isHost = true;
    room.hostId = mostActive.id;
  }

  room.lastActivity = Date.now();
}

function addTrackToQueue(roomId, track) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const queueTrack = {
    id: uuidv4(),
    source: track.source,
    sourceId: track.sourceId,
    title: track.title,
    artist: track.artist,
    thumbnail: track.thumbnail,
    duration: track.duration,
    addedBy: track.addedBy,
    addedByName: track.addedByName,
    addedAt: Date.now()
  };

  room.queue.push(queueTrack);
  room.lastActivity = Date.now();
  return queueTrack;
}

function broadcastToRoom(roomId, event, data) {
  const clients = wsClients.get(roomId);
  if (!clients) return;

  const message = JSON.stringify({ event, data });
  clients.forEach(ws => {
    if (ws.readyState === 1) { // OPEN
      ws.send(message);
    }
  });
}

// Periodic cleanup: expire rooms per their inactivityTimeout setting (default 30 min)
setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    const timeoutMs = (room.settings.inactivityTimeout || 30) * 60 * 1000;
    if (now - room.lastActivity > timeoutMs) {
      broadcastToRoom(id, 'room:closed', {});
      const clients = wsClients.get(id);
      if (clients) {
        clients.forEach(ws => ws.close());
        wsClients.delete(id);
      }
      rooms.delete(id);
      console.log(`[Cleanup] Expired room ${id} (PIN ${room.pin}) after inactivity`);
    }
  }
}, 60 * 1000); // check every minute

// REST API Routes
fastify.post('/api/rooms', async (request, reply) => {
  if (rooms.size >= 5) {
    return reply.code(400).send({ error: 'Server is at capacity (5 rooms). Try again later.' });
  }

  const { username } = request.body;
  if (!username || typeof username !== 'string' || !username.trim() || username.trim().length > 30) {
    return reply.code(400).send({ error: 'Username must be 1–30 characters.' });
  }
  const room = createRoom(username.trim());
  const user = addUserToRoom(room.id, username.trim());
  
  return { room: { ...room, users: room.users, skipVotes: undefined }, user };
});

fastify.get('/api/rooms/:pin', async (request, reply) => {
  const { pin } = request.params;
  const room = getRoomByPIN(pin);
  
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  return { 
    room: { 
      ...room, 
      users: room.users, 
      skipVotes: undefined,
      queue: room.queue 
    } 
  };
});

fastify.post('/api/rooms/:id/join', async (request, reply) => {
  const { id } = request.params;
  const { username } = request.body;
  
  const room = rooms.get(id);
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  if (room.users.length >= room.settings.maxUsers) {
    return reply.code(400).send({ error: 'Room is full' });
  }

  if (!username || typeof username !== 'string' || !username.trim() || username.trim().length > 30) {
    return reply.code(400).send({ error: 'Username must be 1–30 characters.' });
  }
  const user = addUserToRoom(id, username.trim());
  broadcastToRoom(id, 'room:user-joined', { user });
  
  return { room: { ...room, users: room.users, skipVotes: undefined }, user };
});

fastify.delete('/api/rooms/:id', async (request, reply) => {
  const { id } = request.params;
  
  if (!rooms.has(id)) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  broadcastToRoom(id, 'room:closed', {});
  
  // Close all WebSocket connections
  const clients = wsClients.get(id);
  if (clients) {
    clients.forEach(ws => ws.close());
    wsClients.delete(id);
  }
  
  rooms.delete(id);
  return { success: true };
});

fastify.get('/api/rooms/:id/queue', async (request, reply) => {
  const { id } = request.params;
  const room = rooms.get(id);
  
  if (!room) {
    return reply.code(404).send({ error: 'Room not found' });
  }

  return { queue: room.queue, currentTrack: room.currentTrack, isPlaying: room.isPlaying };
});

fastify.post('/api/search/youtube', async (request, reply) => {
  const { query } = request.body;
  if (!query || typeof query !== 'string' || !query.trim() || query.length > 200) {
    return reply.code(400).send({ error: 'Invalid search query.' });
  }
  const apiKey = process.env.YOUTUBE_API_KEY;
  
  if (!apiKey) {
    return reply.code(500).send({ error: 'YouTube API key not configured' });
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&videoCategoryId=10&key=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('YouTube API error:', error);
      return reply.code(response.status).send({ error: 'YouTube search failed' });
    }

    const data = await response.json();
    
    // Filter out YouTube auto-generated mixes (playlists that start endless streams)
    const filterMixes = (item) => {
      const title = item.snippet.title.toLowerCase();
      const channel = item.snippet.channelTitle.toLowerCase();
      
      // YouTube auto-generated mixes have specific patterns:
      // - Title is exactly "Mix" or starts with "Mix -"
      // - Channel is "youtube" or "youtube music"
      const isYouTubeChannel = channel === 'youtube' || 
                               channel.includes('youtube music') || 
                               channel === 'vevo';
      
      const isAutoGeneratedMix = title === 'mix' || title.startsWith('mix -');
      
      // Reject only YouTube's auto-generated mixes, allow regular mix videos
      if (isYouTubeChannel && isAutoGeneratedMix) {
        return false;
      }
      return true;
    };
    
    const tracks = data.items
      .filter(filterMixes)
      .map(item => ({
        source: 'youtube',
        sourceId: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
        duration: 0 // Duration requires additional API call
      }));

    return { tracks };
  } catch (error) {
    console.error('Search error:', error);
    return reply.code(500).send({ error: 'Search failed' });
  }
});

// WebSocket handling
fastify.register(async function (fastify) {
  fastify.get('/ws', { websocket: true }, (ws, req) => {
    let currentRoomId = null;
    let currentUserId = null;

    ws.on('error', console.error);

    ws.on('message', async (message) => {
      try {
        const { event, data } = JSON.parse(message);

        switch (event) {
          case 'room:join': {
            const { roomId, userId } = data;

            // Cancel any pending disconnect timer for this user (reconnect case)
            const rejoiningKey = `${roomId}:${userId}`;
            if (disconnectTimers.has(rejoiningKey)) {
              clearTimeout(disconnectTimers.get(rejoiningKey));
              disconnectTimers.delete(rejoiningKey);
              console.log('[WS] Reconnect: cancelled disconnect timer for', userId);
            }

            const room = rooms.get(roomId);

            if (!room) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Room not found' } }));
              return;
            }

            currentRoomId = roomId;
            currentUserId = userId;

            if (!wsClients.has(roomId)) {
              wsClients.set(roomId, new Set());
            }
            wsClients.get(roomId).add(ws);

            // Send current room state
            ws.send(JSON.stringify({
              event: 'room:state',
              data: {
                room: { ...room, skipVotes: undefined },
                queue: room.queue,
                currentTrack: room.currentTrack,
                isPlaying: room.isPlaying,
                skipVotes: room.skipVotes.size,
                skipThreshold: Math.ceil(room.users.length * room.settings.skipThreshold)
              }
            }));
            break;
          }

          case 'queue:add': {
            const { track } = data;
            const room = rooms.get(currentRoomId);
            if (!room) return;

            const queueTrack = addTrackToQueue(currentRoomId, track);
            console.log(`[WS] Track queued: "${queueTrack.title}" in room ${currentRoomId}`);
            
            broadcastToRoom(currentRoomId, 'queue:updated', { 
              queue: room.queue 
            });

            // Auto-play if nothing is playing
            if (!room.currentTrack && !room.isPlaying) {
              room.currentTrack = queueTrack;
              room.isPlaying = true;
              room.skipVotes.clear();

              broadcastToRoom(currentRoomId, 'room:state', {
                room: { ...room, skipVotes: undefined },
                queue: room.queue,
                currentTrack: room.currentTrack,
                isPlaying: room.isPlaying,
                skipVotes: 0,
                skipThreshold: Math.ceil(room.users.length * room.settings.skipThreshold)
              });
            }
            break;
          }

          case 'playback:control': {
            const { action } = data;
            const room = rooms.get(currentRoomId);
            
            if (!room) return;

            const user = room.users.find(u => u.id === currentUserId);
            
            // Skip voting is allowed for all users
            if (action === 'skip') {
              if (user && !user.hasVotedSkip) {
                user.hasVotedSkip = true;
                room.skipVotes.add(currentUserId);
                console.log(`[WS] Skip vote from ${user.username}, total votes: ${room.skipVotes.size}`);
              }

              const votes = room.skipVotes.size;
              const threshold = Math.ceil(room.users.length * room.settings.skipThreshold);
              console.log(`[WS] Votes: ${votes}, Threshold: ${threshold}`);

              if (votes >= threshold) {
                console.log('[WS] Skip threshold reached, skipping...');
                room.queue.shift();
                room.currentTrack = room.queue[0] || null;
                room.isPlaying = !!room.currentTrack;
                room.skipVotes.clear();
                
                // Reset skip votes for all users
                room.users.forEach(u => u.hasVotedSkip = false);

                broadcastToRoom(currentRoomId, 'room:state', {
                  room: { ...room, skipVotes: undefined },
                  queue: room.queue,
                  currentTrack: room.currentTrack,
                  isPlaying: room.isPlaying,
                  skipVotes: 0,
                  skipThreshold: Math.ceil(room.users.length * room.settings.skipThreshold)
                });
              } else {
                // Notify everyone of updated vote count
                broadcastToRoom(currentRoomId, 'vote:updated', {
                  skipVotes: votes,
                  threshold
                });
              }
              break;
            }
            
            // Play/pause/next requires host
            if (!user || !user.isHost) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Only host can control playback' } }));
              return;
            }

            if (action === 'play' || action === 'pause') {
              room.isPlaying = action === 'play';
              broadcastToRoom(currentRoomId, 'room:state', {
                room: { ...room, skipVotes: undefined },
                queue: room.queue,
                currentTrack: room.currentTrack,
                isPlaying: room.isPlaying,
                skipVotes: room.skipVotes.size,
                skipThreshold: Math.ceil(room.users.length * room.settings.skipThreshold)
              });
            } else if (action === 'next') {
              room.queue.shift();
              room.currentTrack = room.queue[0] || null;
              room.isPlaying = !!room.currentTrack;
              room.skipVotes.clear();
              
              // Reset skip votes for all users
              room.users.forEach(u => u.hasVotedSkip = false);

              broadcastToRoom(currentRoomId, 'room:state', {
                room: { ...room, skipVotes: undefined },
                queue: room.queue,
                currentTrack: room.currentTrack,
                isPlaying: room.isPlaying,
                skipVotes: 0,
                skipThreshold: Math.ceil(room.users.length * room.settings.skipThreshold)
              });
            }
            break;
          }

          case 'queue:remove': {
            const { trackId } = data;
            const room = rooms.get(currentRoomId);

            if (!room) return;

            const user = room.users.find(u => u.id === currentUserId);
            if (!user || !user.isHost) {
              ws.send(JSON.stringify({ event: 'error', data: { message: 'Only host can remove tracks' } }));
              return;
            }

            room.queue = room.queue.filter(t => t.id !== trackId);
            broadcastToRoom(currentRoomId, 'queue:updated', { queue: room.queue });
            break;
          }

          case 'queue:clear': {
            const room = rooms.get(currentRoomId);
            if (!room) return;
            const user = room.users.find(u => u.id === currentUserId);
            if (!user || !user.isHost) return;
            // Keep the currently-playing track; only clear the upcoming tracks
            const playing = room.currentTrack
              ? room.queue.filter(t => t.id === room.currentTrack.id)
              : [];
            room.queue = playing;
            room.lastActivity = Date.now();
            broadcastToRoom(currentRoomId, 'queue:updated', { queue: room.queue });
            break;
          }

          case 'host:transfer': {
            const { targetUserId } = data;
            const room = rooms.get(currentRoomId);
            if (!room) return;
            const requester = room.users.find(u => u.id === currentUserId);
            if (!requester || !requester.isHost) return;
            const target = room.users.find(u => u.id === targetUserId);
            if (!target) return;
            room.users.forEach(u => { u.isHost = false; });
            target.isHost = true;
            room.hostId = targetUserId;
            room.lastActivity = Date.now();
            broadcastToRoom(currentRoomId, 'room:host-changed', { newHostId: targetUserId });
            break;
          }

          case 'room:leave': {
            if (currentRoomId && currentUserId) {
              // Cancel any pending disconnect timer for this intentional leave
              const leaveKey = `${currentRoomId}:${currentUserId}`;
              if (disconnectTimers.has(leaveKey)) {
                clearTimeout(disconnectTimers.get(leaveKey));
                disconnectTimers.delete(leaveKey);
              }

              const room = rooms.get(currentRoomId);
              if (room) {
                const leavingUser = room.users.find(u => u.id === currentUserId);
                const wasHost = leavingUser?.isHost ?? false;

                removeUserFromRoom(currentRoomId, currentUserId);

                if (room.users.length === 0) {
                  // Clean up empty room
                  const clients = wsClients.get(currentRoomId);
                  if (clients) {
                    clients.forEach(c => c.close());
                    wsClients.delete(currentRoomId);
                  }
                  rooms.delete(currentRoomId);
                } else {
                  broadcastToRoom(currentRoomId, 'room:user-left', { userId: currentUserId });
                  if (wasHost) {
                    const newHost = room.users.find(u => u.isHost);
                    if (newHost) {
                      broadcastToRoom(currentRoomId, 'room:host-changed', { newHostId: newHost.id });
                    }
                  }
                }
              }
            }
            break;
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (!currentRoomId || !currentUserId) return;

      // Remove this specific WS connection immediately
      const clients = wsClients.get(currentRoomId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          wsClients.delete(currentRoomId);
        }
      }

      // Grace period: give the user 45s to reconnect before removing them from the room
      const timerKey = `${currentRoomId}:${currentUserId}`;
      const roomIdSnapshot = currentRoomId;
      const userIdSnapshot = currentUserId;

      const timerId = setTimeout(() => {
        disconnectTimers.delete(timerKey);

        const room = rooms.get(roomIdSnapshot);
        if (!room) return;

        const leavingUser = room.users.find(u => u.id === userIdSnapshot);
        if (!leavingUser) return; // Already removed (e.g., by room:leave)

        const wasHost = leavingUser.isHost;
        removeUserFromRoom(roomIdSnapshot, userIdSnapshot);

        if (room.users.length === 0) {
          rooms.delete(roomIdSnapshot);
        } else {
          broadcastToRoom(roomIdSnapshot, 'room:user-left', { userId: userIdSnapshot });
          if (wasHost) {
            const newHost = room.users.find(u => u.isHost);
            if (newHost) {
              broadcastToRoom(roomIdSnapshot, 'room:host-changed', { newHostId: newHost.id });
            }
          }
        }
      }, 60000);

      disconnectTimers.set(timerKey, timerId);
      console.log(`[WS] User ${userIdSnapshot} disconnected; 60s grace period started`);
    });
  });
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3030, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3030');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();