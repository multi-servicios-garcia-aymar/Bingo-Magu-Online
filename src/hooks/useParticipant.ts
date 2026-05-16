import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { GameParticipant } from '../types';
import { GameService } from '../services/gameService';

export function useParticipant(gameId: string | undefined, userId: string | undefined) {
  const [participants, setParticipants] = useState<GameParticipant[]>([]);

  useEffect(() => {
    if (participants.length > 0 && userId && gameId) {
      localStorage.setItem(`bingo_marks_${userId}_${gameId}`, JSON.stringify(participants));
    }
  }, [participants, userId, gameId]);

  useEffect(() => {
    if (!gameId || !userId) {
      setParticipants([]);
      return;
    }

    const fetchParticipants = async () => {
      // 1. Try Loading from LocalStorage first for instant recovery
      const localCache = localStorage.getItem(`bingo_marks_${userId}_${gameId}`);
      if (localCache) {
        try {
          const cached = JSON.parse(localCache);
          setParticipants(cached);
        } catch (e) {
          console.error('Error parsing local marks cache', e);
        }
      }

      const { data } = await supabase
        .from('participants')
        .select('*')
        .eq('game_id', gameId)
        .eq('user_id', userId)
        .order('joined_at', { ascending: true });
      
      if (data) {
        setParticipants(data);
        localStorage.setItem(`bingo_marks_${userId}_${gameId}`, JSON.stringify(data));
      }
    };

    fetchParticipants();
    
    // Automatic refresh on visibility change (recovering from screen lock)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchParticipants();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const channel = supabase
      .channel(`participants_${userId}_${gameId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'participants',
        filter: `user_id=eq.${userId}` 
      }, payload => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.game_id === gameId) {
            setParticipants(prev => [...prev, payload.new as GameParticipant]);
          }
        } else if (payload.eventType === 'UPDATE') {
          setParticipants(prev => prev.map(p => p.id === payload.new.id ? payload.new as GameParticipant : p));
        } else if (payload.eventType === 'DELETE') {
          setParticipants(prev => prev.filter(p => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [gameId, userId]);

  const register = async (gameId: string, userId: string, userName: string, ballLimit: number) => {
    const { data, error } = await GameService.registerParticipant(gameId, userId, userName, ballLimit);
    if (error) throw error;
    return data;
  };

  const updateMarks = async (participantId: string, marks: string[]) => {
    const { error } = await supabase
      .from('participants')
      .update({ marked_keys: marks })
      .eq('id', participantId);
    if (error) console.error('Error saving marks:', error);
  };

  return { participants, setParticipants, register, updateMarks };
}
