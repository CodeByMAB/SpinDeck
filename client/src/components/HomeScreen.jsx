import { useStore } from '../stores/useStore';

export default function HomeScreen({ onCreate, onJoin }) {
  const username = useStore(state => state.username);
  const setUsername = useStore(state => state.setUsername);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-darker to-dark">
      <div className="w-full max-w-sm">
        {/* Logo / Title */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center pulse-glow">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Social Jukebox</h1>
          <p className="text-gray-400">Collaborative music for everyone</p>
        </div>
        
        {/* Username Input */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-xl bg-dark border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
            maxLength={20}
          />
        </div>
        
        {/* Action Buttons */}
        <div className="space-y-4">
          <button
            onClick={onCreate}
            disabled={!username.trim()}
            className="w-full py-4 px-6 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-semibold transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Create Room 🎵
          </button>
          
          <button
            onClick={onJoin}
            disabled={!username.trim()}
            className="w-full py-4 px-6 rounded-xl bg-dark border border-gray-700 hover:border-gray-600 disabled:border-gray-800 disabled:cursor-not-allowed text-white font-semibold transition-all"
          >
            Join Room 🔗
          </button>
        </div>
        
        {/* Footer */}
        <p className="mt-8 text-center text-gray-500 text-sm">
          Connect your phone to play music through the room
        </p>
      </div>
    </div>
  );
}