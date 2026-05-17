export type GameMode = 'global' | 'personal' | 'custom';
export type GameStatus = 'waiting' | 'playing' | 'finished';

export interface GameParticipant {
  id: string;
  user_id: string;
  user_name: string;
  game_id: string;
  card_data: number[][]; // 5x5 grid
  marked_keys: string[];
  has_won: boolean;
  joined_at: string;
}

export interface GameSession {
  id: string;
  type: GameMode;
  creator_id: string | null;
  status: GameStatus;
  is_paused: boolean;
  current_number: number | null;
  drawn_numbers: number[];
  ball_limit: 75 | 100;
  winning_pattern: string;
  last_ball_at: string;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  is_admin: boolean;
  is_super_admin: boolean;
  is_banned: boolean;
}

export interface ChatMessage {
  id: string;
  game_id: string;
  user_id: string;
  user_name: string;
  message: string;
  created_at: string;
  type?: 'text' | 'system' | 'reaction';
  metadata?: any;
}
