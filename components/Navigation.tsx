
import React, { useState } from 'react';
import { Profile, ViewState } from '../types';
import { Home, Search, MessageSquare, User, LogOut, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  currentView: ViewState;
  setView: (v: ViewState) => void;
  profile: Profile | null;
  onLogout: () => void;
}

export const Navigation: React.FC<Props> = ({ currentView, setView, profile, onLogout }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const navItems = [
    { id: 'feed', icon: Home, label: 'Feed' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'messages', icon: MessageSquare, label: 'Messages' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  const getAvatar = (url: string | null | undefined, username: string | undefined) => {
    if (url && url.length > 20) return url;
    return `https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'default'}`;
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-white/10 md:relative md:border-t-0 md:bg-transparent md:w-20 lg:w-64 md:flex md:flex-col p-2 md:p-6 md:h-screen">
        <div className="hidden md:flex items-center gap-2 px-2 mb-10 group cursor-default">
          <motion.div 
            whileHover={{ rotate: 180 }}
            className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
              <span className="text-black font-black text-xl">T</span>
          </motion.div>
          <span className="text-2xl font-black tracking-tighter hidden lg:block group-hover:tracking-normal transition-all duration-300">TrueShare</span>
        </div>

        <div className="flex md:flex-col items-center md:items-stretch justify-around md:justify-start gap-1 md:gap-4 h-full">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView(item.id as ViewState)}
              className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-white text-black shadow-lg shadow-white/5' 
                  : 'text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={24} strokeWidth={currentView === item.id ? 2.5 : 2} />
              <span className="hidden lg:block font-bold">{item.label}</span>
            </motion.button>
          ))}
          
          <div className="md:mt-auto flex md:flex-col gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-4 p-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/5 transition-all duration-200"
              >
                <LogOut size={24} />
                <span className="hidden lg:block font-medium">Logout</span>
              </motion.button>
              
              {profile && (
                  <motion.div 
                    whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="hidden lg:flex items-center gap-3 p-3 mt-4 border-t border-white/10 cursor-pointer rounded-xl transition-colors" 
                    onClick={() => setView('profile')}
                  >
                      <img 
                          src={getAvatar(profile.avatar_url, profile.username)} 
                          className="w-10 h-10 rounded-full object-cover border border-white/20 shadow-sm bg-zinc-900"
                          alt="Avatar"
                      />
                      <div className="overflow-hidden">
                          <p className="font-bold truncate text-sm">{profile.display_name || profile.username}</p>
                          <p className="text-xs text-zinc-500 truncate">@{profile.username}</p>
                      </div>
                  </motion.div>
              )}
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-zinc-950 border border-white/10 p-8 rounded-2xl shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 uppercase tracking-tight">Log out?</h3>
              <p className="text-zinc-500 mb-8 text-sm">You'll need to sign back in to access your feed.</p>
              <div className="flex flex-col gap-3">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onLogout}
                  className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors"
                >
                  Log Out
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full bg-transparent text-white font-medium py-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
