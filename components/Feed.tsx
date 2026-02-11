
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
        <div className="p-4 flex flex-col hover:bg-white/[0.02] border-b border-white/5 transition-colors">
            <div className="flex gap-3">
                <img 
                    src={avatar} 
                    className="w-10 h-10 rounded-full object-cover cursor-pointer bg-zinc-900 flex-shrink-0"
                    onClick={() => onNavigateToProfile(post.user_id)}
                    alt=""
                    loading="lazy"
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-bold text-white text-[14px] hover:underline cursor-pointer truncate" onClick={() => onNavigateToProfile(post.user_id)}>
                            {post.profile_data?.display_name || post.profile_data?.username}
                        </span>
                        <span className="text-zinc-600 text-[13px] truncate">@{post.profile_data?.username}</span>
                    </div>
                    <p className="text-white/90 whitespace-pre-wrap mb-3 text-[15px] leading-tight">{post.content}</p>
                    <div className="flex items-center gap-8 text-zinc-500">
                        <button onClick={() => onLike(post.id, post.user_has_liked)} className={`flex items-center gap-1.5 transition-colors ${post.user_has_liked ? 'text-white' : 'hover:text-white'}`}>
                            <Heart size={16} fill={post.user_has_liked ? "white" : "none"} stroke={post.user_has_liked ? "white" : "currentColor"} />
                            <span className="text-[12px] font-semibold">{post.likes_count || ''}</span>
                        </button>
                        <button onClick={onToggleComments} className="flex items-center gap-1.5 hover:text-white transition-colors">
                            <MessageCircle size={16} />
                            <span className="text-[12px] font-semibold">{post.comments_count || ''}</span>
                        </button>
                    </div>
                </div>
            </div>
            {isCommentsOpen && <CommentSection postId={post.id} profileId={currentUserId} onNavigateToProfile={onNavigateToProfile} />}
        </div>
    );
});

export const Feed: React.FC<Props> = ({ profile, filterUserId, cachedPosts, setCachedPosts, onNavigateToProfile }) => {
  const [newPost, setNewPost] = useState('');
  const [loading, setLoading] = useState(!cachedPosts.length);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<Record<string, boolean>>({});

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
        .limit(20);
      
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
          
          if (filterUserId) {
              // Для профиля не кэшируем в глобальный стейт
              setLocalPosts(formatted);
          } else {
              setCachedPosts(formatted);
          }
      }
    } finally {
      setLoading(false);
    }
  }, [filterUserId, profile?.id, setCachedPosts]);

  const [localPosts, setLocalPosts] = useState<any[]>([]);

  useEffect(() => {
    fetchPosts(cachedPosts.length > 0 && !filterUserId);
  }, [fetchPosts]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !newPost.trim()) return;
    setPosting(true);
    const content = newPost.trim();
    setNewPost('');
    
    const { error } = await supabase.from('posts').insert({ user_id: profile.id, content });
    if (!error) fetchPosts(true);
    setPosting(false);
  };

  const toggleLike = async (postId: string, hasLiked: boolean) => {
    if (!profile) return;
    const updater = (prev: any[]) => prev.map(p => p.id === postId ? { 
        ...p, 
        user_has_liked: !hasLiked, 
        likes_count: hasLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 
    } : p);

    if (filterUserId) setLocalPosts(updater);
    else setCachedPosts(updater);
    
    if (hasLiked) await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', profile.id);
    else await supabase.from('likes').insert({ post_id: postId, user_id: profile.id });
  };

  const displayPosts = filterUserId ? localPosts : cachedPosts;

  return (
    <div className="max-w-2xl mx-auto min-h-screen">
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-sm p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-white/50">
            {filterUserId ? 'User Archive' : 'Timeline'}
        </h2>
      </div>

      {!filterUserId && profile && (
        <div className="p-4 border-b border-white/5 bg-white/[0.01]">
          <form onSubmit={handlePost} className="flex gap-4">
            <img src={profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} className="w-10 h-10 rounded-full bg-zinc-900" alt="" />
            <div className="flex-1">
                <textarea 
                    placeholder="Post something..." 
                    className="w-full bg-transparent text-lg focus:outline-none resize-none pt-1 placeholder:text-zinc-800" 
                    rows={1} value={newPost} onChange={(e) => setNewPost(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                    <button disabled={posting || !newPost.trim()} className="px-4 py-1.5 bg-white text-black rounded-full font-bold text-xs disabled:opacity-20 transition-all">
                        {posting ? '...' : 'Post'}
                    </button>
                </div>
            </div>
          </form>
        </div>
      )}

      <div>
        {loading && displayPosts.length === 0 ? (
          <div className="p-10 space-y-6">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-white/[0.02] rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          displayPosts.map((post) => (
            <PostItem 
                key={post.id} 
                post={post} 
                currentUserId={profile?.id}
                onLike={toggleLike}
                onNavigateToProfile={onNavigateToProfile}
                isCommentsOpen={!!openComments[post.id]}
                onToggleComments={() => setOpenComments(prev => ({...prev, [post.id]: !prev[post.id]}))}
            />
          ))
        )}
      </div>
    </div>
  );
};

const CommentSection = memo(({ postId, profileId, onNavigateToProfile }: any) => {
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        supabase.from('comments').select('*, profiles(username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true })
            .then(({ data }) => data && setComments(data));
    }, [postId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        const text = newComment.trim();
        setNewComment('');
        const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: profileId, content: text });
        if (!error) {
            const { data } = await supabase.from('comments').select('*, profiles(username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
            if (data) setComments(data);
        }
    };

    return (
        <div className="mt-4 pl-12 space-y-3">
            {comments.map(c => (
                <div key={c.id} className="flex gap-2 items-start">
                    <img src={c.profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.profiles?.username}`} className="w-6 h-6 rounded-full bg-zinc-900" alt=""/>
                    <div className="flex-1 bg-white/[0.03] p-2 rounded-xl">
                        <p className="text-[11px] font-bold text-zinc-500">@{c.profiles?.username}</p>
                        <p className="text-[13px] text-white/80 leading-tight">{c.content}</p>
                    </div>
                </div>
            ))}
            <form onSubmit={handleSend} className="flex gap-2 pt-1">
                <input placeholder="Reply..." className="flex-1 bg-white/[0.03] rounded-full px-4 py-2 text-xs focus:outline-none border border-white/5" value={newComment} onChange={(e) => setNewComment(e.target.value)} />
                <button type="submit" className="text-white opacity-40 hover:opacity-100 transition-opacity"><Send size={14} /></button>
            </form>
        </div>
    );
});
