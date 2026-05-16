import { useStore } from '../stores/useStore';

export default function UserList({ onClose }) {
  const room = useStore(state => state.room);
  const user = useStore(state => state.user);

  const users = room?.users || [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="font-mono text-[10px] text-tx-lo tracking-[0.25em]">
            ▸ ON THE FLOOR
          </div>
          <h2 className="font-display font-bold text-lg mt-0.5">In the Room</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-tx-md hover:text-tx-hi hover:bg-ink-200/60 transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {users.length === 0 ? (
        <p className="text-tx-md text-center py-6">No-one's on the floor yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {users.map((u) => {
            const isYou = u.id === user?.id;
            const tag = (u.username || '?').charAt(0).toUpperCase();
            return (
              <div
                key={u.id}
                className={
                  'flex items-center gap-3 p-3 rounded-2xl border ' +
                  (isYou
                    ? 'bg-primary/10'
                    : 'bg-ink-200/40')
                }
                style={{
                  borderColor: isYou ? 'rgba(168,85,247,0.5)' : 'rgba(58,34,102,0.6)',
                  ...(isYou
                    ? { boxShadow: '0 0 24px rgba(168,85,247,0.12)' }
                    : null),
                }}
              >
                {/* Avatar */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center font-display font-bold text-base flex-shrink-0"
                  style={{
                    background: u.isHost
                      ? 'linear-gradient(135deg, #A855F7, #00D9FF)'
                      : 'linear-gradient(135deg, #1E1138, #160B2A)',
                    color: u.isHost ? '#04101A' : '#F7F2FF',
                    border: u.isHost ? 'none' : '1px solid #3A2266',
                  }}
                >
                  {tag}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold text-sm truncate">
                    {u.username}
                    {isYou && (
                      <span className="text-tx-lo text-xs ml-1.5 font-normal">(you)</span>
                    )}
                  </div>
                  <div className="font-mono text-[10px] tracking-[0.15em] mt-0.5"
                       style={{ color: u.isHost ? '#FF2D8E' : '#6B5A8E' }}>
                    {u.isHost ? 'HOST · ON THE DECK' : 'ON THE FLOOR'}
                  </div>
                </div>

                {/* Role chip */}
                {u.isHost && <div className="chip magenta">HOST</div>}
              </div>
            );
          })}
        </div>
      )}

      {/* Room meta */}
      <div className="mt-6 pt-4 border-t border-line/60">
        <Row label="ROOM PIN">
          <span
            className="font-mono text-base font-extrabold text-cyan tracking-[0.1em]"
            style={{ textShadow: '0 0 8px rgba(0,217,255,0.6)' }}
          >
            {room?.pin}
          </span>
        </Row>
        <Row label="MAX FLOOR">
          <span className="font-mono text-sm text-tx-hi">{room?.settings?.maxUsers || 5}</span>
        </Row>
        <Row label="LIVE">
          <span className="chip live">ON AIR</span>
        </Row>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="font-mono text-[10px] text-tx-lo tracking-[0.25em]">{label}</span>
      {children}
    </div>
  );
}
