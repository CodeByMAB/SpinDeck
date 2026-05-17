import { useEffect, useRef, useState } from 'react';
import { useStore } from '../stores/useStore';
import { VinylDisc, Waveform, EqBars } from './Brand';

// YouTube player reference (kept at module scope for stability across renders)
let ytPlayer = null;
let ytPlayerReady = false;

export default function NowPlaying({
  currentTrack,
  isPlaying,
  isHost,
  skipVotes,
  skipThreshold,
  hasVotedSkip,
}) {
  const controlPlayback = useStore(state => state.controlPlayback);
  const voteSkip = useStore(state => state.voteSkip);
  const [debugInfo, setDebugInfo] = useState('');
  const [elapsed, setElapsed] = useState(0);     // seconds played (for waveform progress)
  const [duration, setDuration] = useState(0);   // total seconds
  const containerRef = useRef(null);
  const tickRef = useRef(null);
  // Ref so onStateChange always reads the latest isPlaying without stale closure
  const isPlayingRef = useRef(isPlaying);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  // ── Load YouTube IFrame API (host only) ─────────────
  useEffect(() => {
    if (!isHost) return;
    if (window.YT && window.YT.Player) {
      console.log('[YouTube] API already loaded');
      return;
    }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = () => {
      console.log('[YouTube] API Ready');
      setDebugInfo('API Ready');
    };
  }, [isHost]);

  // ── Create / refresh player on track change ─────────
  useEffect(() => {
    if (!isHost || !currentTrack) return;

    const videoId = currentTrack.videoId || currentTrack.sourceId;
    if (!videoId) {
      setDebugInfo('Error: No videoId');
      return;
    }
    if (!window.YT || !window.YT.Player) return;

    if (ytPlayer) {
      ytPlayer.destroy();
      ytPlayer = null;
      ytPlayerReady = false;
    }

    const playerDiv = document.getElementById('yt-player');
    if (!playerDiv) return;

    try {
      ytPlayer = new window.YT.Player('yt-player', {
        videoId,
        playerVars: {
          autoplay: 1, controls: 0, disablekb: 1, fs: 0, modestbranding: 1,
          rel: 0, showinfo: 0, iv_load_policy: 3, loop: 0, playsinline: 1,
        },
        events: {
          onReady: () => {
            ytPlayerReady = true;
            setDebugInfo('Playing audio…');
            try { setDuration(ytPlayer.getDuration() || 0); } catch {}
            if (isPlayingRef.current) ytPlayer.playVideo();
          },
          onStateChange: (event) => {
            // Guard: ignore events after player has been destroyed
            if (!ytPlayer || !ytPlayerReady) return;
            if (event.data === window.YT.PlayerState.ENDED) {
              controlPlayback('next');
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setDebugInfo('Playing');
              try { setDuration(ytPlayer.getDuration() || 0); } catch {}
              if (!isPlayingRef.current) controlPlayback('play');
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setDebugInfo('Paused');
              if (isPlayingRef.current) controlPlayback('pause');
            }
          },
        },
      });
    } catch (e) {
      setDebugInfo('Error: ' + e.message);
    }

    return () => {
      if (ytPlayer) {
        ytPlayerReady = false; // mark as not ready first so onStateChange guards trigger
        ytPlayer.destroy();
        ytPlayer = null;
      }
      setElapsed(0);
      setDuration(0);
    };
  }, [isHost, currentTrack?.videoId, currentTrack?.sourceId]);

  // ── Sync play/pause ─────────────────────────────────
  useEffect(() => {
    if (!isHost || !ytPlayerReady || !ytPlayer) return;
    if (isPlaying) ytPlayer.playVideo();
    else ytPlayer.pauseVideo();
  }, [isPlaying, isHost]);

  // ── Tick: track current time for waveform progress ──
  useEffect(() => {
    clearInterval(tickRef.current);
    // Only run tick if we have a valid track and are actually playing
    if (isHost && isPlaying && currentTrack && ytPlayer) {
      tickRef.current = setInterval(() => {
        try {
          if (ytPlayer?.getCurrentTime) setElapsed(ytPlayer.getCurrentTime() || 0);
          if (ytPlayer?.getDuration)    setDuration(ytPlayer.getDuration() || 0);
        } catch {}
      }, 500);
    }
    return () => clearInterval(tickRef.current);
  }, [isHost, isPlaying, currentTrack]);

  // ── Empty state ─────────────────────────────────────
  if (!currentTrack) {
    return (
      <div className="px-6 py-10 flex flex-col items-center text-center">
        <div className="opacity-50 mb-4">
          <VinylDisc size={140} spinning={false} label="EMPTY DECK" />
        </div>
        <p className="text-tx-md">No track loaded.</p>
        <p className="text-tx-lo text-sm mt-1">
          {isHost ? 'Drop the needle — add a song below.' : 'Ask someone to spin a track.'}
        </p>
      </div>
    );
  }

  const trackDuration = duration || currentTrack.duration || 0;
  const progress = trackDuration > 0 ? Math.min(elapsed / trackDuration, 1) : 0;

  // Compact-card view for both host AND guest. Host gets transport controls.
  return (
    <div className="px-4 pt-2">
      {/* Hidden YouTube player (audio-only) */}
      {isHost && (
        <div className="mb-3">
          <div id="yt-player" ref={containerRef} className="hidden" />
          {debugInfo && (
            <p className="font-mono text-[9px] text-tx-mute tracking-widest text-center">
              ▸ {debugInfo}
            </p>
          )}
        </div>
      )}

      <div className="surface surface-glow relative overflow-hidden p-4">
        {/* Deck header */}
        <div className="flex justify-between items-center mb-3">
          <div className="font-mono text-[10px] text-cyan tracking-[0.3em]">
            ▸ DECK A — NOW SPINNING
          </div>
          <EqBars />
        </div>

        {isHost ? (
          /* HOST VIEW — Large vinyl + transport */
          <HostDeck
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            progress={progress}
            elapsed={elapsed}
            trackDuration={trackDuration}
            controlPlayback={controlPlayback}
          />
        ) : (
          /* GUEST VIEW — Compact deck + skip vote */
          <GuestDeck
            currentTrack={currentTrack}
            isPlaying={isPlaying}
            progress={progress}
            elapsed={elapsed}
            trackDuration={trackDuration}
            voteSkip={voteSkip}
            hasVotedSkip={hasVotedSkip}
            skipVotes={skipVotes}
            skipThreshold={skipThreshold}
          />
        )}

        {/* Corner LEDs */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan" style={{ boxShadow: '0 0 8px #00D9FF' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-primary" style={{ boxShadow: '0 0 8px #A855F7' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-magenta" style={{ boxShadow: '0 0 8px #FF2D8E' }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Host: full deck with vinyl + transport ─────────── */
function HostDeck({ currentTrack, isPlaying, progress, elapsed, trackDuration, controlPlayback }) {
  return (
    <>
      <div className="relative flex justify-center mb-3.5">
        <VinylDisc
          size={196}
          spinning={isPlaying}
          art={currentTrack.thumbnail}
          label={(currentTrack.title || '').slice(0, 12)}
        />
        {/* (Optional) BPM badge — left as static decoration */}
        <div
          className="absolute top-2 right-2 px-2 py-1.5 rounded-xl text-center"
          style={{ background: 'rgba(13,8,32,0.85)', border: '1px solid #3A2266' }}
        >
          <div
            className="font-mono text-base font-extrabold text-cyan"
            style={{ textShadow: '0 0 6px rgba(0,217,255,0.5)' }}
          >
            {isPlaying ? '▸' : '⏸'}
          </div>
          <div className="font-mono text-[8px] text-tx-lo tracking-[0.15em]">DECK</div>
        </div>
      </div>

      <div className="text-center mb-3">
        <div className="font-display font-bold text-[22px] leading-tight tracking-tight">
          {currentTrack.title}
        </div>
        <div className="text-tx-md text-[13px] mt-0.5">{currentTrack.artist}</div>
      </div>

      <div className="wave-bg mb-2.5">
        <Waveform progress={progress} bars={62} />
        <div className="flex justify-between mt-1.5">
          <span className="font-mono text-[10px] text-cyan">{fmtTime(elapsed)}</span>
          <span className="font-mono text-[10px] text-tx-lo">{fmtTime(trackDuration)}</span>
        </div>
      </div>

      <div className="flex justify-center items-center gap-4 mt-2">
        <button
          onClick={() => controlPlayback(isPlaying ? 'pause' : 'play')}
          className="btn-neon btn-primary btn-circle lg"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
            </svg>
          ) : (
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: 2 }}>
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
        <button
          onClick={() => controlPlayback('next')}
          className="btn-neon btn-ghost btn-circle"
          style={{ width: 48, height: 48 }}
          aria-label="Skip to next"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6h2v12h-2z" />
          </svg>
        </button>
      </div>
    </>
  );
}

/* ─── Guest: compact deck + skip vote meter ──────────── */
function GuestDeck({ currentTrack, isPlaying, progress, elapsed, trackDuration, voteSkip, hasVotedSkip, skipVotes, skipThreshold }) {
  const pct = skipThreshold > 0 ? Math.min((skipVotes / skipThreshold) * 100, 100) : 0;

  return (
    <>
      <div className="flex gap-3 items-center mb-3">
        <VinylDisc
          size={92}
          spinning={isPlaying}
          art={currentTrack.thumbnail}
          label={(currentTrack.title || '').slice(0, 8)}
        />
        <div className="flex-1 min-w-0">
          <div className="font-display font-bold text-[17px] leading-tight truncate">
            {currentTrack.title}
          </div>
          <div className="text-tx-md text-xs truncate mb-2">{currentTrack.artist}</div>
          <Waveform progress={progress} bars={32} />
          <div className="flex justify-between mt-1">
            <span className="font-mono text-[9px] text-cyan">{fmtTime(elapsed)}</span>
            <span className="font-mono text-[9px] text-tx-lo">{fmtTime(trackDuration)}</span>
          </div>
        </div>
      </div>

      {/* Skip vote meter */}
      <div
        className="flex items-center gap-3 p-3 rounded-2xl"
        style={{ background: 'rgba(13,8,32,0.5)', border: '1px solid #3A2266' }}
      >
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl text-magenta"
          style={{
            background: 'rgba(255,45,142,0.1)',
            border: '1px solid rgba(255,45,142,0.3)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 19l9-7-9-7v14zM2 19l9-7-9-7v14z" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-[13px] font-semibold">
            {hasVotedSkip ? 'Vote registered' : 'Vote to skip'}
          </div>
          <div className="font-mono text-[10px] text-tx-lo tracking-[0.15em] mt-0.5">
            {skipVotes} / {skipThreshold} · MAJORITY RULES
          </div>
          <div className="h-1 rounded mt-1.5 overflow-hidden" style={{ background: 'rgba(58,34,102,0.5)' }}>
            <div
              className="h-full"
              style={{
                width: `${pct}%`,
                background: 'linear-gradient(90deg, #FF2D8E, #C026D3)',
                boxShadow: '0 0 8px #FF2D8E',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
        <button
          onClick={voteSkip}
          disabled={hasVotedSkip}
          className={'btn-neon ' + (hasVotedSkip ? 'btn-ghost' : 'btn-magenta')}
          style={{ padding: '10px 14px', fontSize: 11 }}
        >
          {hasVotedSkip ? 'Voted' : 'Skip'}
        </button>
      </div>
    </>
  );
}

function fmtTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
