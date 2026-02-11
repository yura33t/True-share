
import React, { useState, useEffect, useCallback, useRef, memo } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Search, MessageSquare, User, LogOut, Heart, MessageCircle, Send, Sparkles, X, Camera, Image as ImageIcon, ChevronLeft, AlertCircle } from 'lucide-react';

// --- CONFIGURATION ---
const SUPABASE_URL = 'https://xzlxfsfithlnvcjczltp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6bHhmc2ZpdGhsbnZjamN6bHRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NTQ2NTcsImV4cCI6MjA4NjMzMDY1N30.Uf2nAHKPLFnG9EsRWuWnl0Tg12pvmkLsK0OI6G3zV9Q';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const getAvatar = (url: string | null, username: string) => 
  (url && url.length > 20) ? url : `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'user'}`;

// --- AI ASSISTANT COMPONENT ---
const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setResponse(result.text || "Нет ответа.");
    } catch (e) { 
      setResponse("Ошибка ИИ. Проверьте соединение."); 
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed bottom-24 right-6 z-[60] md:bottom-8 md:right-8">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="mb-4 w-80 bg-zinc-900 border border-white/10 rounded-[32px] p-6 shadow-2xl overflow-hidden relative">
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">TrueShare AI</span>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white"><X size={16}/></button>
            </div>
            <div className="max-h-60 overflow-y-auto mb-6 text-xs text-zinc-300 leading-relaxed no-scrollbar">
              {loading ? "Думаю..." : response || "Привет! Я твой ИИ-помощник. О чем хочешь спросить?"}
            </div>
            <div className="flex gap-2">
              <input className="flex-1 bg-black border border-white/5 rounded-2xl px-4 py-3 text-xs outline-none focus:border-white/20 transition-all" placeholder="Спроси что-нибудь..." value={prompt} onChange={e => setPrompt(e.target.value)} onKeyPress={e => e.key === 'Enter' && askAI()} />
              <button onClick={askAI} className="bg-white text-black p-3 rounded-2xl active:scale-90"><Send size={16}/></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setOpen(!open)} className="w-14 h-14 bg-white text-black rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform">
        <Sparkles size={24} />
      </button>
    </div>
  );
};

// --- AUTH COMPONENT ---
const AuthView = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await supabase.auth.signInWithPassword({ email: email.trim(), password });
      } else {
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { username: username.trim(), display_name: username.trim() } }
        });
        alert("Регистрация успешна! Теперь вы можете войти.");
        setIsLogin(true);
      }
    } catch (err: any) { alert(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-zinc-950 border border-white/5 p-10 rounded-[48px] text-center">
        <h1 className="text-5xl font-black italic tracking-tighter mb-12">TS</h1>
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <input placeholder="Имя пользователя" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-white/20" value={username} onChange={e => setUsername(e.target.value)} required />
          )}
          <input type="email" placeholder="Email" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-white/20" value={email} onChange={e => setEmail(e.target.value)} required />
          <input type="password" placeholder="Пароль" className="w-full bg-black border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-white/20" value={password} onChange={e => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading} className="w-full bg-white text-black font-black py-5 rounded-2xl uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all">
            {loading ? "Загрузка..." : isLogin ? "Войти" : "Создать аккаунт"}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="mt-8 text-[10px] text-zinc-600 uppercase font-bold tracking-widest hover:text-white">
          {isLogin ? "Нет аккаунта? Регистрация" : "Уже есть аккаунт? Вход"}
        </button>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
const App = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [view, setView] = useState('feed');
  const [initializing, setInitializing] = useState(true);
  const [posts, setPosts] = useState<any[]>([]);
  const [targetId, setTargetId] = useState<string | null>(null);

  // Watchdog to clear loading screen
  useEffect(() => {
    const timer = setTimeout(() => setInitializing(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) fetchProfile(s.user.id);
      else setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s) fetchProfile(s.user.id);
      else { setProfile(null); setInitializing(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
    if (data) setProfile(data);
    setInitializing(false);
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*, author:profiles!user_id(*)').order('created_at', { ascending: false }).limit(20);
    if (data) setPosts(data);
  };

  useEffect(() => { if (session && view === 'feed') fetchPosts(); }, [session, view]);

  if (initializing) return (
    <div className="h-screen w-screen bg-black flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin mb-4" />
      <div className="text-[10px] uppercase tracking-[0.4em] text-zinc-600 font-bold">Загрузка сети</div>
    </div>
  );

  if (!session) return <AuthView />;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col md:flex-row max-w-6xl mx-auto border-x border-white/5">
      {/* Sidebar Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/5 md:relative md:w-20 lg:w-64 p-4 md:h-screen flex md:flex-col items-center justify-around md:justify-start gap-8">
        <div className="hidden md:block text-2xl font-black italic mb-10 px-4">TS</div>
        <button onClick={() => setView('feed')} className={`p-3 rounded-2xl transition-all ${view === 'feed' ? 'bg-white text-black' : 'text-zinc-600'}`}><Home/></button>
        <button onClick={() => setView('search')} className={`p-3 rounded-2xl transition-all ${view === 'search' ? 'bg-white text-black' : 'text-zinc-600'}`}><Search/></button>
        <button onClick={() => setView('messages')} className={`p-3 rounded-2xl transition-all ${view === 'messages' ? 'bg-white text-black' : 'text-zinc-600'}`}><MessageSquare/></button>
        <button onClick={() => { setView('profile'); setTargetId(session.user.id); }} className={`p-3 rounded-2xl transition-all ${view === 'profile' && targetId === session.user.id ? 'bg-white text-black' : 'text-zinc-600'}`}><User/></button>
        <button onClick={() => supabase.auth.signOut()} className="md:mt-auto text-zinc-800 hover:text-red-500"><LogOut/></button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-32 md:pb-0">
        <AnimatePresence mode="wait">
          {view === 'feed' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-xl mx-auto space-y-8">
              <div className="bg-zinc-950 border border-white/5 p-6 rounded-[32px]">
                <textarea placeholder="Что нового?" className="w-full bg-transparent outline-none resize-none text-lg placeholder:text-zinc-800" rows={2} />
                <div className="flex justify-end mt-4">
                  <button className="bg-white text-black px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">Опубликовать</button>
                </div>
              </div>
              {posts.map(p => (
                <div key={p.id} className="bg-zinc-950 border border-white/5 p-8 rounded-[40px] space-y-4">
                  <div className="flex items-center gap-4">
                    <img src={getAvatar(p.author?.avatar_url, p.author?.username)} className="w-10 h-10 rounded-full" />
                    <div>
                      <p className="font-bold text-sm">{p.author?.display_name || "Пользователь"}</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-widest">@{p.author?.username}</p>
                    </div>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">{p.content}</p>
                  <div className="flex gap-6 text-zinc-700 pt-2">
                    <button className="flex items-center gap-2 hover:text-white transition-all"><Heart size={18}/> <span className="text-xs font-bold">0</span></button>
                    <button className="flex items-center gap-2 hover:text-white transition-all"><MessageCircle size={18}/> <span className="text-xs font-bold">0</span></button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 max-w-2xl mx-auto text-center">
              <img src={getAvatar(profile?.avatar_url, profile?.username)} className="w-32 h-32 rounded-[40px] mx-auto mb-6 border-4 border-white/5 shadow-2xl" />
              <h1 className="text-4xl font-black italic tracking-tighter mb-2">{profile?.display_name || "Загрузка..."}</h1>
              <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs mb-8">@{profile?.username}</p>
              <p className="text-zinc-400 text-sm leading-relaxed mb-10">{profile?.bio || "О себе пока ничего нет."}</p>
              <button className="bg-white/5 border border-white/10 px-8 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest">Настройки</button>
            </motion.div>
          )}

          {(view === 'search' || view === 'messages') && (
            <div className="h-full flex items-center justify-center text-zinc-800 font-black uppercase tracking-[1em] text-[10px]">
              Раздел в разработке
            </div>
          )}
        </AnimatePresence>
      </main>
      <AIAssistant />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
