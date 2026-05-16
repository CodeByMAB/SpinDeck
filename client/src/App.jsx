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
  const [view, setView] = useState('home');
  
  // Auto-reconnect WebSocket if room exists but not connected
  useEffect(() => {
    if (room && user && !isConnected) {
      console.log('[App] Restoring room connection...');
      connectWebSocket();
    }
  }, [room, user, isConnected]);
  
  // Route based on state
  if (room) {
    return <RoomScreen />;
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