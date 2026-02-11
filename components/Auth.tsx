
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        if (!email.trim() || !email.includes('@')) {
          throw new Error('Введите корректный email.');
        }
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        if (signInError) throw signInError;
      } else {
        const cleanUsername = username.trim().toLowerCase();
        if (cleanUsername.length < 3) {
          throw new Error('Имя пользователя слишком короткое.');
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
        alert('Регистрация успешна! Подтвердите email, если это требуется.');
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
        className="w-full max-w-md bg-zinc-950 border border-white/10 p-8 rounded-3xl shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic">TrueShare</h1>
          <p className="text-zinc-500 text-sm font-medium uppercase tracking-widest">
            {isLogin ? 'С возвращением' : 'Создайте аккаунт'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <input
                  type="text"
                  placeholder="Имя пользователя"
                  className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-700"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <input
            type="email"
            placeholder="Email"
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-700"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <input
            type="password"
            placeholder="Пароль"
            className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-white/30 transition-all placeholder:text-zinc-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="text-red-500 text-xs text-center font-bold uppercase tracking-tight">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 uppercase text-xs tracking-widest"
          >
            {loading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] text-zinc-600 hover:text-white transition-colors uppercase tracking-[0.2em] font-bold"
          >
            {isLogin ? "Нет аккаунта? Регистрация" : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
