
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Profile, Post } from '../types';
import { List, MessageSquare } from 'lucide-react';

interface Props {
  viewingProfileId: string;
  ownProfile: Profile | null;
  onEdit: () => void;
  onMessage: (id: string) => void;
  onViewPosts: (userId: string) => void;
}

export const ProfileView: React.FC<Props> = ({ viewingProfileId, ownProfile, onEdit, onMessage, onViewPosts }) => {
  const [profile, setProfile] = useState<Profile | null>(() => {
      return ownProfile?.id === viewingProfileId ? ownProfile : null;
  });
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(!profile);

  const isOwn = ownProfile?.id === viewingProfileId;

  const fetchData = useCallback(async () => {
    try {
      const profilePromise = !profile ? supabase.from('profiles').select('*').eq('id', viewingProfileId).maybeSingle() : Promise.resolve({ data: profile });
      const postsPromise = supabase.from('posts').select('id, content, created_at').eq('user_id', viewingProfileId).order('created_at', { ascending: false }).limit(5);
      
      const [pRes, postsRes] = await Promise.all([profilePromise, postsPromise]);
      
      if (pRes.data) setProfile(pRes.data);
      if (postsRes.data) setPosts(postsRes.data as any);
    } finally {
      setLoading(false);
    }
  }, [viewingProfileId, profile]);

  useEffect(() => {
    fetchData();
  }, [viewingProfileId]);

  if (!profile && loading) return <div className="p-20 text-center animate-pulse text-zinc-800 font-black uppercase tracking-widest">Loading</div>;
  if (!profile) return <div className="p-20 text-center text-zinc-500">Not found</div>;

  return (
    <div className="pb-20">
      <div className="h-40 md:h-52 bg-zinc-950 overflow-hidden relative">
        {profile.banner_url ? (
            <img src={profile.banner_url} className="w-full h-full object-cover opacity-50" alt="" />
        ) : (
            <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-black" />
        )}
      </div>

      <div className="px-4 relative -mt-12">
        <div className="flex justify-between items-end mb-4">
          <img 
            src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} 
            className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-4 border-black bg-black"
            alt=""
          />
          <div className="flex gap-2 mb-1">
            <button onClick={() => onViewPosts(profile.id)} className="p-2.5 bg-white/[0.05] rounded-full hover:bg-white/10 transition-colors">
                <List size={18} />
            </button>
            {isOwn ? (
                <button onClick={onEdit} className="px-5 py-2 bg-white text-black rounded-full font-bold text-sm">
                  Edit
                </button>
            ) : (
                <button onClick={() => onMessage(profile.id)} className="p-2.5 bg-white/[0.05] rounded-full hover:bg-white/10 transition-colors">
                  <MessageSquare size={18} />
                </button>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tight">{profile.display_name || profile.username}</h1>
          <p className="text-zinc-500 text-sm mb-3">@{profile.username}</p>
          <p className="text-white/70 text-sm leading-relaxed max-w-lg">{profile.bio}</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-600">Recent Activity</h3>
          <div className="divide-y divide-white/5">
            {posts.map(post => (
                <div key={post.id} className="py-4 cursor-pointer group" onClick={() => onViewPosts(profile.id)}>
                    <p className="text-[15px] text-white/80 group-hover:text-white transition-colors leading-snug line-clamp-2">{post.content}</p>
                    <span className="text-[9px] text-zinc-700 uppercase font-bold mt-2 block tracking-widest">
                        {new Date(post.created_at).toLocaleDateString()}
                    </span>
                </div>
            ))}
            {!loading && posts.length === 0 && (
                <div className="py-10 text-center border-t border-white/5">
                    <p className="text-zinc-700 text-xs uppercase tracking-widest">No posts yet</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
