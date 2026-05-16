import { useStore } from '../stores/useStore';
import { Wordmark, VinylDisc } from './Brand';

export default function HomeScreen({ onCreate, onJoin }) {
  const username = useStore(state => state.username);
  const setUsername = useStore(state => state.setUsername);

  const canProceed = !!username.trim();

  return (
    <div className="sd-bg min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-2">
        <Wordmark size={28} />
        <div className="chip purple">v1.0 · PWA</div>
      </div>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-9">
          <VinylDisc size={220} spinning label="DROP THE NEEDLE" />
          <div className="beat-ring absolute -inset-2.5 pointer-events-none" />
        </div>

        <h1 className="font-display font-bold text-center leading-none text-[36px] tracking-tight mb-2.5">
          The floor<br />
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                'linear-gradient(90deg, #00D9FF, #A855F7, #FF2D8E)',
            }}
          >
            writes the set.
          </span>
        </h1>
        <p className="text-tx-md text-sm text-center max-w-[280px] leading-snug">
          A shared queue for any room.<br />
          Host spins. Crowd requests.
        </p>
      </div>

      {/* DJ tag input */}
      <div className="px-5">
        <div className="font-mono text-[10px] text-tx-lo tracking-[0.2em] mb-1.5">
          YOUR DJ TAG
        </div>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="What should we call you?"
          maxLength={20}
          className="sd-input"
        />
      </div>

      {/* CTAs */}
      <div className="px-5 pt-4 pb-8 flex flex-col gap-3">
        <button
          onClick={onCreate}
          disabled={!canProceed}
          className="btn-neon btn-primary w-full"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />
          </svg>
          Spin Up a Room
        </button>

        <button
          onClick={onJoin}
          disabled={!canProceed}
          className="btn-neon btn-ghost w-full"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          </svg>
          Join with PIN
        </button>

        <div className="font-mono text-[10px] text-tx-mute text-center tracking-[0.2em] mt-1">
          NO ACCOUNT · NO COST · NO ADS
        </div>
      </div>
    </div>
  );
}
