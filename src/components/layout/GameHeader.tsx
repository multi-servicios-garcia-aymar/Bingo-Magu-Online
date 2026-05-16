/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Play, Pause, Square, Settings2, User as UserIcon, Bell, BellOff } from 'lucide-react';
import { GameSession, GameMode } from '../../types/bingo';

interface GameHeaderProps {
  game: GameSession | null;
  gameMode: GameMode | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  user: { id: string; name: string; avatarUrl?: string | null } | null;
  participantsCount: number;
  isPushEnabled: boolean;
  onSubscribe: () => void;
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
  onSubscribe,
  onTogglePause,
  onFinishGame,
  onStartRequest,
  onReset,
  onViewLobby,
  onShowAdmin,
  onShowSuperAdmin,
  onShowSettings
}: GameHeaderProps) {
  return (
    <header 
      className="bg-white border-b border-slate-200 px-3 py-1 flex justify-between items-center shadow-sm flex-shrink-0"
      style={{ paddingTop: 'calc(5.5rem + env(safe-area-inset-top))' }}
    >
      <div className="flex items-center space-x-1.5">
        <img 
          src="/icon.png" 
          alt="Logo" 
          className="w-7 h-7 rounded-lg shadow-sm cursor-pointer active:scale-90 transition-transform bg-blue-50 p-0.5" 
          onClick={onViewLobby}
          referrerPolicy="no-referrer"
        />
        <div className="min-w-0">
          <h1 className="text-[10px] font-black tracking-tight text-slate-800 uppercase italic leading-none font-display truncate">
            {gameMode === 'global' ? 'BINGO MAGU ONLINE' : 'SALA PRIVADA'}
          </h1>
          <span className="text-[8px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 truncate">
            {game?.status === 'playing' && (
               <div className="flex items-center gap-1 bg-red-50 text-red-600 px-1 rounded-sm border border-red-100 italic">
                 <div className="w-1 h-1 bg-red-600 rounded-full animate-pulse" />
                 <span className="text-[7px]">EN VIVO</span>
               </div>
            )}
            {gameMode === 'global' ? 'MULTIJUGADOR' : 'PRÁCTICA'}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {user && (
          <button 
            onClick={onSubscribe}
            className={`p-1.5 rounded-xl transition-all active:scale-95 shadow-sm border flex items-center justify-center ${
              isPushEnabled 
                ? 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100' 
                : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
            }`}
            title={isPushEnabled ? "Notificaciones activas" : "Activar notificaciones"}
          >
            {isPushEnabled ? <Bell className="w-3.5 h-3.5 fill-current" /> : <BellOff className="w-3.5 h-3.5" />}
          </button>
        )}

        {!user ? (
          <button 
            onClick={onShowAdmin}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all"
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span className="text-[9px] font-black uppercase italic tracking-tight">Iniciar Sesión</span>
          </button>
        ) : (
          <button 
            onClick={onShowSettings}
            className="p-1 px-1.5 bg-white text-slate-400 rounded-xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm border border-slate-100 flex items-center gap-2 group"
          >
            {user.avatarUrl ? (
              <img 
                src={user.avatarUrl} 
                alt={user.name}
                className="w-5 h-5 rounded-lg object-cover ring-1 ring-slate-100 group-hover:ring-blue-200 transition-all"
                referrerPolicy="no-referrer"
              />
            ) : (
              <UserIcon className="w-3.5 h-3.5" />
            )}
            <span className="text-[8px] font-black uppercase italic hidden sm:inline max-w-[80px] truncate">Perfil</span>
          </button>
        )}

        {/* Admin Controls - Better restricted and styled */}
        {((gameMode !== 'global' && (gameMode === 'personal' || gameMode === 'custom')) || isAdmin) && (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-slate-50/50 rounded-xl border border-slate-100 shadow-inner">
            {game?.status === 'playing' && (
              <>
                <button 
                  onClick={onTogglePause}
                  className="bg-white text-slate-600 p-1.5 rounded-lg active:scale-95 transition-transform hover:bg-slate-50 shadow-sm border border-slate-100"
                  title={game.is_paused ? "Reanudar" : "Pausar"}
                >
                  {game.is_paused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                </button>
                <button 
                  onClick={onFinishGame}
                  className="bg-white text-red-500 p-1.5 rounded-lg active:scale-95 transition-transform hover:bg-red-50 shadow-sm border border-slate-100"
                  title="Terminar Juego"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </>
            )}

            {game?.status === 'waiting' && (
              <button 
                onClick={onStartRequest} 
                disabled={(!isSuperAdmin && participantsCount === 0) || !game}
                className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic transition-all active:scale-95 flex items-center gap-1.5 ${
                  (!isSuperAdmin && participantsCount === 0) || !game
                    ? 'bg-slate-100 text-slate-300 cursor-not-allowed' 
                    : 'bg-green-600 text-white shadow-lg shadow-green-100 hover:shadow-green-200'
                }`}
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Iniciar</span>
              </button>
            )}

            {/* Config button strictly restricted to superadmin in global or creator in personal */}
            {(isSuperAdmin || (gameMode !== 'global' && game?.creator_id === user?.id)) && (
              <button 
                onClick={onReset} 
                className="bg-white text-slate-400 p-1.5 rounded-lg active:scale-95 transition-transform hover:bg-slate-50 shadow-sm border border-slate-100"
                title="Configurar Partida"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
        
      </div>
    </header>
  );
}
