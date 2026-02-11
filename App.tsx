
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';
import { Profile, ViewState } from './types';
import { Auth } from './components/Auth';
import { Feed } from './components/Feed';
import { Navigation } from './components/Navigation';
import { ProfileView } from './components/ProfileView';
import { MessagesView } from './components/MessagesView';
import { SearchView } from './components/SearchView';
import { EditProfile } from './components/EditProfile';
import { motion } from 'framer-motion';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(() => {
    try {
      const saved = localStorage.getItem('ts_profile');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  
  const [cachedPosts, setCachedPosts] = useState<any[]>([]);
  const [currentView, setCurrentView] = useState<ViewState>('feed');
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);
  const [targetChatId, setTargetChatId] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      if (data) {
        setProfile(data);
        localStorage.setItem('ts_profile', JSON.stringify(data));
      }
    } catch (e) {
      console.error("Profile fetch error:", e);
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      try {
        const { data: { session: s }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSession(s);
        if (s) await fetchProfile(s.user.id);
      } catch (err: any) {
        console.error("Initialization failed:", err);
        setInitError(err.message || "Failed to connect to authentication server.");
      } finally {
        // Убеждаемся, что экран загрузки исчезнет в любом случае
        setInitializing(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setCachedPosts([]);
        localStorage.removeItem('ts_profile');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleLogout = async () => {
    try {
      localStorage.clear();
      await supabase.auth.signOut();
      window.location.reload();
    } catch (err) {
      window.location.reload();
    }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full mb-4"
        />
        <p className="text-white/30 text-[9px] uppercase tracking-[0.3em] font-bold">Connecting</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-red-500/5 border border-red-500/10 p-8 rounded-3xl max-w-sm">
          <div className="text-red-500 font-bold mb-2 uppercase text-xs tracking-widest">Connection Error</div>
          <p className="text-white/50 text-sm mb-6 leading-relaxed">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-white text-black py-3 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!session) return <Auth />;

  return (
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black font-sans overflow-x-hidden">
      <div className="flex flex-col md:flex-row max-w-6xl mx-auto min-h-screen relative">
        <Navigation 
            currentView={currentView} 
            setView={(v) => { 
                setCurrentView(v); 
                if (v !== 'profile') setTargetProfileId(null); 
                if (v !== 'feed') setFeedFilter(null); 
            }} 
            profile={profile} 
            onLogout={handleLogout} 
        />
        <main className="flex-1 border-x border-white/5 relative bg-black">
          <div className="pb-20 md:pb-0 h-full overflow-y-auto no-scrollbar">
              {currentView === 'feed' && (
                <Feed 
                    profile={profile} 
                    filterUserId={feedFilter}
                    cachedPosts={cachedPosts}
                    setCachedPosts={setCachedPosts}
                    onNavigateToProfile={(id) => { setTargetProfileId(id); setCurrentView('profile'); }} 
                />
              )}
              {currentView === 'profile' && (
                <ProfileView 
                  viewingProfileId={targetProfileId || profile?.id || ''} 
                  ownProfile={profile}
                  onEdit={() => setCurrentView('edit-profile')}
                  onMessage={(id) => { setTargetChatId(id); setCurrentView('messages'); }}
                  onViewPosts={(userId) => { setFeedFilter(userId); setCurrentView('feed'); }}
                />
              )}
              {currentView === 'messages' && <MessagesView currentUser={profile} initialTargetId={targetChatId} />}
              {currentView === 'search' && <SearchView onNavigateToProfile={(id) => { setTargetProfileId(id); setCurrentView('profile'); }} />}
              {currentView === 'edit-profile' && profile && (
                <EditProfile profile={profile} onSave={async () => {
                  if (profile) await fetchProfile(profile.id);
                  setCurrentView('profile');
                }} />
              )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
