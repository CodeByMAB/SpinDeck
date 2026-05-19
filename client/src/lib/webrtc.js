/**
 * WebRTC Audio Streaming
 * 
 * For streaming uploaded/royalty-free audio from host to guests.
 * Uses Supabase as the signaling channel.
 * 
 * Note: Spotify/Apple Music audio cannot be captured due to DRM.
 * Guests see metadata but can't hear those sources.
 */

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

// Host side: broadcast audio to all guests
export async function startAudioBroadcast(audioEl, roomId, supabaseClient) {
  try {
    const stream = audioEl.captureStream?.() ?? audioEl.mozCaptureStream?.();
    if (!stream) {
      throw new Error('Audio capture not supported in this browser');
    }

    const peers = new Map();
    
    // Subscribe to guest signals
    const channel = supabaseClient
      .channel(`webrtc:${roomId}`)
      .on('broadcast', { event: 'signal' }, async ({ payload }) => {
        const { from, sdp, candidate } = payload;
        
        let pc = peers.get(from);
        if (!pc) {
          pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
          peers.set(from, pc);

          // Add audio track
          stream.getTracks().forEach((t) => pc.addTrack(t, stream));

          // Send ICE candidates
          pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
              channel.send({ 
                type: 'broadcast', 
                event: 'signal', 
                payload: { to: from, candidate } 
              });
            }
          };

          // Create and send offer
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          channel.send({ 
            type: 'broadcast', 
            event: 'signal', 
            payload: { to: from, sdp: offer } 
          });
        }

        if (sdp?.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        }
        if (candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        }
      })
      .subscribe();

    return {
      stop: () => {
        peers.forEach((pc) => pc.close());
        peers.clear();
        supabaseClient.removeChannel(channel);
      },
      getPeerCount: () => peers.size,
    };
  } catch (err) {
    console.error('Failed to start audio broadcast:', err);
    return { stop: () => {}, getPeerCount: () => 0 };
  }
}

// Guest side: receive audio from host
export async function joinAudioStream(roomId, guestId, supabaseClient, onStream) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
  
  let channel = null;
  let resolved = false;

  pc.ontrack = ({ streams }) => {
    if (streams[0] && !resolved) {
      onStream(streams[0]);
    }
  };

  // Handle incoming signals from host
  const handleSignal = async ({ payload }) => {
    if (payload.to && payload.to !== guestId) return;

    if (payload.sdp?.type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(payload.sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      channel.send({ 
        type: 'broadcast', 
        event: 'signal', 
        payload: { from: guestId, sdp: answer } 
      });
    }

    if (payload.candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
    }
  };

  channel = supabaseClient
    .channel(`webrtc:${roomId}`)
    .on('broadcast', { event: 'signal' }, handleSignal)
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && !resolved) {
        // Announce presence so host creates an offer
        channel.send({ 
          type: 'broadcast', 
          event: 'signal', 
          payload: { from: guestId, join: true } 
        });
        resolved = true;
      }
    });

  // Send our ICE candidates
  pc.onicecandidate = ({ candidate }) => {
    if (candidate && channel) {
      channel.send({ 
        type: 'broadcast', 
        event: 'signal', 
        payload: { from: guestId, candidate } 
      });
    }
  };

  return {
    stop: () => {
      pc.close();
      if (channel) {
        supabaseClient.removeChannel(channel);
      }
    },
  };
}

// Mute/unmute local audio (for guests)
export function setGuestMuted(audioEl, muted) {
  if (audioEl) {
    audioEl.muted = muted;
  }
}