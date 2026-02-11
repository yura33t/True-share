
import React, { useState, useEffect, useCallback, useRef } from 'react';
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

  // Watchdog timeout to prevent infinite loading
  const watchdogRef = useRef<number | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    console.log("App: Fetching profile for", userId);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) {
        console.error("App: Profile fetch error", error);
        return;
      }
      if (data) {
        console.log("App: Profile loaded", data.username);
        setProfile(data);
        localStorage.setItem('ts_profile', JSON.stringify(data));
      } else {
        console.warn("App: No profile record found for user", userId);
      }
    } catch (e) {
      console.error("App: Profile catch", e);
    }
  }, []);

  useEffect(() => {
    const initApp = async () => {
      console.log("App: Starting initialization...");
      
      // Set a 6-second timeout to break infinite loading
      watchdogRef.current = window.setTimeout(() => {
        if (initializing) {
          console.error("App: Initialization timed out after 6s");
          setInitError("The server is taking too long to respond. Please check your internet connection or database status.");
          setInitializing(false);
        }
      }, 6000);

      try {
        console.log("App: Auth check...");
        const { data: { session: s }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        setSession(s);
        if (s) {
          await fetchProfile(s.user.id);
        }
        console.log("App: Initialization success");
      } catch (err: any) {
        console.error("App: Initialization failed", err);
        setInitError(err.message || "Connection to Supabase failed.");
      } finally {
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
        setInitializing(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log("App: Auth event", event);
      setSession(s);
      if (s) {
        fetchProfile(s.user.id);
      } else {
        setProfile(null);
        setCachedPosts([]);
        localStorage.removeItem('ts_profile');
      }
    });

    return () => {
        if (watchdogRef.current) clearTimeout(watchdogRef.current);
        subscription.unsubscribe();
    };
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
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/5 border-t-white rounded-full mb-6"
        />
        <div className="flex flex-col items-center gap-1">
            <p className="text-white text-[10px] uppercase tracking-[0.4em] font-bold">Initializing</p>
            <p className="text-white/20 text-[8px] uppercase tracking-widest">Secure Connection</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-zinc-900 border border-white/5 p-10 rounded-[32px] max-w-sm shadow-2xl">
          <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-white font-bold mb-3 text-lg uppercase tracking-tight">System Error</h2>
          <p className="text-white/40 text-sm mb-8 leading-relaxed">{initError}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-white text-black py-4 rounded-2xl font-bold text-sm hover:bg-zinc-200 transition-all active:scale-95"
          >
            Retry Connection
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
