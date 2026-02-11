
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { Message, Profile } from '../types';
import { Send, Search, ChevronLeft } from 'lucide-react';

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
    if (initialTargetId) {
      fetchTargetProfile(initialTargetId);
    }
  }, [initialTargetId]);

  useEffect(() => {
    if (selectedChat && currentUser) {
      fetchMessages();
      
      const subscription = supabase
        .channel(`chat-${selectedChat.id}`)
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `receiver_id=eq.${currentUser.id}`
        }, (payload) => {
            const msg = payload.new as Message;
            if (msg.sender_id === selectedChat.id) {
                setMessages(prev => [...prev, msg]);
            }
        })
        .subscribe();
      
      return () => { subscription.unsubscribe(); };
    }
  }, [selectedChat, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchTargetProfile = async (id: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (data) {
        setSelectedChat(data);
        // Add to sidebar temporarily if not there
        setChats(prev => {
            if (prev.find(c => c.id === data.id)) return prev;
            return [data, ...prev];
        });
    }
  };

  const fetchChats = async () => {
    if (!currentUser) return;
    
    // Get unique people we've interacted with
    const { data: sent } = await supabase.from('messages').select('receiver_id').eq('sender_id', currentUser.id);
    const { data: received } = await supabase.from('messages').select('sender_id').eq('receiver_id', currentUser.id);
    
    const userIds = Array.from(new Set([
        ...(sent?.map(m => m.receiver_id) || []),
        ...(received?.map(m => m.sender_id) || [])
    ]));

    if (userIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
        if (profiles) setChats(profiles);
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat || !currentUser) return;
    const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedChat.id}),and(sender_id.eq.${selectedChat.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true });
    
    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    const tempMsg: Message = {
        id: Math.random().toString(),
        sender_id: currentUser.id,
        receiver_id: selectedChat.id,
        content: newMessage,
        created_at: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempMsg]);
    const messageToSend = newMessage;
    setNewMessage('');

    const { error } = await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedChat.id,
        content: messageToSend
    });

    if (error) {
        console.error("Failed to send:", error);
        // Could handle error state here
    }
  };

  const filteredChats = chats.filter(c => 
    (c.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-64px)] md:h-screen overflow-hidden bg-black">
      {/* Sidebar */}
      <div className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col border-r border-white/10`}>
        <div className="p-4 border-b border-white/10 bg-black/50 backdrop-blur-md">
          <h2 className="text-xl font-bold tracking-tighter mb-4">Messages</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
            <input 
              placeholder="Search conversations"
              className="w-full bg-zinc-900/50 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-white/20 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-1 p-2">
          {filteredChats.map(chat => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`w-full p-3 flex gap-3 rounded-xl transition-all ${selectedChat?.id === chat.id ? 'bg-white text-black' : 'hover:bg-white/5 text-white'}`}
            >
              <img 
                src={chat.avatar_url || `https://picsum.photos/seed/${chat.id}/100/100`} 
                className={`w-12 h-12 rounded-full object-cover border ${selectedChat?.id === chat.id ? 'border-black/10' : 'border-white/10'}`}
                alt="Chat"
              />
              <div className="text-left overflow-hidden flex-1">
                <div className="flex justify-between items-center">
                    <p className="font-bold truncate text-sm">{chat.display_name || chat.username}</p>
                </div>
                <p className={`text-xs truncate ${selectedChat?.id === chat.id ? 'text-black/60' : 'text-zinc-500'}`}>@{chat.username}</p>
              </div>
            </button>
          ))}
          {filteredChats.length === 0 && (
            <div className="p-8 text-center">
                <p className="text-zinc-500 text-sm">No chats found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${!selectedChat ? 'hidden md:flex' : 'flex'} flex-1 flex-col h-full bg-black relative`}>
        {selectedChat ? (
          <>
            <div className="p-4 border-b border-white/10 flex items-center gap-4 bg-black/50 backdrop-blur-md sticky top-0 z-10">
                <button onClick={() => setSelectedChat(null)} className="md:hidden text-zinc-500 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <img 
                    src={selectedChat.avatar_url || `https://picsum.photos/seed/${selectedChat.id}/100/100`} 
                    className="w-10 h-10 rounded-full object-cover border border-white/10"
                    alt="Chat"
                />
                <div className="flex-1">
                    <p className="font-bold text-sm leading-tight">{selectedChat.display_name || selectedChat.username}</p>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Active now</p>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id === currentUser?.id;
                const prevMsg = messages[idx - 1];
                const showAvatar = !isMe && (!prevMsg || prevMsg.sender_id !== msg.sender_id);
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                    {!isMe && (
                        <div className="w-8 h-8">
                            {showAvatar && (
                                <img 
                                    src={selectedChat.avatar_url || `https://picsum.photos/seed/${selectedChat.id}/100/100`} 
                                    className="w-8 h-8 rounded-full object-cover border border-white/10"
                                />
                            )}
                        </div>
                    )}
                    <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${isMe ? 'bg-white text-black rounded-br-none' : 'bg-zinc-900 text-white rounded-bl-none'}`}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`text-[9px] mt-1 font-medium uppercase tracking-tighter opacity-40 ${isMe ? 'text-black text-right' : 'text-white'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-4 bg-black">
              <div className="flex gap-2 items-center bg-zinc-900/50 border border-white/5 rounded-2xl p-2 pl-4 focus-within:border-white/20 transition-all">
                <input
                    placeholder="Type a message..."
                    className="flex-1 bg-transparent py-2 text-sm focus:outline-none"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button 
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="p-2 bg-white text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:scale-100"
                >
                    <Send size={18} />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                <Send className="text-zinc-600" size={32} />
            </div>
            <h3 className="text-2xl font-bold tracking-tighter mb-2">Direct Messages</h3>
            <p className="text-zinc-500 max-w-xs text-sm leading-relaxed">
              Send private photos and messages to a friend. Start by selecting a conversation from the sidebar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
