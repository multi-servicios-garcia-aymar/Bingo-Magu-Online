import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ChatMessage } from '../types';

export function useChat(gameId: string | undefined, subscribe = true) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) return;

    let isMounted = true;

    // Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('game_chat')
        .select('*')
        .eq('game_id', gameId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (isMounted) {
        if (!error && data) {
          setMessages(data);
        }
        setLoading(false);
      }
    };

    fetchMessages();

    if (!subscribe) return;

    // Subscribe to new messages - use a unique ID to avoid channel reuse issues
    const channelId = `chat:${gameId}:${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(channelId);
    
    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_chat',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          if (isMounted) {
            setMessages((prev) => {
              if (prev.find(m => m.id === (payload.new as ChatMessage).id)) return prev;
              return [...prev, payload.new as ChatMessage];
            });
          }
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.warn(`Chat subscription status for ${gameId}:`, status);
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [gameId, subscribe]);

  const sendMessage = async (userId: string, userName: string, message: string, type: 'text' | 'system' | 'reaction' = 'text', metadata: any = null) => {
    if (!gameId || !message.trim()) return;

    const basePayload = {
      game_id: gameId,
      user_id: userId,
      user_name: userName,
      message: message.trim(),
    };

    // Try full payload first
    const { error } = await supabase.from('game_chat').insert({
      ...basePayload,
      type: type,
      metadata: metadata,
    });

    if (error) {
      // If it fails (likely due to missing columns), try basic payload
      console.warn('Full chat insert failed, falling back to basic fields. Error:', error);
      const { error: basicError } = await supabase.from('game_chat').insert(basePayload);
      if (basicError) {
        console.error('Error sending basic message:', basicError);
      }
    }
  };

  return { messages, sendMessage, loading };
}

export function useChatSender(gameId: string | undefined) {
  const sendMessage = async (userId: string, userName: string, message: string, type: 'text' | 'system' | 'reaction' = 'text', metadata: any = null) => {
    if (!gameId || !message.trim()) return;

    const basePayload = {
      game_id: gameId,
      user_id: userId,
      user_name: userName,
      message: message.trim(),
    };

    const { error } = await supabase.from('game_chat').insert({
      ...basePayload,
      type: type,
      metadata: metadata,
    });

    if (error) {
      const { error: basicError } = await supabase.from('game_chat').insert(basePayload);
      if (basicError) console.error('Error sending basic message:', basicError);
    }
  };

  return { sendMessage };
}
