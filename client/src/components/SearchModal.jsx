import { useState } from 'react';
import { useStore } from '../stores/useStore';

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const searchYouTube = useStore(state => state.searchYouTube);
  const searchResults = useStore(state => state.searchResults);
  const isSearching = useStore(state => state.isSearching);
  const searchError = useStore(state => state.searchError);
  const addToQueue = useStore(state => state.addToQueue);
  const clearSearch = useStore(state => state.clearSearch);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) searchYouTube(query);
  };

  const handleAddTrack = (track) => {
    addToQueue(track);
    clearSearch();
    setQuery('');
    onClose();
  };

  const handleClose = () => {
    clearSearch();
    setQuery('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(7,4,12,0.78)', backdropFilter: 'blur(8px)' }}
      onClick={handleClose}
    >
      <div
        className="surface w-full sm:max-w-md max-h-[88vh] overflow-hidden flex flex-col rounded-t-3xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-line/60">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,217,255,0.15), rgba(168,85,247,0.15))',
                border: '1px solid rgba(0,217,255,0.3)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00D9FF" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <h2 className="font-display font-bold text-lg">Request a Track</h2>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="w-8 h-8 rounded-xl flex items-center justify-center text-tx-md hover:text-tx-hi hover:bg-ink-200/60 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="px-4 py-3.5 border-b border-line/60">
          <div className="relative">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan"
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search YouTube — song, artist, vibe…"
              className="sd-input pl-10"
              autoFocus
            />
          </div>
        </form>

        {/* Results header */}
        <div className="px-5 pt-3 pb-2 font-mono text-[10px] text-tx-lo tracking-[0.25em]">
          {isSearching
            ? '▸ SCANNING…'
            : searchResults.length > 0
              ? `▸ ${searchResults.length} MATCHES · YOUTUBE`
              : query
                ? '▸ NO MATCHES'
                : '▸ AWAITING INPUT'}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-5">
          {isSearching ? (
            <div className="flex items-center justify-center py-10">
              <svg className="animate-spin text-primary" width="28" height="28" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.25" />
                <path fill="currentColor" opacity="0.85" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z" />
              </svg>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="flex flex-col gap-2">
              {searchResults.map((track, i) => (
                <button
                  key={track.sourceId || i}
                  onClick={() => handleAddTrack(track)}
                  className={
                    'surface flex items-center gap-3 p-2.5 rounded-2xl text-left transition active:scale-[0.98] ' +
                    (i === 0 ? 'border-cyan/50' : 'hover:border-primary/40')
                  }
                  style={i === 0 ? { boxShadow: '0 0 20px rgba(0,217,255,0.15)' } : undefined}
                >
                  <div
                    className="w-13 h-13 rounded-xl overflow-hidden flex-shrink-0 border border-line"
                    style={{ width: 52, height: 52 }}
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
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-display font-semibold text-sm truncate">
                      {track.title}
                    </div>
                    <div className="text-xs text-tx-lo truncate">{track.artist}</div>
                  </div>

                  <div
                    className={
                      'btn-neon flex-shrink-0 ' + (i === 0 ? 'btn-cyan' : 'btn-ghost')
                    }
                    style={{ padding: '8px 12px', fontSize: 10, borderRadius: 10 }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {i === 0 ? 'Queue' : 'Add'}
                  </div>
                </button>
              ))}
            </div>
          ) : searchError ? (
            <div className="text-center py-10">
              <p className="text-magenta text-sm font-mono tracking-wider">ERR · {searchError}</p>
              <p className="text-tx-lo text-xs mt-1">Check the server connection.</p>
            </div>
          ) : query ? (
            <div className="text-center py-10">
              <p className="text-tx-md text-sm">No matches — try another phrase.</p>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-tx-md text-sm">Search for a track to feed the deck.</p>
              <p className="text-tx-lo text-xs mt-1 font-mono tracking-widest">
                POWERED BY YOUTUBE
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
