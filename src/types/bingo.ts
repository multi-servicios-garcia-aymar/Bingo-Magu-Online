/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GameParticipant {
  id: string;
  user_id: string;
  user_name: string;
  game_id: string;
  card_data: number[][]; // 5x5 grid
  marked_keys: string[]; // ['0-0', '1-2'] etc
  has_won: boolean;
}

export type GameStatus = 'waiting' | 'playing' | 'finished';
export type GameMode = 'global' | 'personal' | 'custom';

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
  starts_at?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  is_super_admin: boolean;
}
