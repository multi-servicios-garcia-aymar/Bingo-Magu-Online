import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { GameSession, GameParticipant, GameMode } from '../types';
import { GameService } from '../services/gameService';

export function useGame(mode: GameMode | null = 'global', userId?: string) {
  const [game, setGame] = useState<GameSession | null>(null);
  const [participants, setParticipants] = useState<GameParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isFetchingBus = useRef(false);
  const finishedTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSession = useCallback(async (isInitial = false) => {
    if (isFetchingBus.current) return;
    
    // If lobby mode (null), we default to global for background stats
    const queryMode = mode || 'global';
    isFetchingBus.current = true;
    if (isInitial) setLoading(true);
    setIsRefreshing(true);
    
    try {
      const session = await GameService.getActiveSession(queryMode, userId);
      setGame(session);
      if (session) {
        const { data, error: partError } = await supabase
          .from('participants')
          .select('*')
          .eq('game_id', session.id)
          .order('joined_at', { ascending: false });
        
        if (partError) throw partError;
        setParticipants(data || []);
      } else {
        setParticipants([]);
      }
      setError(null);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Error de conexión con la base de datos');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
      isFetchingBus.current = false;
    }
  }, [mode, userId]);

  useEffect(() => {
    fetchSession(true);

    // Automatic refresh on visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchSession(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const queryMode = mode || 'global';
    // Use the effective mode for both channel name and filter
    // If mode is null, we are in lobby but watching global sessions
    const channelName = `game_${queryMode}_${userId || 'global'}`;
    const filter = (mode === 'global' || mode === null) 
      ? 'type=eq.global' 
      : (userId ? `creator_id=eq.${userId}` : 'type=eq.personal');

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'game_sessions',
        filter: filter
      }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setGame(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          if (payload.new.status === 'finished') {
             setGame(payload.new); // Show finished state immediately
             
             // If the active game finished, clear it after a short delay
             // to allow the UI to show winners
             if (finishedTimeoutRef.current) clearTimeout(finishedTimeoutRef.current);
             finishedTimeoutRef.current = setTimeout(() => {
               setGame(null);
               finishedTimeoutRef.current = null;
             }, 10000); // 10 seconds to allow checking results
          } else {
            if (finishedTimeoutRef.current) {
              clearTimeout(finishedTimeoutRef.current);
              finishedTimeoutRef.current = null;
            }
            setGame(payload.new);
          }
        } else if (payload.eventType === 'DELETE') {
          setGame(null);
        }
      })
      .subscribe();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      supabase.removeChannel(channel);
      if (finishedTimeoutRef.current) clearTimeout(finishedTimeoutRef.current);
    };
  }, [fetchSession, mode, userId]);

  // Separate effect for participant updates to ensure it only listens to THE current game
  useEffect(() => {
    if (!game?.id) return;

    const partChannel = supabase
      .channel(`parts_${game.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'participants',
        filter: `game_id=eq.${game.id}`
      }, () => {
        // Only re-fetch participants for THIS game
        const fetchParticipants = async () => {
          const { data } = await supabase
            .from('participants')
            .select('*')
            .eq('game_id', game.id)
            .order('joined_at', { ascending: false });
          setParticipants(data || []);
        };
        fetchParticipants();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(partChannel);
    };
  }, [game?.id]);

  return { 
    game, 
    participants, 
    participantsCount: participants.length, 
    uniqueParticipantsCount: new Set(participants.map(p => p.user_id)).size,
    loading, 
    isRefreshing,
    refresh: () => fetchSession(false), 
    setGame, 
    error 
  };
}
