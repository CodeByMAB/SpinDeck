import { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';

export default function JoinRoomScreen({ onBack }) {
  const [pin, setPin] = useState('');
  const joinRoom = useStore(state => state.joinRoom);
  const connectWebSocket = useStore(state => state.connectWebSocket);
  const room = useStore(state => state.room);
  const isLoading = useStore(state => state.isLoading);
  const roomError = useStore(state => state.roomError);
  const isConnected = useStore(state => state.isConnected);
  
  // Connect WebSocket when entering room
  useEffect(() => {
    if (room && !isConnected) {
      console.log('[JoinRoomScreen] Room joined, connecting WebSocket...');
      connectWebSocket();
    }
  }, [room, isConnected]);
  
  const handleJoin = async () => {
    await joinRoom(pin);
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoin();
    }
  };
  
  if (room) {
    return null; // App will redirect to RoomScreen
  }
  
  return (
    <div className="min-h-screen flex flex-col p-6 bg-darker">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-semibold text-white ml-2">Join Room</h1>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-6 text-center">
          Enter the 4-digit PIN<br/>from the host to join
        </p>
        
        {roomError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
            {roomError}
          </div>
        )}
        
        {/* PIN Input */}
        <div className="mb-6">
          <input
            type="text"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            onKeyPress={handleKeyPress}
            placeholder="0000"
            className="w-32 text-center text-4xl font-bold tracking-[0.5em] py-3 rounded-xl bg-dark border border-gray-700 text-white placeholder-gray-600 focus:outline-none focus:border-primary transition-colors"
            maxLength={4}
            inputMode="numeric"
            autoFocus
          />
        </div>
        
        <button
          onClick={handleJoin}
          disabled={isLoading || pin.length !== 4}
          className="w-full max-w-sm py-4 px-6 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-all"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Joining...
            </span>
          ) : (
            'Join Room'
          )}
        </button>
      </div>
    </div>
  );
}