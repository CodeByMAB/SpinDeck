import { useStore } from '../stores/useStore';

export default function QueueList({ queue, isHost, currentTrackId }) {
  const removeFromQueue = useStore(state => state.removeFromQueue);
  
  if (queue.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-500">Queue is empty</p>
        <p className="text-gray-600 text-sm">Add songs using the button below</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {queue.map((track, index) => (
        <div 
          key={track.id}
          className={`flex items-center gap-3 p-3 rounded-xl bg-dark/50 ${
            track.id === currentTrackId ? 'ring-2 ring-primary' : ''
          }`}
        >
          {/* Position */}
          <span className="w-6 text-center text-gray-500 font-medium text-sm">
            {index + 1}
          </span>
          
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-800">
            {track.thumbnail ? (
              <img 
                src={track.thumbnail} 
                alt={track.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
          </div>
          
          {/* Track Info */}
          <div className="flex-1 min-w-0">
            <p className={`font-medium text-white truncate ${
              track.id === currentTrackId ? 'text-primary' : ''
            }`}>
              {track.title}
            </p>
            <p className="text-gray-500 text-sm truncate">{track.artist}</p>
          </div>
          
          {/* Remove Button (Host only) */}
          {isHost && track.id !== currentTrackId && (
            <button
              onClick={() => removeFromQueue(track.id)}
              className="p-2 rounded-lg hover:bg-red-500/20 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}