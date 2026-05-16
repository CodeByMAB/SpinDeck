import { useStore } from '../stores/useStore';

export default function UserList({ onClose }) {
  const room = useStore(state => state.room);
  const user = useStore(state => state.user);
  
  const users = room?.users || [];
  const host = users.find(u => u.isHost);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">In Room</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {users.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No users in room</p>
      ) : (
        <div className="space-y-2">
          {users.map(u => (
            <div 
              key={u.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                u.id === user?.id ? 'bg-primary/20' : 'bg-gray-800/50'
              }`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                u.isHost ? 'bg-primary/30 text-primary' : 'bg-gray-700 text-gray-400'
              }`}>
                {u.isHost ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                ) : (
                  <span className="text-lg font-medium">
                    {u.username.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              
              {/* Name & Role */}
              <div className="flex-1">
                <p className="font-medium text-white">
                  {u.username}
                  {u.id === user?.id && (
                    <span className="text-gray-400 text-sm ml-2">(you)</span>
                  )}
                </p>
                <p className="text-gray-500 text-sm">
                  {u.isHost ? 'Host' : 'Guest'}
                </p>
              </div>
              
              {/* Host Badge */}
              {u.isHost && (
                <span className="px-2 py-1 rounded-full bg-primary/30 text-primary text-xs font-medium">
                  HOST
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Room Info */}
      <div className="mt-6 pt-4 border-t border-gray-800">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Room PIN</span>
          <span className="text-white font-mono text-lg">{room?.pin}</span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-gray-500">Max Guests</span>
          <span className="text-white">{room?.settings?.maxUsers || 5}</span>
        </div>
      </div>
    </div>
  );
}