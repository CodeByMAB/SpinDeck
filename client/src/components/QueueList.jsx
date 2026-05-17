import { useStore } from '../stores/useStore';

export default function QueueList({ queue, isHost, currentTrackId }) {
  const removeFromQueue = useStore(state => state.removeFromQueue);

  if (queue.length === 0) {
    return (
      <div className="surface text-center py-10 px-4">
        <div className="font-mono text-[10px] text-tx-lo tracking-[0.25em] mb-2">
          ▸ NO TRACKS QUEUED
        </div>
        <p className="text-tx-md text-sm">The deck is hungry.</p>
        <p className="text-tx-lo text-xs mt-1">
          Hit "Request a Track" to feed the floor.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {queue.map((track, index) => {
        const isCurrent = track.id === currentTrackId;
        return (
          <div
            key={track.id}
            className={
              'flex items-center gap-3 p-2.5 rounded-2xl transition-colors ' +
              (isCurrent
                ? 'bg-primary/10 border'
                : 'bg-ink-200/40 border border-line/60 hover:bg-primary/5')
            }
            style={isCurrent ? { borderColor: 'rgba(168,85,247,0.5)', boxShadow: '0 0 24px rgba(168,85,247,0.15)' } : undefined}
          >
            {/* Slot */}
            <span className="font-mono text-[11px] font-bold text-tx-lo w-6 text-center flex-shrink-0">
              {isCurrent ? '▸' : String(index + 1).padStart(2, '0')}
            </span>

            {/* Thumb */}
            <div
              className="w-11 h-11 rounded-lg flex-shrink-0 overflow-hidden border border-line relative"
              style={{ background: 'linear-gradient(135deg, #1E1138, #160B2A)' }}
            >
              {track.thumbnail ? (
                <img
                  src={track.thumbnail}
                  alt=""
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              ) : (
                <div
                  className="art-placeholder w-full h-full"
                  data-label={(track.title || 'TRACK').slice(0, 7)}
                />
              )}
              {isCurrent && (
                <div className="absolute inset-0 flex items-center justify-center bg-ink-0/40">
                  <span className="eq"><i /><i /><i /><i /></span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div
                className={
                  'font-display font-semibold text-sm truncate ' +
                  (isCurrent ? 'text-cyan' : 'text-tx-hi')
                }
              >
                {track.title}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-xs text-tx-lo truncate">{track.artist}</span>
                {track.duration && (
                  <>
                    <span className="text-tx-mute">·</span>
                    <span className="font-mono text-[11px] text-tx-lo flex-shrink-0">
                      {fmtDuration(track.duration)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Requester chip */}
            {track.addedByName && (
              <div className="chip purple flex-shrink-0">
                {String(track.addedByName).slice(0, 12).toUpperCase()}
              </div>
            )}

            {/* Remove (host only, not the playing track) */}
            {isHost && !isCurrent && (
              <button
                onClick={() => removeFromQueue(track.id)}
                aria-label="Remove track"
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-tx-lo hover:text-magenta hover:bg-magenta/10 transition-colors"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function fmtDuration(d) {
  if (typeof d === 'string') return d;
  if (!d || !isFinite(d)) return '';
  const m = Math.floor(d / 60);
  const s = Math.floor(d % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
