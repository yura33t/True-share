
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Message, Profile } from '../types';
// Added MessageSquare to imports
import { Send, Search, ChevronLeft, MessageSquare } from 'lucide-react';

interface Props {
  currentUser: Profile | null;
  initialTargetId: string | null;
}

export const MessagesView: React.FC<Props> = ({ currentUser, initialTargetId }) => {
  const [chats, setChats] = useState<Profile[]>([]);
  const [selectedChat, setSelectedChat] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchChats();
    if (initialTargetId) fetchTargetProfile(initialTargetId);
  }, [initialTargetId]);

  useEffect(() => {
    if (selectedChat && currentUser) {
      fetchMessages();
      const channel = supabase.channel(`chat-${selectedChat.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
          const msg = payload.new as Message;
          if (msg.sender_id === selectedChat.id || msg.receiver_id === selectedChat.id) {
              setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg]);
          }
      }).subscribe();
      return () => { channel.unsubscribe(); };
    }
  }, [selectedChat, currentUser]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchTargetProfile = async (id: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) {
        setSelectedChat(data);
        setChats(prev => prev.find(c => c.id === data.id) ? prev : [data, ...prev]);
    }
  };

  const fetchChats = async () => {
    if (!currentUser) return;
    const { data: sent } = await supabase.from('messages').select('receiver_id').eq('sender_id', currentUser.id);
    const { data: recv } = await supabase.from('messages').select('sender_id').eq('receiver_id', currentUser.id);
    const ids = Array.from(new Set([...(sent?.map(m => m.receiver_id) || []), ...(recv?.map(m => m.sender_id) || [])]));
    if (ids.length) {
        const { data } = await supabase.from('profiles').select('*').in('id', ids);
        if (data) setChats(data);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat || !currentUser) return;
    const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser) return;
    const msgText = newMessage.trim();
    setNewMessage('');
    const { data, error } = await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: selectedChat.id, content: msgText }).select().single();
    if (data) setMessages(prev => [...prev, data]);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen bg-black">
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-white/5`}>
        <div className="p-6 border-b border-white/5">
          <h2 className="text-xl font-black italic tracking-tighter mb-4">Сообщения</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-700" size={14} />
            <input placeholder="Поиск чатов" className="w-full bg-zinc-950 border border-white/5 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-white/20 transition-all" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.map(chat => (
            <button key={chat.id} onClick={() => setSelectedChat(chat)} className={`w-full p-4 flex gap-4 rounded-2xl transition-all ${selectedChat?.id === chat.id ? 'bg-white text-black' : 'hover:bg-white/5 text-white'}`}>
              <img src={chat.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.username}`} className="w-11 h-11 rounded-full object-cover" alt="" />
              <div className="text-left truncate flex-1">
                <p className="font-bold text-sm truncate">{chat.display_name || chat.username}</p>
                <p className={`text-[10px] font-medium uppercase tracking-widest opacity-40 mt-0.5`}>Написать...</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full relative`}>
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-black/80 backdrop-blur-xl sticky top-0 z-10">
                <button onClick={() => setSelectedChat(null)} className="md:hidden text-zinc-500"><ChevronLeft size={24} /></button>
                <img src={selectedChat.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.username}`} className="w-10 h-10 rounded-full" alt="" />
                <p className="font-black text-sm italic">{selectedChat.display_name || selectedChat.username}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] px-4 py-3 rounded-2xl ${msg.sender_id === currentUser?.id ? 'bg-white text-black rounded-tr-none' : 'bg-zinc-900 text-white rounded-tl-none border border-white/5'}`}>
                    <p className="text-[15px] font-medium leading-normal">{msg.content}</p>
                    <p className="text-[9px] mt-1 opacity-40 text-right uppercase font-bold tracking-tighter">
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-6">
              <div className="flex gap-2 bg-zinc-950 border border-white/10 rounded-2xl p-2 pl-5 focus-within:border-white/30 transition-all">
                <input placeholder="Ваше сообщение..." className="flex-1 bg-transparent py-2 text-sm outline-none" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} />
                <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-30"><Send size={16} /></button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="w-20 h-20 bg-zinc-950 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
                <MessageSquare className="text-zinc-800" size={32} />
            </div>
            <h3 className="text-2xl font-black italic tracking-tighter mb-2">Ваши диалоги</h3>
            <p className="text-zinc-600 max-w-xs text-xs font-bold uppercase tracking-widest leading-loose">Выберите чат слева, чтобы начать общение.</p>
          </div>
        )}
      </div>
    </div>
  );
};
