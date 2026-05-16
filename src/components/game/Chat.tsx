import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useChat } from '../../hooks/useChat';

interface ChatProps {
  gameId: string;
  userId: string;
  userName: string;
}

export default function Chat({ gameId, userId, userName }: ChatProps) {
  const { messages, sendMessage } = useChat(gameId);
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendMessage(userId, userName, inputValue);
    setInputValue('');
  };

  return (
    <div className="fixed bottom-20 right-4 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-72 sm:w-80 h-96 flex flex-col mb-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-blue-600 p-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase italic tracking-tighter">Chat de Sala</h3>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                  <MessageSquare className="w-8 h-8 mb-2" />
                  <p className="text-[10px] font-bold uppercase italic">¡Sé el primero en saludar!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${msg.user_id === userId ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[8px] font-black text-slate-400 uppercase italic mb-0.5 px-1">
                      {msg.user_id === userId ? 'Tú' : msg.user_name}
                    </span>
                    <div className={`
                      max-w-[85%] px-3 py-1.5 rounded-2xl text-[11px] font-medium shadow-sm
                      ${msg.user_id === userId 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'}
                    `}>
                      {msg.message}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Escribe algo..."
                className="flex-1 bg-slate-50 border-none rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
              <button 
                type="submit"
                className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-100"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl transition-all
          ${isOpen ? 'bg-slate-800 text-white' : 'bg-white text-blue-600 border border-blue-50'}
        `}
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-xs font-black uppercase italic tracking-tighter">
          {isOpen ? 'Cerrar Chat' : 'Chat'}
        </span>
        {!isOpen && messages.length > 0 && (
          <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-bounce">
            {messages.length}
          </span>
        )}
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </motion.button>
    </div>
  );
}
