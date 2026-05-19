/**
 * Spotify Web Playback SDK Integration
 * 
 * Requires:
 * - VITE_SPOTIFY_CLIENT_ID in .env
 * - Callback route at /callback
 */

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = 'streaming user-read-playback-state user-modify-playback-state user-read-email';

// PKCE helpers
async function generatePKCE() {
  const verifier = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  return { verifier, challenge };
}

export async function redirectToSpotifyAuth() {
  const { verifier, challenge } = await generatePKCE();
  sessionStorage.setItem('spotify_verifier', verifier);
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: REDIRECT_URI,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: SCOPES,
  });
  window.location.href = `https://accounts.spotify.com/authorize?${params}`;
}

export async function exchangeCodeForToken(code) {
  const verifier = sessionStorage.getItem('spotify_verifier');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }),
  });
  const data = await res.json();
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh', data.refresh_token);
    localStorage.setItem('spotify_expires', String(Date.now() + data.expires_in * 1000));
  }
  return data.access_token;
}

export async function refreshSpotifyToken() {
  const refresh = localStorage.getItem('spotify_refresh');
  if (!refresh) return null;
  
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refresh,
    }),
  });
  const data = await res.json();
  if (data.refresh_token) {
    localStorage.setItem('spotify_refresh', data.refresh_token);
    localStorage.setItem('spotify_expires', String(Date.now() + data.expires_in * 1000));
  }
  return data.access_token;
}

export function getSpotifyToken() {
  const expires = localStorage.getItem('spotify_expires');
  if (expires && Date.now() > parseInt(expires)) {
    return refreshSpotifyToken();
  }
  return localStorage.getItem('spotify_access');
}

// Player instance
let player = null;

export function initSpotifyPlayer(token, onStateChange) {
  return new Promise((resolve, reject) => {
    window.onSpotifyWebPlaybackSDKReady = () => {
      player = new Spotify.Player({
        name: 'Social Jukebox',
        getOAuthToken: (cb) => cb(token),
        volume: 0.8,
      });

      player.addListener('player_state_changed', onStateChange);
      player.addListener('ready', ({ device_id }) => resolve(device_id));
      player.addListener('not_ready', () => console.warn('Spotify player offline'));
      player.addListener('initialization_error', ({ message }) => reject(message));
      player.addListener('authentication_error', ({ message }) => reject(message));

      player.connect();
    };

    if (!document.querySelector('script[src*="spotify-player"]')) {
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      document.body.appendChild(script);
    }
  });
}

export function getPlayer() {
  return player;
}

export async function transferPlayback(deviceId, token, play = true) {
  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: { 
      Authorization: `Bearer ${token}`, 
      'Content-Type': 'application/json' 
    },
    body: JSON.stringify({ device_ids: [deviceId], play }),
  });
}