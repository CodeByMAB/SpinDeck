# SpinDeck — DJ-deck redesign drop-in

These files port the design from `SpinDeck Redesign.html` into your actual repo
(`client/` of `github.com/CodeByMAB/spindeck`). All store hooks, WebSocket
plumbing, and prop signatures are preserved — only the JSX + styles change.

## Files in this folder

```
repo/client/
├── index.html                    # adds Google Fonts (Space Grotesk + JetBrains Mono + Inter)
├── tailwind.config.js            # new neon palette + brand fonts + animations
└── src/
    ├── index.css                 # SpinDeck custom layer (vinyl, PIN cells, neon buttons, waveform…)
    └── components/
        ├── Brand.jsx             # NEW — Wordmark, VinylDisc, Waveform, PinDisplay, EqBars
        ├── HomeScreen.jsx
        ├── CreateRoomScreen.jsx
        ├── JoinRoomScreen.jsx    # now with numpad PIN entry
        ├── RoomScreen.jsx
        ├── NowPlaying.jsx        # split into HostDeck (vinyl + transport) + GuestDeck (skip meter)
        ├── QueueList.jsx
        ├── SearchModal.jsx
        └── UserList.jsx
```

## To apply

```bash
# from your repo root
cp -r /path/to/repo/client/* ./client/
```

No new dependencies. Tailwind already in your stack picks up the new tokens
from `tailwind.config.js`.

The Google Fonts link in `index.html` loads three families:
- **Space Grotesk** — display headings
- **JetBrains Mono** — PIN cells, BPM, timecodes
- **Inter** — body

## What changed structurally

- `App.jsx`, `stores/useStore.js` — **unchanged**, no edits needed.
- `Brand.jsx` is new. All screens import shared primitives from it.
- `NowPlaying.jsx` is now ~split: `<HostDeck>` (large vinyl + transport + waveform) and `<GuestDeck>` (compact deck + animated skip-vote meter). The hidden YouTube IFrame still drives audio — added a 500ms tick to update `elapsed` so the waveform fills in real time.
- `JoinRoomScreen.jsx` ditches the text input for a proper numpad — keeps the same `joinRoom(pin)` call.

## Notes / next steps

- The vinyl rotates while `isPlaying`. Album art (`track.thumbnail`) drops into the center label cleanly; if it's missing you get a striped placeholder with the track name in monospace.
- `track.addedBy` shows as a chip on each queue row — if your server doesn't emit that, the chip simply doesn't render. Add the field server-side to light it up.
- BPM badge in the host deck is currently a static play/pause indicator. Wire it to a real BPM source if/when you add audio analysis.
- The "Share Link" button uses `navigator.share` with `navigator.clipboard` as fallback.
