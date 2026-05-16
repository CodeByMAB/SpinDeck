import { useEffect } from 'react';
import { useStore } from '../stores/useStore';

export default function CreateRoomScreen({ onBack }) {
  const createRoom = useStore(state => state.createRoom);
  const connectWebSocket = useStore(state => state.connectWebSocket);
  const room = useStore(state => state.room);
  const isLoading = useStore(state => state.isLoading);
  const roomError = useStore(state => state.roomError);
  
  useEffect(() => {
    if (room) {
      connectWebSocket();
    }
  }, [room]);
  
  const handleCreate = async () => {
    const success = await createRoom();
    if (success) {
      // Connect WebSocket after room is created
      setTimeout(() => connectWebSocket(), 100);
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
        <h1 className="text-xl font-semibold text-white ml-2">Create Room</h1>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-gray-400 mb-6 text-center">
          Ready to start the party?<br/>Create a room and share the PIN with your friends.
        </p>
        
        {roomError && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-red-300 text-sm">
            {roomError}
          </div>
        )}
        
        <button
          onClick={handleCreate}
          disabled={isLoading}
          className="w-full max-w-sm py-4 px-6 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-gray-700 text-white font-semibold transition-all"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creating...
            </span>
          ) : (
            'Create Room'
          )}
        </button>
      </div>
    </div>
  );
}