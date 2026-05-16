import { useState, useEffect } from 'react';
import { useStore } from '../stores/useStore';
import SearchModal from './SearchModal';
import QueueList from './QueueList';
import NowPlaying from './NowPlaying';
import UserList from './UserList';

export default function RoomScreen() {
  const room = useStore(state => state.room);
  const user = useStore(state => state.user);
  const queue = useStore(state => state.queue);
  const currentTrack = useStore(state => state.currentTrack);
  const isPlaying = useStore(state => state.isPlaying);
  const skipVotes = useStore(state => state.skipVotes);
  const skipThreshold = useStore(state => state.skipThreshold);
  const hasVotedSkip = useStore(state => state.hasVotedSkip);
  const leaveRoom = useStore(state => state.leaveRoom);
  const disconnectWebSocket = useStore(state => state.disconnectWebSocket);
  const connectWebSocket = useStore(state => state.connectWebSocket);
  const isConnected = useStore(state => state.isConnected);
  
  const [showSearch, setShowSearch] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  
  // Connect WebSocket when entering room
  useEffect(() => {
    console.log('[RoomScreen] Mounted, isConnected:', isConnected);
    if (!isConnected) {
      console.log('[RoomScreen] Calling connectWebSocket...');
      connectWebSocket();
    }
  }, []);
  
  const isHost = user?.isHost;
  
  const handleLeave = () => {
    disconnectWebSocket();
    leaveRoom();
  };
  
  return (
    <div className="min-h-screen bg-darker flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-dark/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <span className="text-primary font-bold text-lg">{room?.pin}</span>
          </div>
          <div>
            <h1 className="text-white font-semibold text-sm">Room PIN</h1>
            <p className="text-gray-400 text-xs">Share with friends</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUsers(true)}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </button>
          
          <button
            onClick={handleLeave}
            className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
          >
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Now Playing */}
        <NowPlaying
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          isHost={isHost}
          skipVotes={skipVotes}
          skipThreshold={skipThreshold}
          hasVotedSkip={hasVotedSkip}
        />
        
        {/* Queue */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Queue</h2>
            <span className="text-gray-400 text-sm">{queue.length} songs</span>
          </div>
          
          <QueueList queue={queue} isHost={isHost} currentTrackId={currentTrack?.id} />
        </div>
      </div>
      
      {/* Add Song Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-darker via-darker/95 to-transparent">
        <button
          onClick={() => setShowSearch(true)}
          className="w-full py-4 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Song
        </button>
      </div>
      
      {/* Modals */}
      {showSearch && (
        <SearchModal onClose={() => setShowSearch(false)} />
      )}
      
      {showUsers && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setShowUsers(false)}>
          <div className="bg-dark rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[60vh] overflow-y-auto p-4" onClick={e => e.stopPropagation()}>
            <UserList onClose={() => setShowUsers(false)} />
          </div>
        </div>
      )}
    </div>
  );
}