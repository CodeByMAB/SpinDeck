import { create } from 'zustand';

const API_BASE = ''; // Same origin (server serves client + API)

// Module-level reconnect state (not UI state — no need to put in the store)
let _reconnectDelay = 1000;
let _intentionalClose = false;

// localStorage keys
const STORAGE_KEYS = {
  USER: 'sj_user',
  ROOM: 'sj_room',
  USERNAME: 'sj_username'
};

// Save to localStorage
const saveToStorage = (user, room, username) => {
  try {
    if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEYS.USER);
    
    if (room) localStorage.setItem(STORAGE_KEYS.ROOM, JSON.stringify(room));
    else localStorage.removeItem(STORAGE_KEYS.ROOM);
    
    if (username) localStorage.setItem(STORAGE_KEYS.USERNAME, username);
    else localStorage.removeItem(STORAGE_KEYS.USERNAME);
  } catch (e) {
    console.error('[Storage] Save failed:', e);
  }
};

// Load from localStorage
const loadFromStorage = () => {
  try {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    const room = localStorage.getItem(STORAGE_KEYS.ROOM);
    const username = localStorage.getItem(STORAGE_KEYS.USERNAME);
    
    return {
      user: user ? JSON.parse(user) : null,
      room: room ? JSON.parse(room) : null,
      username: username || ''
    };
  } catch (e) {
    console.error('[Storage] Load failed:', e);
    return { user: null, room: null, username: '' };
  }
};

// Load initial state
const initialState = loadFromStorage();

export const useStore = create((set, get) => ({
  // Connection state
  ws: null,
  isConnected: false,
  
  // User state (persistable)
  user: initialState.user,
  username: initialState.username,
  
  // Room state (persistable)
  room: initialState.room,
  roomError: null,
  
  // Queue state
  queue: [],
  currentTrack: null,
  isPlaying: false,
  
  // Voting state
  skipVotes: 0,
  skipThreshold: 1,
  hasVotedSkip: false,
  
  // UI state
  isLoading: false,
  searchResults: [],
  isSearching: false,
  searchError: null,
  
  // Actions
  setUsername: (username) => {
    set({ username });
    saveToStorage(get().user, get().room, username);
  },
  
  createRoom: async () => {
    const { username } = get();
    if (!username.trim()) {
      set({ roomError: 'Please enter your name' });
      return false;
    }
    
    set({ isLoading: true, roomError: null });
    
    try {
      const response = await fetch(`${API_BASE}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        set({ roomError: data.error || 'Failed to create room', isLoading: false });
        return false;
      }
      
      set({
        room: data.room,
        user: data.user,
        isLoading: false
      });

      // Persist to localStorage
      saveToStorage(data.user, data.room, get().username);

      get().connectWebSocket();
      return true;
    } catch (error) {
      set({ roomError: 'Connection failed', isLoading: false });
      return false;
    }
  },

  joinRoom: async (pin) => {
    const { username } = get();
    if (!username.trim()) {
      set({ roomError: 'Please enter your name' });
      return false;
    }
    
    if (!pin.trim()) {
      set({ roomError: 'Please enter room PIN' });
      return false;
    }
    
    set({ isLoading: true, roomError: null });
    
    try {
      // First, get room by PIN
      const getResponse = await fetch(`${API_BASE}/api/rooms/${pin}`);
      
      if (!getResponse.ok) {
        set({ roomError: 'Room not found. Check the PIN and try again.', isLoading: false });
        return false;
      }
      
      const { room } = await getResponse.json();
      
      // Then join the room
      const joinResponse = await fetch(`${API_BASE}/api/rooms/${room.id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      
      const data = await joinResponse.json();
      
      if (!joinResponse.ok) {
        set({ roomError: data.error || 'Failed to join room', isLoading: false });
        return false;
      }
      
      set({
        room: data.room,
        user: data.user,
        isLoading: false
      });

      // Persist to localStorage
      saveToStorage(data.user, data.room, get().username);

      get().connectWebSocket();
      return true;
    } catch (error) {
      set({ roomError: 'Connection failed', isLoading: false });
      return false;
    }
  },

  leaveRoom: () => {
    _intentionalClose = true;
    const { ws } = get();
    if (ws) {
      try { ws.close(); } catch {}
    }

    set({
      room: null,
      user: null,
      ws: null,
      isConnected: false,
      queue: [],
      currentTrack: null,
      isPlaying: false,
      skipVotes: 0,
      hasVotedSkip: false
    });

    saveToStorage(null, null, get().username);
  },
  
  connectWebSocket: () => {
    const { room, user, ws: existingWs } = get();
    console.log('[connectWebSocket] Starting...', { room: !!room, user: !!user });
    if (!room || !user) {
      console.error('[connectWebSocket] Missing room or user');
      return;
    }
    // Bail out if already connected or in the process of connecting
    if (existingWs && (existingWs.readyState === WebSocket.OPEN || existingWs.readyState === WebSocket.CONNECTING)) {
      console.log('[connectWebSocket] Already connected/connecting, skipping');
      return;
    }
    
    // Use same host as current page; match ws/wss to the page protocol
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws`;
    console.log('[connectWebSocket] Connecting to:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    console.log('[connectWebSocket] WebSocket created, state:', ws.readyState);
    
    ws.onopen = () => {
      console.log('[WS] Connected!');
      _reconnectDelay = 1000; // reset backoff on successful connect
      set({ isConnected: true, ws });
      ws.send(JSON.stringify({
        event: 'room:join',
        data: { roomId: room.id, userId: user.id }
      }));
    };
    
    ws.onmessage = (event) => {
      const { event: eventType, data } = JSON.parse(event.data);
      
      switch (eventType) {
        case 'room:state': {
          // Defensive: if room is null/undefined, don't update (prevents blank screen)
          if (!data.room) {
            console.warn('[WS] room:state received with null room, ignoring');
            break;
          }
          // FR-042: reset skip vote when track changes
          const prevTrackId = get().currentTrack?.id;
          const trackChanged = prevTrackId !== data.currentTrack?.id;
          set({
            room: data.room,
            queue: data.queue || [],
            currentTrack: data.currentTrack,
            isPlaying: data.isPlaying,
            skipVotes: data.skipVotes,
            skipThreshold: data.skipThreshold,
            hasVotedSkip: trackChanged ? false : get().hasVotedSkip,
          });
          saveToStorage(get().user, data.room, get().username);
          break;
        }

        case 'queue:updated': {
          set({ queue: data.queue });
          break;
        }
        
        case 'room:user-joined': {
          const { room } = get();
          if (room) {
            set({
              room: { ...room, users: [...room.users, data.user] }
            });
            saveToStorage(get().user, { ...room, users: [...room.users, data.user] }, get().username);
          }
          break;
        }
        
        case 'room:user-left': {
          const { room } = get();
          if (room) {
            set({
              room: { ...room, users: room.users.filter(u => u.id !== data.userId) }
            });
            saveToStorage(get().user, { ...room, users: room.users.filter(u => u.id !== data.userId) }, get().username);
          }
          break;
        }
        
        case 'room:host-changed': {
          const { room, user } = get();
          if (room) {
            const updatedUsers = room.users.map(u => ({
              ...u,
              isHost: u.id === data.newHostId
            }));
            const newUser = user ? { ...user, isHost: user.id === data.newHostId } : null;
            set({
              room: { ...room, users: updatedUsers, hostId: data.newHostId },
              user: newUser
            });
            saveToStorage(newUser, { ...room, users: updatedUsers, hostId: data.newHostId }, get().username);
          }
          break;
        }
        
        case 'vote:updated': {
          set({
            skipVotes: data.skipVotes,
            skipThreshold: data.threshold
          });
          break;
        }
        
        case 'room:closed': {
          console.warn('[WS] Room was closed by host');
          get().leaveRoom();
          break;
        }

        case 'error': {
          console.error('[WS] Server error:', data.message);
          if (data.message === 'Room not found') {
            get().leaveRoom();
          }
          break;
        }
      }
    };
    
    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };

    ws.onclose = (event) => {
      console.log('[WS] Closed:', event.code, event.reason);
      set({ isConnected: false, ws: null });

      // NF-011: auto-reconnect unless the close was intentional (leave/logout)
      const { room, user } = get();
      if (room && user && !_intentionalClose) {
        console.log(`[WS] Reconnecting in ${_reconnectDelay}ms…`);
        setTimeout(() => {
          _reconnectDelay = Math.min(_reconnectDelay * 2, 30000);
          get().connectWebSocket();
        }, _reconnectDelay);
      } else {
        _reconnectDelay = 1000;
        _intentionalClose = false;
      }
    };

    set({ ws });
  },
  
  disconnectWebSocket: () => {
    const { ws } = get();
    _intentionalClose = true;
    if (ws) {
      try { ws.send(JSON.stringify({ event: 'room:leave', data: {} })); } catch {}
      ws.close();
    }
    set({ ws: null, isConnected: false });
  },
  
  addToQueue: (track) => {
    const { ws, user } = get();
    if (!ws || !user) {
      console.error('[addToQueue] No WebSocket or user');
      return;
    }
    if (ws.readyState !== WebSocket.OPEN) {
      console.error('[addToQueue] WebSocket not open, readyState:', ws.readyState);
      return;
    }

    ws.send(JSON.stringify({
      event: 'queue:add',
      data: { track: { ...track, addedBy: user.id, addedByName: user.username } }
    }));
  },
  
  removeFromQueue: (trackId) => {
    const { ws } = get();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ event: 'queue:remove', data: { trackId } }));
  },

  clearQueue: () => {
    const { ws } = get();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ event: 'queue:clear', data: {} }));
  },

  transferHost: (targetUserId) => {
    const { ws } = get();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ event: 'host:transfer', data: { targetUserId } }));
  },

  controlPlayback: (action) => {
    const { ws } = get();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ event: 'playback:control', data: { action } }));
  },

  voteSkip: () => {
    const { ws, hasVotedSkip } = get();
    if (!ws || hasVotedSkip || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ event: 'playback:control', data: { action: 'skip' } }));
    set({ hasVotedSkip: true });
  },
  
  searchYouTube: async (query) => {
    if (!query.trim()) return;
    
    set({ isSearching: true });
    
    try {
      const response = await fetch(`${API_BASE}/api/search/youtube`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        set({ searchResults: data.tracks, searchError: null });
      } else {
        console.error('Search error:', data.error);
        set({ searchError: data.error || 'Search failed' });
      }
    } catch (error) {
      console.error('Search failed:', error);
      set({ searchError: 'Connection failed' });
    } finally {
      set({ isSearching: false });
    }
  },
  
  clearSearch: () => set({ searchResults: [], searchError: null }),
  
  clearRoomError: () => set({ roomError: null })
}));