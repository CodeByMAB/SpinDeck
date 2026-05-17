import { useState } from 'react';
import { useStore } from '../stores/useStore';
import SearchModal from './SearchModal';
import QueueList from './QueueList';
import NowPlaying from './NowPlaying';
import UserList from './UserList';
import { EqBars } from './Brand';

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

  const [showSearch, setShowSearch] = useState(false);
  const [showUsers, setShowUsers] = useState(false);

  const isHost = user?.isHost;
  const listeners = room?.users?.length || 0;

  const handleLeave = () => {
    disconnectWebSocket();
    leaveRoom();
  };

  return (
    <div className="sd-bg min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-ink-0/70 border-b border-line/60">
        <div className="flex items-center justify-between px-4 pt-10 pb-3">
          {/* PIN cluster */}
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border"
              style={{
                background: 'rgba(0,217,255,0.08)',
                borderColor: 'rgba(0,217,255,0.3)',
              }}
            >
              <span className="font-mono text-[10px] text-cyan tracking-[0.15em] font-bold">PIN</span>
              <span
                className="font-mono text-lg font-extrabold tracking-[0.1em] text-white"
                style={{ textShadow: '0 0 8px rgba(0,217,255,0.6)' }}
              >
                {room?.pin}
              </span>
            </div>
            <div className="chip live">LIVE</div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUsers(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-ink-200/60 border border-line"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B7A5D9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
              <span className="font-mono text-xs font-bold">{listeners}</span>
            </button>

            <button
              onClick={handleLeave}
              aria-label="Leave room"
              className="flex items-center justify-center w-8 h-8 rounded-full"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#FCA5A5',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
            </button>
          </div>
        </div>
      </header>

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
      <div className="px-4 mt-4 pb-28">
        <div className="flex items-end justify-between mb-3">
          <div>
            <div className="font-display font-bold text-xl">Up Next</div>
            <div className="font-mono text-[10px] text-tx-lo tracking-[0.2em] mt-0.5">
              {queue.length} TRACK{queue.length === 1 ? '' : 'S'}
            </div>
          </div>
          {!isHost && <div className="chip purple">YOU'RE ON THE FLOOR</div>}
          {isHost && <EqBars />}
        </div>

        <QueueList queue={queue} isHost={isHost} currentTrackId={currentTrack?.id} />
      </div>

      {/* Floating "Request a Track" */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent, rgba(7,4,12,0.85) 40%, #07040C 100%)',
        }}
      >
        <button
          onClick={() => setShowSearch(true)}
          className="btn-neon btn-primary w-full pointer-events-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
          {isHost ? 'Add a Track' : 'Request a Track'}
        </button>
      </div>

      {/* Modals */}
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      {showUsers && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          style={{ background: 'rgba(7,4,12,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={() => setShowUsers(false)}
        >
          <div
            className="surface w-full sm:max-w-md max-h-[70vh] overflow-y-auto p-5 rounded-t-3xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <UserList onClose={() => setShowUsers(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
