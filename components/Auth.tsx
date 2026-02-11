
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'framer-motion';

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to pre-fill the requested email for "tester" context
  useEffect(() => {
    if (username.toLowerCase() === 'tester') {
      setEmail('yura33t@gmail.com');
    }
  }, [username]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        
        if (signInError) throw signInError;
      } else {
        const cleanUsername = username.trim().toLowerCase();
        
        if (cleanUsername.length < 4) {
          throw new Error('Username must be at least 4 characters.');
        }

        if (!email.trim() || !email.includes('@')) {
          throw new Error('Please enter a valid email address.');
        }

        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { 
              username: cleanUsername,
              display_name: username.trim()
            }
          }
        });

        if (signUpError) throw signUpError;
        
        alert('Registration successful! Please check your email for confirmation.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md bg-zinc-950 border border-white/10 p-8 rounded-2xl shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-white/5 blur-3xl rounded-full" />
        
        <div className="text-center mb-8 relative z-10">
          <h1 className="text-4xl font-bold tracking-tighter mb-2">TrueShare</h1>
          <p className="text-zinc-500 text-sm">
            {isLogin ? 'Log in to your account.' : 'Join the community.'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5 relative z-10">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 ml-1 font-bold">Username</label>
                <input
                  type="text"
                  placeholder="tester"
                  className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-all duration-300 placeholder:text-zinc-800"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                  required={!isLogin}
                  autoComplete="username"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 ml-1 font-bold">Email</label>
            <input
              type="email"
              placeholder="yura33t@gmail.com"
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-all duration-300 placeholder:text-zinc-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2 ml-1 font-bold">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white transition-all duration-300 placeholder:text-zinc-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-red-500/10 border border-red-500/20 text-red-500 text-xs p-3 rounded-lg text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-2 shadow-lg shadow-white/5"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (isLogin ? 'Log In' : 'Sign Up')}
          </motion.button>
        </form>

        <div className="mt-8 text-center relative z-10">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-zinc-500 hover:text-white transition-colors uppercase tracking-widest font-bold"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Log In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
