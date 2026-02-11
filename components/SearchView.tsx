
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { Profile } from '../types';
import { Search as SearchIcon } from 'lucide-react';

interface Props {
  onNavigateToProfile: (id: string) => void;
}

export const SearchView: React.FC<Props> = ({ onNavigateToProfile }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.length >= 2) handleSearch();
      else setResults([]);
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    const { data } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', `%${query}%`)
        .limit(10);
    
    if (data) setResults(data);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="relative mb-8">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input 
          autoFocus
          placeholder="Search for users..."
          className="w-full bg-zinc-900 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-lg focus:outline-none focus:border-white transition-colors"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {loading ? (
            <div className="p-8 text-center opacity-50">Searching...</div>
        ) : (
            results.map(profile => (
                <button
                    key={profile.id}
                    onClick={() => onNavigateToProfile(profile.id)}
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-zinc-950 border border-white/5 hover:border-white/20 transition-all text-left"
                >
                    <img 
                        src={profile.avatar_url || `https://picsum.photos/seed/${profile.id}/100/100`} 
                        className="w-14 h-14 rounded-full object-cover border border-white/10"
                        alt="Avatar"
                    />
                    <div>
                        <p className="font-bold text-lg">{profile.display_name || profile.username}</p>
                        <p className="text-zinc-500">@{profile.username}</p>
                    </div>
                </button>
            ))
        )}
        
        {query.length >= 2 && results.length === 0 && !loading && (
            <p className="p-8 text-center text-zinc-500">No users found for "{query}"</p>
        )}
      </div>
    </div>
  );
};
