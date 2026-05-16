import { useState } from 'react';
import { useStore } from '../stores/useStore';

export default function SearchModal({ onClose }) {
  const [query, setQuery] = useState('');
  const searchYouTube = useStore(state => state.searchYouTube);
  const searchResults = useStore(state => state.searchResults);
  const isSearching = useStore(state => state.isSearching);
  const searchError = useStore(state => state.searchError);
  const addToQueue = useStore(state => state.addToQueue);
  const clearSearch = useStore(state => state.clearSearch);
  
  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      searchYouTube(query);
    }
  };

  const handleSearchClick = () => {
    if (query.trim()) {
      searchYouTube(query);
    }
  };
  
  const handleAddTrack = (track) => {
    addToQueue(track);
    clearSearch();
    setQuery('');
    onClose();
  };
  
  const handleClose = () => {
    clearSearch();
    setQuery('');
    onClose();
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50" onClick={handleClose}>
      <div 
        className="bg-dark rounded-t-2xl sm:rounded-xl w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Add Song</h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Search Form */}
        <form onSubmit={handleSearch} className="p-4 border-b border-gray-800">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for songs..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary transition-colors"
                autoFocus
              />
              <svg 
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="button"
              onClick={handleSearchClick}
              disabled={isSearching || !query.trim()}
              className="px-4 py-3 rounded-xl bg-primary hover:bg-primary/90 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {isSearching ? '...' : 'Search'}
            </button>
          </div>
        </form>
        
        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {isSearching ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.map((track) => (
                <button
                  key={track.sourceId}
                  onClick={() => handleAddTrack(track)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800 transition-colors text-left"
                >
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
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    <p className="text-gray-500 text-sm truncate">{track.artist}</p>
                  </div>
                  
                  <svg className="w-5 h-5 text-primary flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              ))}
            </div>
          ) : searchError ? (
            <div className="text-center py-8">
              <p className="text-red-400">{searchError}</p>
              <p className="text-gray-500 text-sm mt-1">Check server connection</p>
            </div>
          ) : query ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No results found</p>
              <p className="text-gray-600 text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Search for songs to add</p>
              <p className="text-gray-600 text-sm mt-1">Powered by YouTube</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}