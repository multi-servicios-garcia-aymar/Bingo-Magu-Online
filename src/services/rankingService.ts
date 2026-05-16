import { supabase } from '../lib/supabase';
import { GameMode } from '../types';

export interface RankingEntry {
  user_id: string;
  user_name: string;
  wins: number;
  last_win: string;
}

export const RankingService = {
  async getTopWinners(mode: GameMode = 'global', limit = 10) {
    let query = supabase
      .from('game_sessions')
      .select('winner_id, winner:profiles(username, email)')
      .eq('status', 'finished')
      .eq('type', mode)
      .not('winner_id', 'is', null);

    const { data, error } = await query;

    // Aggregate wins
    const stats: Record<string, { name: string; wins: number; last: string }> = {};
    
    (data || []).forEach((row: any) => {
      const id = row.winner_id;
      const name = row.winner?.username || row.winner?.email?.split('@')[0] || 'Jugador Anónimo';
      if (!stats[id]) stats[id] = { name, wins: 0, last: '' };
      stats[id].wins++;
    });

    const result = Object.entries(stats)
      .map(([id, s]) => ({
        user_id: id,
        user_name: s.name,
        wins: s.wins,
        last_win: s.last
      }))
      .sort((a, b) => b.wins - a.wins)
      .slice(0, limit);

    return { data: result, error: null };
  },

  async getUserStats(userId: string) {
    const { count: wins } = await supabase
      .from('game_sessions')
      .select('id', { count: 'exact', head: true })
      .eq('winner_id', userId);
      
    const { count: total } = await supabase
      .from('participants')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    return {
      wins: wins || 0,
      total: total || 0,
      winRate: total ? Math.round(((wins || 0) / (total || 1)) * 100) : 0
    };
  }
};
