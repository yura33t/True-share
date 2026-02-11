
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { Profile, Post } from '../types';
import { List, MessageSquare, Settings } from 'lucide-react';

interface Props {
  viewingProfileId: string;
  ownProfile: Profile | null;
  onEdit: () => void;
  onMessage: (id: string) => void;
  onViewPosts: (userId: string) => void;
}

export const ProfileView: React.FC<Props> = ({ viewingProfileId, ownProfile, onEdit, onMessage, onViewPosts }) => {
  const [profile, setProfile] = useState<Profile | null>(() => ownProfile?.id === viewingProfileId ? ownProfile : null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(!profile);

  const isOwn = ownProfile?.id === viewingProfileId;

  const fetchData = useCallback(async () => {
    try {
      const pRes = !profile ? await supabase.from('profiles').select('*').eq('id', viewingProfileId).maybeSingle() : { data: profile };
      const postsRes = await supabase.from('posts').select('id, content, created_at').eq('user_id', viewingProfileId).order('created_at', { ascending: false }).limit(6);
      if (pRes.data) setProfile(pRes.data);
      if (postsRes.data) setPosts(postsRes.data as any);
    } finally { setLoading(false); }
  }, [viewingProfileId, profile]);

  useEffect(() => { fetchData(); }, [viewingProfileId]);

  if (!profile && loading) return <div className="p-20 text-center animate-pulse text-zinc-800 font-black uppercase tracking-widest">Загрузка...</div>;
  if (!profile) return <div className="p-20 text-center text-zinc-500">Пользователь не найден</div>;

  return (
    <div className="pb-20">
      <div className="h-48 md:h-64 bg-zinc-950 overflow-hidden relative">
        {profile.banner_url ? <img src={profile.banner_url} className="w-full h-full object-cover opacity-40" alt="" /> : <div className="w-full h-full bg-gradient-to-b from-zinc-900 to-black" />}
      </div>

      <div className="px-6 relative -mt-16">
        <div className="flex justify-between items-end mb-6">
          <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} className="w-32 h-32 md:w-40 md:h-40 rounded-[40px] border-8 border-black bg-black shadow-2xl" alt="" />
          <div className="flex gap-3 mb-2">
            {isOwn ? (
                <button onClick={onEdit} className="px-8 py-3 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all">
                  Настройки
                </button>
            ) : (
                <button onClick={() => onMessage(profile.id)} className="p-4 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-colors border border-white/10">
                  <MessageSquare size={20} />
                </button>
            )}
          </div>
        </div>

        <div className="mb-10">
          <h1 className="text-3xl font-black italic tracking-tighter">{profile.display_name || profile.username}</h1>
          <p className="text-zinc-600 font-bold text-xs uppercase tracking-widest mt-1">@{profile.username}</p>
          <p className="mt-5 text-zinc-400 text-sm leading-relaxed max-w-xl font-medium">{profile.bio || "Описание отсутствует."}</p>
        </div>

        <div className="border-t border-white/5 pt-10">
          <h3 className="text-[10px] uppercase tracking-[0.4em] font-black text-zinc-700 mb-8 text-center">Последние посты</h3>
          <div className="grid grid-cols-1 gap-4">
            {posts.map(post => (
                <div key={post.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl group cursor-pointer hover:bg-white/[0.04] transition-all" onClick={() => onViewPosts(profile.id)}>
                    <p className="text-sm text-white/80 leading-snug line-clamp-3">{post.content}</p>
                    <span className="text-[9px] text-zinc-700 uppercase font-black mt-4 block tracking-widest">
                        {new Date(post.created_at).toLocaleDateString()}
                    </span>
                </div>
            ))}
            {posts.length === 0 && <p className="text-center text-zinc-800 text-[10px] uppercase font-black tracking-widest py-10">Нет записей</p>}
          </div>
        </div>
      </div>
    </div>
  );
};
