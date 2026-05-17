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
  const [forceHome, setForceHome] = useState(false);

  // Read ?pin= from URL for QR-code deep-link joining
  const [initialPin] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('pin') || '';
  });

  // Only skip HomeScreen for QR deeplink if the user already has a saved username.
  // Without a username they need to enter their DJ tag first.
  const [view, setView] = useState(() => {
    if (!initialPin) return 'home';
    const savedUsername = localStorage.getItem('sj_username') || '';
    return savedUsername.trim() ? 'join' : 'home';
  });

  // CreateRoomScreen calls this when the PIN animation finishes — only then do
  // we switch to RoomScreen so the user actually sees the slot machine spin.
  const [pinAnimDone, setPinAnimDone] = useState(false);

  // Reset the flag each time the user enters the create flow
  const goCreate = () => {
    setPinAnimDone(false);
    setView('create');
  };

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

  const handleRecovery = () => {
    console.log('[App] Recovery: leaving room and going home');
    disconnectWebSocket();
    leaveRoom();
    setForceHome(false);
    setView('home');
  };

  const hasValidRoom = room && typeof room === 'object' && room.id;

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

  // For the 'create' view: hold on CreateRoomScreen until the PIN animation
  // finishes (pinAnimDone). For all other views, route immediately on valid room.
  if (hasValidRoom && (view !== 'create' || pinAnimDone)) {
    return <RoomScreen />;
  }

  if (room) {
    console.warn('[App] Invalid room state detected, clearing...');
  }

  switch (view) {
    case 'create':
      return (
        <CreateRoomScreen
          onBack={() => setView('home')}
          onAnimDone={() => setPinAnimDone(true)}
        />
      );
    case 'join':
      return <JoinRoomScreen onBack={() => setView('home')} initialPin={initialPin} />;
    default:
      return <HomeScreen onCreate={goCreate} onJoin={() => setView('join')} />;
  }
}

export default App;
