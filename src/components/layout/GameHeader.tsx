/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, Pause, Square, Settings2, User as UserIcon, Bell, BellOff, Megaphone, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { GameSession, GameMode } from '../../types/bingo';

interface GameHeaderProps {
  game: GameSession | null;
  gameMode: GameMode | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: { id: string; name: string; avatarUrl?: string | null } | null;
  participantsCount: number;
  isPushEnabled: boolean;
  isMuted: boolean;
  isMicActive: boolean;
  onSubscribe: () => void;
  onToggleMute: () => void;
  onToggleMic: () => void;
  onTogglePause: () => void;
  onFinishGame: () => void;
  onStartRequest: () => void;
  onReset: () => void;
  onViewLobby: () => void;
  onShowAdmin: () => void;
  onShowSuperAdmin: () => void;
  onShowSettings: () => void;
}

export default function GameHeader({
  game,
  gameMode,
  isAdmin,
  isSuperAdmin,
  user,
  participantsCount,
  isPushEnabled,
  isMuted,
  isMicActive,
  onSubscribe,
  onToggleMute,
  onToggleMic,
  onTogglePause,
  onFinishGame,
  onStartRequest,
  onReset,
  onViewLobby,
  onShowAdmin,
  onShowSuperAdmin,
  onShowSettings
}: GameHeaderProps) {
  const canUseSuperFeatures = isSuperAdmin;

  return (
    <header 
      className="bg-white border-b border-slate-200 px-3 py-1 flex justify-between items-center shadow-sm flex-shrink-0 z-[60]"
      style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
    >
      <div className="flex items-center space-x-1.5 font-display">
        {canUseSuperFeatures && (
          <button 
            onClick={onToggleMute}
            className={`p-1 rounded-lg transition-all active:scale-90 ${isMuted ? 'text-slate-300' : 'text-blue-600 bg-blue-50 shadow-sm'}`}
            title={isMuted ? "Sonido desactivado" : "Sonido activado"}
          >
            <Megaphone className={`w-4 h-4 ${!isMuted && 'animate-pulse'}`} />
          </button>
        )}

        <img 
          src="/icon.png" 
          alt="Logo" 
          className="w-8 h-8 rounded-lg shadow-sm cursor-pointer active:scale-90 transition-transform bg-blue-50 p-0.5" 
          onClick={onViewLobby}
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0">
          <h1 className="text-[11px] font-black tracking-tight text-slate-800 uppercase italic leading-none truncate">
            {gameMode === 'global' ? 'BINGO MAGU' : 'SALA PRIVADA'}
          </h1>
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 truncate leading-none mt-1">
            {game?.status === 'playing' ? 'PARTIDA EN VIVO' : 'MULTIJUGADOR'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-1.5">
        {user && (
          <>
            {canUseSuperFeatures && (
              <button 
                onClick={onToggleMic}
                className={`p-1.5 rounded-lg transition-all active:scale-95 shadow-sm border flex items-center justify-center ${
                  isMicActive 
                    ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' 
                    : 'bg-white text-slate-400 border-slate-100'
                }`}
              >
                {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              </button>
            )}

            <button 
              onClick={onSubscribe}
              className={`p-1.5 rounded-lg transition-all active:scale-95 shadow-sm border flex items-center justify-center ${
                isPushEnabled 
                  ? 'bg-blue-50 text-blue-600 border-blue-100' 
                  : 'bg-white text-slate-400 border-slate-100'
              }`}
            >
              {isPushEnabled ? <Bell className="w-3.5 h-3.5 fill-current" /> : <BellOff className="w-3.5 h-3.5" />}
            </button>
          </>
        )}

        {!user ? (
          <button 
            onClick={onShowAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 active:scale-95 transition-all"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase italic tracking-tight">INGRESAR</span>
          </button>
        ) : (
          <button 
            onClick={onShowSettings}
            className="p-1 px-1.5 bg-white text-slate-400 rounded-lg hover:bg-slate-50 shadow-sm border border-slate-100 flex items-center gap-1.5"
          >
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                className="w-5 h-5 rounded-md object-cover ring-1 ring-slate-100"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserIcon className="w-4 h-4" />
            )}
            <span className="text-[8px] font-black uppercase italic hidden sm:inline truncate">MIPERFIL</span>
          </button>
        )}

        {((gameMode !== 'global' && (gameMode === 'personal' || gameMode === 'custom')) || isAdmin) && (
          <div className="flex items-center gap-1.5 px-1.5 py-1 bg-slate-50/50 rounded-lg border border-slate-100 shadow-inner">
            {game?.status === 'playing' && (
              <>
                <button 
                  onClick={onTogglePause}
                  className="bg-white text-slate-600 p-1 rounded-md active:scale-95 shadow-sm border border-slate-100"
                >
                  {game.is_paused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                </button>
                <button 
                  onClick={onFinishGame}
                  className="bg-white text-red-500 p-1 rounded-md active:scale-95 shadow-sm border border-slate-100"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </>
            )}

            {game?.status === 'waiting' && (
              <button 
                onClick={onStartRequest} 
                className="px-2 py-1 bg-green-600 text-white rounded-lg text-[9px] font-black uppercase italic shadow-md active:scale-95"
              >
                <Play className="w-3 h-3 fill-current" />
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
