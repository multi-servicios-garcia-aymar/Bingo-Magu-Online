import { supabase } from '../lib/supabase';
import { GameSession, GameParticipant, GameMode } from '../types';
import { BINGO_CONFIG } from '../constants/bingo';
import { checkPattern } from '../lib/bingoRules';
import { withRetry } from '../lib/retry';

export const generateEnterpriseCard = (ballLimit: 75 | 100 = 75): number[][] => {
  const card: number[][] = Array(BINGO_CONFIG.GRID_SIZE)
    .fill(0)
    .map(() => Array(BINGO_CONFIG.GRID_SIZE).fill(0));

  const ranges = ballLimit === 100 ? BINGO_CONFIG.RANGES_100 : BINGO_CONFIG.RANGES;

  BINGO_CONFIG.COLUMNS.forEach((colName, colIdx) => {
    const [min, max] = ranges[colName];
    const available = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    
    for (let rowIdx = 0; rowIdx < BINGO_CONFIG.GRID_SIZE; rowIdx++) {
      if (colIdx === BINGO_CONFIG.CENTER_INDEX && rowIdx === BINGO_CONFIG.CENTER_INDEX) {
        card[rowIdx][colIdx] = 0; // FREE SPACE
        continue;
      }
      const randIdx = Math.floor(Math.random() * available.length);
      card[rowIdx][colIdx] = available.splice(randIdx, 1)[0];
    }
  });

  return card;
};

export const GameService = {
  async getActiveSession(type: GameMode = 'global', creatorId?: string) {
    let query = supabase
      .from('game_sessions')
      .select('*')
      .eq('type', type)
      .neq('status', 'finished')
      .order('created_at', { ascending: false });

    if (type === 'personal' && creatorId) {
      query = query.eq('creator_id', creatorId);
    }

    const { data } = await query.limit(1).maybeSingle();
    return data as GameSession | null;
  },

  async createSession(config: { ball_limit: number; winning_pattern: string; type?: GameMode; creator_id?: string }) {
    return supabase.from('game_sessions').insert({ 
      status: 'waiting',
      type: config.type || 'global',
      creator_id: config.creator_id || null,
      ball_limit: config.ball_limit,
      winning_pattern: config.winning_pattern,
      drawn_numbers: [],
      is_paused: false,
      last_ball_at: new Date().toISOString()
    }).select().single();
  },

  async startSession(sessionId: string) {
    return supabase.from('game_sessions').update({ 
      status: 'playing', 
      is_paused: false,
      last_ball_at: new Date().toISOString()
    }).eq('id', sessionId);
  },

  async togglePause(sessionId: string, isPaused: boolean) {
    return supabase.from('game_sessions').update({ 
      is_paused: isPaused,
      last_ball_at: new Date().toISOString() // Reset timer on resume
    }).eq('id', sessionId);
  },

  async finishSession(sessionId: string) {
    return supabase.from('game_sessions').update({ status: 'finished' }).eq('id', sessionId);
  },

  async drawBall(game: GameSession) {
    return withRetry(async () => {
      const { data, error } = await supabase.rpc('draw_next_bingo_number', {
        target_game_id: game.id,
        draw_interval_seconds: 30
      });
      
      if (error) throw error;
      if (data && !data.success) {
        throw new Error(data.error || 'No se pudo realizar el sorteo.');
      }
      return data;
    });
  },

  async updateMarks(participantId: string, marks: string[]) {
    return supabase.from('participants').update({ marked_keys: marks }).eq('id', participantId);
  },

  async registerParticipant(gameId: string, userId: string, userName: string, ballLimit: number = 75) {
    // Fetch existing cards to ensure uniqueness
    const { data: existing } = await supabase
      .from('participants')
      .select('card_data')
      .eq('game_id', gameId);

    const existingStrings = new Set((existing || []).map(p => JSON.stringify(p.card_data)));
    
    let card = generateEnterpriseCard(ballLimit as any);
    let attempts = 0;
    while (existingStrings.has(JSON.stringify(card)) && attempts < 10) {
      card = generateEnterpriseCard(ballLimit as any);
      attempts++;
    }

    return supabase.from('participants').insert({
      game_id: gameId,
      user_id: userId,
      user_name: userName,
      card_data: card
    }).select().single();
  },

  async claimBingo(participantId: string, gameId: string) {
    // 1. Get participant and game
    const partRes = await withRetry(async () => {
      const res = await supabase.from('participants').select('*').eq('id', participantId).single();
      return res;
    });
    
    const gameRes = await withRetry(async () => {
      const res = await supabase.from('game_sessions').select('*').eq('id', gameId).single();
      return res;
    });

    const part = partRes.data;
    const game = gameRes.data;

    if (!part || !game) return;

    // 2. Validate pattern using separate rule engine
    const isWin = checkPattern(part.card_data, game.drawn_numbers, game.winning_pattern);

    if (isWin) {
      await withRetry(async () => {
        return await supabase.from('participants').update({ has_won: true }).eq('id', participantId);
      });
      await withRetry(async () => {
        return await supabase.from('game_sessions').update({ status: 'finished', winner_id: part.user_id }).eq('id', gameId);
      });
    } else {
      throw new Error('Tu cartón todavía no cumple con el patrón requerido.');
    }
  }
};
