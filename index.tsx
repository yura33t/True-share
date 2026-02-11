
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, MessageSquare, User, LogOut, Heart, MessageCircle, Send, ChevronLeft, Camera, Image as ImageIcon, CheckCircle2, AlertCircle, List, AlertTriangle } from 'lucide-react';

// --- CONFIGURATION ---
const URL = 'https://xzlxfsfithlnvcjczltp.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHhmc2ZpdGhsbnZjamN6bHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTQ2NTcsImV4cCI6MjA4NjMzMDY1N30.Uf2nAHKPLFnG9EsRWuWnl0Tg12pvmkLsK0OI6G3zV9Q';
const supabase = createClient(URL, KEY);

// --- HELPERS ---
const getAvatar = (url: any, username: any) => {
  if (url && url.length > 50) return url;
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'default'}`;
};

// --- COMPONENTS ---

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      if (isLogin) {
        const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { data: { username: username.toLowerCase(), display_name: username } }
        });
        if (err) throw err;
        alert('Confirmation email sent!');
        setIsLogin(true);
      }
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-zinc-950 border border-white/10 p-8 rounded-[32px] shadow-2xl">
        <div className="text-center mb-10">
            <h1 className="text-4xl font-black tracking-tighter italic">TRUESHARE</h1>
            <p className="text-zinc-600 text-[10px] uppercase tracking-[0.4em] font-bold mt-2">Premium Network Access</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <input type="text" placeholder="Username" className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm focus:border-white/30 outline-none transition-all" value={username} onChange={e => setUsername(e.target.value)} required />
          )}
          <input type="email" placeholder="Email" className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm focus:border-white/30 outline-none transition-all" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Password" className="w-full bg-black border border-white/10 rounded-2xl p-4 text-sm focus:border-white/30 outline-none transition-all" value={password} onChange={e => setPassword(e.target.value)} required />
          {error && <div className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest">{error}</div>}
          <button type="submit" disabled={loading} className="w-full bg-white text-black font-black p-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50 text-xs uppercase tracking-widest">
            {loading ? 'SYNCING...' : (isLogin ? 'SIGN IN' : 'JOIN NETWORK')}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full text-zinc-500 text-[9px] mt-8 uppercase tracking-[0.3em] font-black hover:text-white transition-colors">
          {isLogin ? "No account? Register" : "Have account? Login"}
        </button>
      </motion.div>
    </div>
  );
};

const Navigation = ({ currentView, setView, profile, onLogout }: any) => (
  <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/5 md:relative md:border-t-0 md:bg-transparent md:w-20 lg:w-64 p-4 md:h-screen flex md:flex-col justify-around md:justify-start gap-4">
    <div className="hidden md:block text-2xl font-black italic mb-10 px-2 tracking-tighter">TS</div>
    {[
      { id: 'feed', icon: Home, label: 'Feed' },
      { id: 'search', icon: Search, label: 'Search' },
      { id: 'messages', icon: MessageSquare, label: 'Chats' },
      { id: 'profile', icon: User, label: 'Profile' }
    ].map((item: any) => (
      <button key={item.id} onClick={() => setView(item.id)} className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${currentView === item.id ? 'bg-white text-black shadow-lg shadow-white/5' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
        <item.icon size={22} />
        <span className="hidden lg:block font-bold text-sm">{item.label}</span>
      </button>
    ))}
    <button onClick={onLogout} className="md:mt-auto p-3 text-zinc-500 hover:text-red-500 transition-all flex items-center gap-4">
      <LogOut size={22} />
      <span className="hidden lg:block font-black text-[10px] uppercase tracking-widest">Exit</span>
    </button>
  </nav>
);

const CommentSection = ({ postId, profileId }: any) => {
  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState('');
  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*, profiles(username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
    if (data) setComments(data);
  };
  useEffect(() => { fetchComments(); }, [postId]);
  const send = async (e: any) => {
    e.preventDefault();
    if (!text.trim()) return;
    await supabase.from('comments').insert({ post_id: postId, user_id: profileId, content: text });
    setText('');
    fetchComments();
  };
  return (
    <div className="mt-4 pl-12 space-y-3">
      {comments.map((c: any) => (
        <div key={c.id} className="flex gap-2 text-sm">
          <img src={getAvatar(c.profiles?.avatar_url, c.profiles?.username)} className="w-6 h-6 rounded-full" />
          <div className="bg-white/5 p-2 px-3 rounded-2xl flex-1">
            <span className="font-bold text-[9px] text-zinc-500 uppercase tracking-tighter">@{c.profiles?.username}</span>
            <p className="text-white/80 leading-tight text-xs">{c.content}</p>
          </div>
        </div>
      ))}
      <form onSubmit={send} className="flex gap-2">
        <input placeholder="Reply..." className="bg-white/5 rounded-full px-4 py-1.5 text-[10px] flex-1 outline-none border border-white/0 focus:border-white/10" value={text} onChange={e => setText(e.target.value)} />
        <button type="submit" className="text-white/40 hover:text-white"><Send size={14}/></button>
      </form>
    </div>
  );
};

const PostItem = ({ post, profileId, onLike, onNavigate }: any) => {
  const [showComments, setShowComments] = useState(false);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 border-b border-white/5 hover:bg-white/[0.01] transition-all">
      <div className="flex gap-4">
        <img src={getAvatar(post.author?.avatar_url, post.author?.username)} className="w-10 h-10 rounded-full cursor-pointer bg-zinc-900 shadow-xl" onClick={() => onNavigate(post.user_id)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-sm cursor-pointer hover:underline truncate" onClick={() => onNavigate(post.user_id)}>{post.author?.display_name || post.author?.username}</span>
            <span className="text-zinc-600 text-xs truncate">@{post.author?.username}</span>
          </div>
          <p className="text-[14px] leading-relaxed mb-4 whitespace-pre-wrap text-white/90">{post.content}</p>
          <div className="flex gap-8 text-zinc-500">
            <button onClick={() => onLike(post.id, post.user_has_liked)} className={`flex items-center gap-1.5 transition-colors ${post.user_has_liked ? 'text-white' : 'hover:text-white'}`}>
              <Heart size={16} fill={post.user_has_liked ? 'white' : 'none'} />
              <span className="text-xs font-bold">{post.likes_count || 0}</span>
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 hover:text-white transition-colors">
              <MessageCircle size={16} />
              <span className="text-xs font-bold">{post.comments_count || 0}</span>
            </button>
          </div>
          {showComments && <CommentSection postId={post.id} profileId={profileId} />}
        </div>
      </div>
    </motion.div>
  );
};

const Feed = ({ profile, filterUserId = null, onNavigate }: any) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const fetchPosts = async () => {
    let q = supabase.from('posts').select('*, author:profiles!user_id(*), likes(user_id), comments(id)').order('created_at', { ascending: false });
    if (filterUserId) q = q.eq('user_id', filterUserId);
    const { data } = await q;
    if (data) setPosts(data.map((p: any) => ({
      ...p,
      likes_count: p.likes?.length || 0,
      comments_count: p.comments?.length || 0,
      user_has_liked: p.likes?.some((l: any) => l.user_id === profile?.id)
    })));
    setLoading(false);
  };
  useEffect(() => { fetchPosts(); }, [filterUserId, profile?.id]);
  const handlePost = async (e: any) => {
    e.preventDefault();
    if (!text.trim()) return;
    await supabase.from('posts').insert({ user_id: profile.id, content: text });
    setText('');
    fetchPosts();
  };
  const like = async (postId: any, hasLiked: any) => {
    if (hasLiked) await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', profile.id);
    else await supabase.from('likes').insert({ post_id: postId, user_id: profile.id });
    fetchPosts();
  };
  return (
    <div className="max-w-2xl mx-auto pb-24">
      {!filterUserId && (
        <div className="p-6 border-b border-white/5 bg-white/[0.02]">
          <form onSubmit={handlePost} className="flex gap-4">
            <img src={getAvatar(profile?.avatar_url, profile?.username)} className="w-10 h-10 rounded-full bg-zinc-900" />
            <div className="flex-1">
              <textarea placeholder="Write something meaningful..." className="w-full bg-transparent text-lg outline-none resize-none pt-2 placeholder:text-zinc-800" rows={2} value={text} onChange={e => setText(e.target.value)} />
              <div className="flex justify-end pt-2">
                <button className="bg-white text-black px-6 py-2 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95">Post</button>
              </div>
            </div>
          </form>
        </div>
      )}
      {loading ? <div className="p-20 text-center opacity-20 italic font-black text-[10px] uppercase tracking-widest animate-pulse">Syncing Cloud...</div> : posts.map(p => <PostItem key={p.id} post={p} profileId={profile?.id} onLike={like} onNavigate={onNavigate} />)}
    </div>
  );
};

const ProfileView = ({ viewingId, ownProfile, onEdit, setView, setTargetId }: any) => {
  const [profile, setProfile] = useState<any>(null);
  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', viewingId).single().then(({ data }) => setProfile(data));
  }, [viewingId]);
  if (!profile) return null;
  const isOwn = ownProfile?.id === viewingId;
  return (
    <div className="animate-in fade-in duration-500">
      <div className="h-48 bg-zinc-900 border-b border-white/5 relative overflow-hidden">
        {profile.banner_url && <img src={profile.banner_url} className="w-full h-full object-cover opacity-30" />}
      </div>
      <div className="px-6 -mt-16 relative z-10">
        <div className="flex justify-between items-end">
          <img src={getAvatar(profile.avatar_url, profile.username)} className="w-32 h-32 rounded-[40px] border-[6px] border-black bg-black shadow-2xl" />
          <div className="flex gap-2 mb-2">
            {isOwn ? (
              <button onClick={onEdit} className="px-6 py-2.5 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-200 transition-all">Edit Profile</button>
            ) : (
              <button onClick={() => { setTargetId(profile.id); setView('messages'); }} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all"><MessageSquare size={20}/></button>
            )}
          </div>
        </div>
        <div className="mt-6">
          <h1 className="text-3xl font-black italic tracking-tighter">{profile.display_name || profile.username}</h1>
          <p className="text-zinc-600 text-sm font-bold">@{profile.username}</p>
          <p className="mt-4 text-white/70 text-sm leading-relaxed max-w-xl">{profile.bio || "No bio information provided."}</p>
        </div>
        <div className="mt-12">
          <h2 className="text-[10px] uppercase font-black tracking-[0.4em] text-zinc-500 mb-8 border-b border-white/5 pb-2">Archive</h2>
          <Feed profile={ownProfile} filterUserId={viewingId} onNavigate={() => {}} />
        </div>
      </div>
    </div>
  );
};

const MessagesView = ({ currentUser, initialId }: any) => {
  const [chats, setChats] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const fetchChats = async () => {
    const { data: sent } = await supabase.from('messages').select('receiver_id').eq('sender_id', currentUser.id);
    const { data: recv } = await supabase.from('messages').select('sender_id').eq('receiver_id', currentUser.id);
    const ids = [...new Set([...(sent?.map((m: any)=>m.receiver_id)||[]), ...(recv?.map((m: any)=>m.sender_id)||[])])];
    if (ids.length) {
      const { data } = await supabase.from('profiles').select('*').in('id', ids);
      if (data) setChats(data);
    }
  };
  useEffect(() => {
    fetchChats();
    if (initialId) supabase.from('profiles').select('*').eq('id', initialId).single().then(({data}) => setSelected(data));
  }, [initialId]);
  useEffect(() => {
    if (selected) {
      supabase.from('messages').select('*').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selected.id}),and(sender_id.eq.${selected.id},receiver_id.eq.${currentUser.id})`).order('created_at', { ascending: true })
        .then(({data}) => data && setMessages(data));
    }
  }, [selected]);
  const send = async (e: any) => {
    e.preventDefault();
    if (!text.trim() || !selected) return;
    const msg = text; setText('');
    await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: selected.id, content: msg });
    setMessages((prev: any) => [...prev, { sender_id: currentUser.id, content: msg, created_at: new Date() }]);
  };
  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden">
      <div className={`${selected ? 'hidden md:block' : 'block'} w-full md:w-80 border-r border-white/5 overflow-y-auto no-scrollbar`}>
        <div className="p-6 text-xl font-black italic tracking-tighter">MESSAGES</div>
        <div className="p-2 space-y-1">
          {chats.map((c: any) => (
            <div key={c.id} onClick={() => setSelected(c)} className={`p-4 flex gap-4 rounded-3xl cursor-pointer transition-all ${selected?.id === c.id ? 'bg-white text-black' : 'hover:bg-white/5'}`}>
              <img src={getAvatar(c.avatar_url, c.username)} className="w-10 h-10 rounded-full shadow-lg" />
              <div className="truncate flex-1">
                <p className="font-bold text-sm truncate">{c.display_name || c.username}</p>
                <p className={`text-[9px] uppercase tracking-widest font-black opacity-40`}>View history</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {selected && (
        <div className="flex-1 flex flex-col bg-black">
          <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-black/50 backdrop-blur-md">
            <button onClick={() => setSelected(null)} className="md:hidden p-2"><ChevronLeft/></button>
            <img src={getAvatar(selected.avatar_url, selected.username)} className="w-8 h-8 rounded-full" />
            <p className="font-bold text-sm italic">{selected.display_name || selected.username}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.sender_id === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-4 rounded-3xl text-sm ${m.sender_id === currentUser.id ? 'bg-white text-black rounded-tr-none shadow-xl' : 'bg-zinc-900 text-white rounded-tl-none border border-white/5'}`}>
                  {m.content}
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="p-6">
            <div className="flex gap-2 bg-zinc-950 border border-white/10 rounded-3xl p-2 pl-6 focus-within:border-white/30 transition-all">
              <input className="flex-1 bg-transparent text-sm outline-none py-2" placeholder="Start typing..." value={text} onChange={e => setText(e.target.value)} />
              <button type="submit" className="bg-white text-black p-3 rounded-2xl hover:bg-zinc-200 transition-all"><Send size={18}/></button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

const EditProfile = ({ profile, onSave }: any) => {
  const [name, setName] = useState(profile.display_name || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [avatar, setAvatar] = useState(profile.avatar_url || '');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    await supabase.from('profiles').update({ display_name: name, bio, avatar_url: avatar }).eq('id', profile.id);
    onSave();
  };
  return (
    <div className="p-8 max-w-xl mx-auto space-y-8">
      <h2 className="text-3xl font-black italic tracking-tighter mb-10 uppercase">Identity Mod</h2>
      <div className="space-y-6">
        <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Avatar URL</label>
            <input className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-sm focus:border-white/30 outline-none" value={avatar} onChange={e => setAvatar(e.target.value)} />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Display Name</label>
            <input className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-sm focus:border-white/30 outline-none" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
            <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Bio Description</label>
            <textarea className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-sm resize-none focus:border-white/30 outline-none" rows={4} value={bio} onChange={e => setBio(e.target.value)} />
        </div>
        <button onClick={save} disabled={saving} className="w-full bg-white text-black font-black p-5 rounded-[24px] mt-6 uppercase tracking-[0.3em] text-[10px] hover:bg-zinc-200 transition-all">
          {saving ? 'UPDATING...' : 'COMMIT CHANGES'}
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState('feed');
  const [targetId, setTargetId] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (uid: any) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).single();
    if (data) setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) loadProfile(s.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (loading) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center">
      <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin mb-4" />
      <p className="text-[10px] uppercase font-black tracking-[0.5em] text-zinc-700">Connecting to TS</p>
    </div>
  );

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row max-w-6xl mx-auto">
      <Navigation currentView={view} setView={(v: any) => { setView(v); if (v!=='profile') setTargetId(null); }} profile={profile} onLogout={() => supabase.auth.signOut()} />
      <main className="flex-1 border-x border-white/5 h-screen overflow-y-auto relative no-scrollbar">
        {view === 'feed' && <Feed profile={profile} onNavigate={(id: any) => { setTargetId(id); setView('profile'); }} />}
        {view === 'search' && (
          <div className="p-8">
            <div className="relative mb-12">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700" />
              <input placeholder="Search Global Network..." className="w-full bg-zinc-950 border border-white/10 rounded-[32px] py-6 pl-16 pr-8 text-xl outline-none focus:border-white/30 transition-all font-bold italic" onChange={async (e: any) => {
                const q = e.target.value;
                if (q.length > 2) {
                  const { data } = await supabase.from('profiles').select('*').ilike('username', `%${q}%`).limit(10);
                  if (data) setTargetId(data); 
                }
              }} />
            </div>
            {Array.isArray(targetId) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {targetId.map((p: any) => (
                  <div key={p.id} className="flex items-center gap-4 p-5 bg-zinc-950 border border-white/5 rounded-[24px] cursor-pointer hover:bg-white/5 transition-all" onClick={() => { setTargetId(p.id); setView('profile'); }}>
                    <img src={getAvatar(p.avatar_url, p.username)} className="w-14 h-14 rounded-2xl shadow-xl" />
                    <div>
                      <p className="font-bold text-lg leading-tight">{p.display_name || p.username}</p>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">@{p.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {view === 'profile' && <ProfileView viewingId={targetId || profile?.id} ownProfile={profile} onEdit={() => setView('edit-profile')} setView={setView} setTargetId={setTargetId} />}
        {view === 'messages' && <MessagesView currentUser={profile} initialId={targetId} />}
        {view === 'edit-profile' && <EditProfile profile={profile} onSave={() => { setView('profile'); loadProfile(profile.id); }} />}
      </main>
    </div>
  );
};

const container = document.getElementById('root');
if (container) ReactDOM.createRoot(container).render(<App />);
