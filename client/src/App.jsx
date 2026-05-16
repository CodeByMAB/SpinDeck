import { useState, useEffect } from 'react';
import { useStore } from './stores/useStore';
import HomeScreen from './components/HomeScreen';
import CreateRoomScreen from './components/CreateRoomScreen';
import JoinRoomScreen from './components/JoinRoomScreen';
import RoomScreen from './components/RoomScreen';

function App() {
  const room = useStore(state => state.room);
  const user = useStore(state => state.user);
  const isConnected = useStore(state => state.isConnected);
  const connectWebSocket = useStore(state => state.connectWebSocket);
  const leaveRoom = useStore(state => state.leaveRoom);
  const disconnectWebSocket = useStore(state => state.disconnectWebSocket);
  const [view, setView] = useState('home');
  const [forceHome, setForceHome] = useState(false);
  
  // Auto-reconnect WebSocket if room exists but not connected
  useEffect(() => {
    if (room && user && !isConnected) {
      console.log('[App] Restoring room connection...');
      connectWebSocket();
    }
  }, [room, user, isConnected]);
  
  // Keyboard shortcut: Escape to return home (recovery)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        console.log('[App] Escape pressed, forcing home...');
        setForceHome(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Recovery: force leave room and return to home
  const handleRecovery = () => {
    console.log('[App] Recovery: leaving room and going home');
    disconnectWebSocket();
    leaveRoom();
    setForceHome(false);
    setView('home');
  };
  
  // Defensive: if room exists but is invalid, treat as no room
  const hasValidRoom = room && typeof room === 'object' && room.id;
  
  // Show recovery screen if forced or room is invalid
  if (forceHome || !hasValidRoom) {
    if (forceHome) {
      return (
        <div className="min-h-screen bg-[#050309] flex flex-col items-center justify-center p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Connection Issue</h1>
            <p className="text-gray-400 mb-6">Having trouble with the room.</p>
            <button
              onClick={handleRecovery}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold"
            >
              Return to Home
            </button>
          </div>
        </div>
      );
    }
  }
  
  // Route based on state
  if (hasValidRoom) {
    return <RoomScreen />;
  }
  
  // Clear invalid room state
  if (room) {
    console.warn('[App] Invalid room state detected, clearing...');
  }
  
  switch (view) {
    case 'create':
      return <CreateRoomScreen onBack={() => setView('home')} />;
    case 'join':
      return <JoinRoomScreen onBack={() => setView('home')} />;
    default:
      return <HomeScreen onCreate={() => setView('create')} onJoin={() => setView('join')} />;
  }
}

export default App;