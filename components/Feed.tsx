
import React, { useState, useEffect, useCallback, memo } from 'react';
import { supabase } from '../supabase';
import { Post, Profile } from '../types';
import { Heart, MessageCircle, Send } from 'lucide-react';

interface Props {
  profile: Profile | null;
  filterUserId?: string | null;
  cachedPosts: any[];
  setCachedPosts: React.Dispatch<React.SetStateAction<any[]>>;
  onNavigateToProfile: (id: string) => void;
}

const PostItem = memo(({ post, currentUserId, onLike, onNavigateToProfile, onToggleComments, isCommentsOpen }: any) => {
    const avatar = post.profile_data?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.profile_data?.username || 'default'}`;

    return (
        <div className="p-5 flex flex-col hover:bg-white/[0.01] border-b border-white/5 transition-colors">
            <div className="flex gap-4">
                <img 
                    src={avatar} 
                    className="w-11 h-11 rounded-full object-cover cursor-pointer bg-zinc-900 flex-shrink-0"
                    onClick={() => onNavigateToProfile(post.user_id)}
                    alt=""
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-[15px] hover:underline cursor-pointer truncate" onClick={() => onNavigateToProfile(post.user_id)}>
                            {post.profile_data?.display_name || post.profile_data?.username}
                        </span>
                        <span className="text-zinc-600 text-xs truncate">@{post.profile_data?.username}</span>
                    </div>
                    <p className="text-white/90 whitespace-pre-wrap mb-4 text-[15px] leading-normal">{post.content}</p>
                    <div className="flex items-center gap-10 text-zinc-500">
                        <button onClick={() => onLike(post.id, post.user_has_liked)} className={`flex items-center gap-2 transition-colors ${post.user_has_liked ? 'text-white' : 'hover:text-white'}`}>
                            <Heart size={18} fill={post.user_has_liked ? "white" : "none"} stroke={post.user_has_liked ? "white" : "currentColor"} />
                            <span className="text-xs font-bold">{post.likes_count || '0'}</span>
                        </button>
                        <button onClick={onToggleComments} className="flex items-center gap-2 hover:text-white transition-colors">
                            <MessageCircle size={18} />
                            <span className="text-xs font-bold">{post.comments_count || '0'}</span>
                        </button>
                    </div>
                </div>
            </div>
            {isCommentsOpen && <CommentSection postId={post.id} profileId={currentUserId} />}
        </div>
    );
});

export const Feed: React.FC<Props> = ({ profile, filterUserId, cachedPosts, setCachedPosts, onNavigateToProfile }) => {
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(!cachedPosts.length);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});
  const [localPosts, setLocalPosts] = useState<any[]>([]);

  const fetchPosts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const query = supabase
        .from('posts')
        .select(`
          id, content, created_at, user_id,
          author:profiles!user_id (id, username, display_name, avatar_url),
          likes (user_id),
          comments (id)
        `)
        .order('created_at', { ascending: false })
        .limit(30);
      
      if (filterUserId) query.eq('user_id', filterUserId);

      const { data } = await query;
      if (data) {
          const formatted = data.map((post: any) => ({
              ...post,
              profile_data: post.author, 
              likes_count: post.likes?.length || 0,
              comments_count: post.comments?.length || 0,
              user_has_liked: post.likes?.some((l: any) => l.user_id === profile?.id)
          }));
          if (filterUserId) setLocalPosts(formatted);
          else setCachedPosts(formatted);
      }
    } finally { setLoading(false); }
  }, [filterUserId, profile?.id, setCachedPosts]);

  useEffect(() => {
    fetchPosts(cachedPosts.length > 0 && !filterUserId);
  }, [fetchPosts]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newPost.trim()) return;
    setPosting(true);
    const { error } = await supabase.from('posts').insert({ user_id: profile.id, content: newPost.trim() });
    if (!error) {
        setNewPost('');
        fetchPosts(true);
    }
    setPosting(false);
  };

  const toggleLike = async (postId: string, hasLiked: boolean) => {
    if (!profile) return;
    const updater = (prev: any[]) => prev.map(p => p.id === postId ? { 
        ...p, user_has_liked: !hasLiked, 
        likes_count: hasLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 
    } : p);
    if (filterUserId) setLocalPosts(updater); else setCachedPosts(updater);
    
    if (hasLiked) await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', profile.id);
    else await supabase.from('likes').insert({ post_id: postId, user_id: profile.id });
  };

  const displayPosts = filterUserId ? localPosts : cachedPosts;

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md p-4 border-b border-white/5">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">
            {filterUserId ? 'Посты пользователя' : 'Лента'}
        </h2>
      </div>

      {!filterUserId && (
        <div className="p-6 border-b border-white/5">
          <form onSubmit={handlePost} className="flex gap-4">
            <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} className="w-12 h-12 rounded-full bg-zinc-900" alt="" />
            <div className="flex-1">
                <textarea 
                    placeholder="Что нового?" 
                    className="w-full bg-transparent text-lg focus:outline-none resize-none pt-2 placeholder:text-zinc-800 font-medium" 
                    rows={2} value={newPost} onChange={(e) => setNewPost(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                    <button disabled={posting || !newPost.trim()} className="px-6 py-2 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-widest disabled:opacity-20 transition-all hover:bg-zinc-200">
                        {posting ? 'Публикация...' : 'Опубликовать'}
                    </button>
                </div>
            </div>
          </form>
        </div>
      )}

      <div>
        {loading && displayPosts.length === 0 ? (
          <div className="p-20 text-center text-[10px] uppercase tracking-[0.5em] text-zinc-800 font-black animate-pulse">Загрузка постов</div>
        ) : displayPosts.map((post) => (
            <PostItem 
                key={post.id} post={post} currentUserId={profile?.id}
                onLike={toggleLike} onNavigateToProfile={onNavigateToProfile}
                isCommentsOpen={!!openComments[post.id]}
                onToggleComments={() => setOpenComments(prev => ({...prev, [post.id]: !prev[post.id]}))}
            />
        ))}
      </div>
    </div>
  );
};

const CommentSection = memo(({ postId, profileId }: any) => {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const fetch = () => supabase.from('comments').select('*, profiles(username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true }).then(({ data }) => data && setComments(data));
    useEffect(() => { fetch(); }, [postId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault(); if (!newComment.trim()) return;
        await supabase.from('comments').insert({ post_id: postId, user_id: profileId, content: newComment.trim() });
        setNewComment(''); fetch();
    };

    return (
        <div className="mt-4 pl-12 space-y-3">
            {comments.map(c => (
                <div key={c.id} className="flex gap-2 items-start">
                    <img src={c.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.profiles?.username}`} className="w-6 h-6 rounded-full" alt=""/>
                    <div className="flex-1 bg-white/[0.04] p-2.5 rounded-2xl">
                        <p className="text-[11px] font-black text-zinc-500 uppercase tracking-tighter">@{c.profiles?.username}</p>
                        <p className="text-[13px] text-white/80 mt-0.5">{c.content}</p>
                    </div>
                </div>
            ))}
            <form onSubmit={handleSend} className="flex gap-2 pt-1">
                <input placeholder="Написать комментарий..." className="flex-1 bg-white/[0.03] rounded-full px-4 py-2 text-xs focus:outline-none border border-white/5" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <button type="submit" className="text-white opacity-40 hover:opacity-100 transition-opacity"><Send size={14} /></button>
            </form>
        </div>
    );
});
