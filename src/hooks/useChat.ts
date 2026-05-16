import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';

export function useChat(gameId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('game_chat')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (!error && data) {
        setMessages(data);
      }
      setLoading(false);
    };

    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`game_chat:${gameId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_chat',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  const sendMessage = async (userId: string, userName: string, message: string) => {
    if (!gameId || !message.trim()) return;

    const { error } = await supabase.from('game_chat').insert({
      game_id: gameId,
      user_id: userId,
      user_name: userName,
      message: message.trim(),
    });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  return { messages, sendMessage, loading };
}
