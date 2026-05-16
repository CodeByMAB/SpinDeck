import { useEffect, useRef, useState } from 'react';
import { useStore } from '../stores/useStore';

// YouTube player reference
let ytPlayer = null;
let ytPlayerReady = false;

export default function NowPlaying({ currentTrack, isPlaying, isHost, skipVotes, skipThreshold, hasVotedSkip }) {
  const controlPlayback = useStore(state => state.controlPlayback);
  const voteSkip = useStore(state => state.voteSkip);
  const [playerReady, setPlayerReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  const containerRef = useRef(null);
  
  // Load YouTube IFrame API
  useEffect(() => {
    if (!isHost) return;
    
    console.log('[YouTube] Loading API...');
    
    // Check if API already loaded
    if (window.YT && window.YT.Player) {
      console.log('[YouTube] API already loaded');
      return;
    }
    
    // Load the IFrame Player API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    
    window.onYouTubeIframeAPIReady = () => {
      console.log('[YouTube] API Ready');
      setDebugInfo('API Ready');
    };
  }, [isHost]);
  
  // Create player when track changes (host only)
  useEffect(() => {
    if (!isHost || !currentTrack) {
      console.log('[YouTube] Skipping player creation', { isHost, hasTrack: !!currentTrack });
      return;
    }
    
    const videoId = currentTrack.videoId || currentTrack.sourceId;
    console.log('[YouTube] Creating player for:', { videoId, title: currentTrack.title, isPlaying });
    setDebugInfo(`Loading: ${currentTrack.title}`);
    
    if (!videoId) {
      console.error('[YouTube] No videoId found!');
      setDebugInfo('Error: No videoId');
      return;
    }
    
    // Wait for API to be ready
    if (!window.YT || !window.YT.Player) {
      console.log('[YouTube] Waiting for API...');
      return;
    }
    
    // Destroy existing player
    if (ytPlayer) {
      ytPlayer.destroy();
      ytPlayer = null;
      ytPlayerReady = false;
    }
    
    // Create new player
    const playerDiv = document.getElementById('yt-player');
    if (!playerDiv) {
      console.log('[YouTube] Player div not found');
      return;
    }
    
    try {
      ytPlayer = new window.YT.Player('yt-player', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          loop: 0,
          playsinline: 1
        },
        events: {
          onReady: () => {
            console.log('[YouTube] Player ready!');
            ytPlayerReady = true;
            setPlayerReady(true);
            setDebugInfo('Playing audio...');
            // Auto-play when ready (works better with autoplay=1 in playerVars)
            if (ytPlayer && isPlaying) {
              ytPlayer.playVideo();
            }
          },
          onStateChange: (event) => {
            console.log('[YouTube] State:', event.data);
            // Sync state changes back to server
            if (event.data === window.YT.PlayerState.ENDED) {
              controlPlayback('next');
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setDebugInfo('Playing');
              // Notify server we're playing
              if (!isPlaying) {
                controlPlayback('play');
              }
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setDebugInfo('Paused');
              // Notify server we're paused
              if (isPlaying) {
                controlPlayback('pause');
              }
            }
          }
        }
      });
    } catch (e) {
      console.error('[YouTube] Player creation failed:', e);
      setDebugInfo('Error: ' + e.message);
    }
    
    return () => {
      if (ytPlayer) {
        ytPlayer.destroy();
        ytPlayer = null;
        ytPlayerReady = false;
      }
    };
  }, [isHost, currentTrack?.videoId, currentTrack?.sourceId]);
  
  // Sync play/pause state
  useEffect(() => {
    if (!isHost || !ytPlayerReady || !ytPlayer) return;
    
    if (isPlaying) {
      ytPlayer.playVideo();
    } else {
      ytPlayer.pauseVideo();
    }
  }, [isPlaying, isHost]);
  
  if (!currentTrack) {
    return (
      <div className="px-4 py-8 text-center">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-800 flex items-center justify-center">
          <svg className="w-10 h-10 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        <p className="text-gray-400">No song playing</p>
        <p className="text-gray-500 text-sm mt-1">Add songs to get the party started!</p>
      </div>
    );
  }
  
  return (
    <div className="px-4 py-6 bg-gradient-to-b from-primary/10 to-transparent">
      {/* YouTube Player - hidden by default (audio-only) */}
      {isHost && currentTrack && (
        <div className="mb-4">
          <div id="yt-player" ref={containerRef} className="hidden"></div>
          {debugInfo && (
            <p className="text-xs text-gray-400 mt-1 text-center">Debug: {debugInfo}</p>
          )}
        </div>
      )}
      
      {/* Album Art / Thumbnail */}
      <div className="relative w-48 h-48 mx-auto mb-4 rounded-xl overflow-hidden shadow-lg">
        {currentTrack.thumbnail ? (
          <img 
            src={currentTrack.thumbnail} 
            alt={currentTrack.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800 flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
        
        {/* Playing indicator */}
        {isPlaying && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <div className="flex gap-1">
              <div className="w-1 h-4 bg-primary animate-pulse"></div>
              <div className="w-1 h-6 bg-primary animate-pulse delay-75"></div>
              <div className="w-1 h-3 bg-primary animate-pulse delay-150"></div>
            </div>
          </div>
        )}
        
        {/* YouTube indicator */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-red-500 text-white text-xs font-medium">
          YouTube
        </div>
      </div>
      
      {/* Track Info */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-white mb-1">{currentTrack.title}</h2>
        <p className="text-gray-400">{currentTrack.artist}</p>
      </div>
      
      {/* Playback Controls (Host only) */}
      {isHost && (
        <div className="flex items-center justify-center gap-4 mb-4">
          <button
            onClick={() => controlPlayback('pause')}
            disabled={!isPlaying}
            className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </button>
          
          <button
            onClick={() => controlPlayback('play')}
            disabled={isPlaying}
            className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          >
            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          
          <button
            onClick={() => controlPlayback('next')}
            className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
        </div>
      )}
      
      {/* Skip Vote (Guests) */}
      {!isHost && (
        <div className="flex flex-col items-center">
          <button
            onClick={voteSkip}
            disabled={hasVotedSkip}
            className={`px-6 py-2 rounded-full font-medium transition-all ${
              hasVotedSkip 
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
            }`}
          >
            {hasVotedSkip ? 'Voted' : 'Vote to Skip'}
          </button>
        </div>
      )}
      
      {/* Vote count - shown to everyone */}
      {skipVotes > 0 && (
        <p className="text-gray-400 text-sm mt-2 text-center">
          {skipVotes} / {skipThreshold} votes to skip
        </p>
      )}
    </div>
  );
}