const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // service key — bypasses RLS
);

const DEBOUNCE_MS = 2000;
const _timers = new Map();

function _cancelTimer(roomId) {
  const t = _timers.get(roomId);
  if (t) { clearTimeout(t); _timers.delete(roomId); }
}

async function _upsert(roomId, state) {
  const { error } = await supabase.from('rooms').upsert({
    id: roomId,
    host_id: state.hostId,
    queue: state.queue ?? [],
    current_track: state.currentTrack ?? null,
    settings: state.settings ?? {},
    updated_at: new Date().toISOString(),
  });
  if (error) console.error('[persistence] upsert failed:', error.message);
}

function onRoomCreated(roomId, state) {
  return _upsert(roomId, state);
}

// Flushes any pending debounce before writing — ensures nothing is lost on disconnect
function onHostDisconnect(roomId, state) {
  _cancelTimer(roomId);
  return _upsert(roomId, state);
}

function onQueueChange(roomId, state) {
  _cancelTimer(roomId);
  _timers.set(roomId, setTimeout(() => {
    _upsert(roomId, state);
    _timers.delete(roomId);
  }, DEBOUNCE_MS));
}

async function onRoomClosed(roomId) {
  _cancelTimer(roomId);
  const { error } = await supabase
    .from('rooms')
    .update({ closed_at: new Date().toISOString() })
    .eq('id', roomId);
  if (error) console.error('[persistence] close failed:', error.message);
}

// Use on server restart to restore in-progress rooms
async function loadRoom(roomId) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .is('closed_at', null)
    .single();
  return error ? null : data;
}

module.exports = { onRoomCreated, onHostDisconnect, onQueueChange, onRoomClosed, loadRoom };