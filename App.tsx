
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
  
  const [targetProfileId, setTargetProfileId] = useState<string | null>(null);
  const [targetChatId, setTargetChatId] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
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
        const { data: { session: s } } = await supabase.auth.getSession();
        setSession(s);
        if (s) await fetchProfile(s.user.id);
      } catch (err) {
        console.error("Initialization failed:", err);
      } finally {
        setInitializing(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) fetchProfile(s.user.id);
      else {
        setProfile(null);
        setCachedPosts([]);
        localStorage.removeItem('ts_profile');
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const handleLogout = async () => {
    localStorage.clear();
    await supabase.auth.signOut();
    window.location.reload();
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }} 
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full mb-4"
        />
        <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Initializing</p>
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
