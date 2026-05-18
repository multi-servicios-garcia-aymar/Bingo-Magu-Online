import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, X, ChevronUp, ChevronDown, Smile, Bell } from 'lucide-react';
import { useChat } from '../../hooks/useChat';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ChatProps {
  gameId: string;
  userId: string;
  userName: string;
}

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '👏', '🎱', '🍀'];

const getUserColor = (userId: string) => {
  const colors = [
    'text-red-500 bg-red-50',
    'text-blue-500 bg-blue-50',
    'text-green-500 bg-green-50',
    'text-purple-500 bg-purple-50',
    'text-orange-500 bg-orange-50',
    'text-pink-500 bg-pink-50',
    'text-teal-500 bg-teal-50',
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export default function Chat({ gameId, userId, userName }: ChatProps) {
  const { messages, sendMessage } = useChat(gameId);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showEmojis, setShowEmojis] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen && messages.length > 0) {
      setUnreadCount(prev => prev + 1);
    } else if (isOpen) {
      setUnreadCount(0);
    }
  }, [messages.length, isOpen]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(userId, userName, inputValue);
    setInputValue('');
    setShowEmojis(false);
  };

  const sendEmoji = (emoji: string) => {
    sendMessage(userId, userName, emoji, 'reaction');
    setShowEmojis(false);
  };

  const renderMessage = (msg: any) => {
    const isMe = msg.user_id === userId;
    const isSystem = msg.type === 'system';
    const isReaction = msg.type === 'reaction';
    let timeStr = '';
    try {
      const date = new Date(msg.created_at || Date.now());
      timeStr = !isNaN(date.getTime()) ? format(date, 'HH:mm', { locale: es }) : '';
    } catch (e) {
      timeStr = '';
    }

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center my-2">
          <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[9px] font-black uppercase italic border border-amber-100 flex items-center gap-2">
            <Bell className="w-3 h-3" />
            {msg.message}
          </div>
        </div>
      );
    }

    return (
      <div 
        key={msg.id} 
        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
      >
        {!isMe && (
          <span className={`text-[8px] font-black uppercase italic mb-0.5 px-1 rounded ${getUserColor(msg.user_id)}`}>
            {msg.user_name}
          </span>
        )}
        <div className="flex items-end gap-1 max-w-[90%]">
          {isMe && <span className="text-[7px] text-slate-400 font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{timeStr}</span>}
          <div className={`
            px-3 py-1.5 rounded-2xl shadow-sm relative
            ${isReaction ? 'text-3xl p-0 shadow-none bg-transparent' : 'text-[11px] font-medium'}
            ${isMe && !isReaction
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : !isMe && !isReaction ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-none' : ''}
          `}>
            {msg.message}
          </div>
          {!isMe && <span className="text-[7px] text-slate-400 font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity">{timeStr}</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-20 right-4 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-72 sm:w-80 h-96 flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 p-3 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-1 rounded-lg">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-[10px] font-black uppercase italic tracking-tighter">Chat en vivo</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors"
                id="close-chat-btn"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50 custom-scrollbar"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <MessageSquare className="w-8 h-8 mb-2" />
                  </motion.div>
                  <p className="text-[10px] font-black uppercase italic">¡El chat está vacío!</p>
                </div>
              ) : (
                messages.map(renderMessage)
              )}
            </div>

            {/* Emoji Picker */}
            <AnimatePresence>
              {showEmojis && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="p-2 bg-white border-t border-slate-100 grid grid-cols-8 gap-1"
                >
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => sendEmoji(emoji)}
                      className="hover:bg-slate-100 p-1 rounded-lg text-lg transition-all active:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-3 bg-white border-t border-slate-100 shrink-0">
              <form onSubmit={handleSend} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`p-2 rounded-xl transition-all ${showEmojis ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  <Smile className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-slate-100 border-none rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                />
                <button 
                  type="submit"
                  disabled={!inputValue.trim()}
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-100 disabled:opacity-50 disabled:grayscale"
                  id="send-chat-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl transition-all border relative
          ${isOpen ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-blue-50 text-blue-600'}
        `}
        id="toggle-chat-btn"
      >
        <div className="relative">
          <MessageSquare className="w-5 h-5" />
          {!isOpen && unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full animate-pulse border-2 border-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        <span className="text-xs font-black uppercase italic tracking-tighter">
          {isOpen ? 'Cerrar Chat' : 'Chat en vivo'}
        </span>
        {isOpen ? <ChevronDown className="w-4 h-4 opacity-50" /> : <ChevronUp className="w-4 h-4 opacity-50" />}
      </motion.button>
    </div>
  );
}

