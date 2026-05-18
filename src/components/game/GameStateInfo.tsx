/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Pause, Star } from 'lucide-react';
import { GameSession } from '../../types/bingo';
import { BINGO_CONFIG } from '../../constants/bingo';
import { getPatternCells } from '../../lib/patternHighlight';

interface GameStateInfoProps {
  game: GameSession;
  timeLeft: number | null;
  winningPattern: { id: string; name: string; description?: string };
}

function PatternThumbnail({ patternId }: { patternId: string }) {
  const cells = getPatternCells(patternId);
  return (
    <div className="grid grid-cols-5 gap-[0.5px] w-5 h-5 bg-white/20 p-0.5 rounded shadow-inner shrink-0">
      {Array.from({ length: 25 }).map((_, i) => {
        const r = Math.floor(i / 5);
        const c = i % 5;
        const isActive = cells.has(`${r}-${c}`);
        return (
          <div 
            key={i} 
            className={`rounded-[0.5px] ${isActive ? 'bg-white' : 'bg-white/5'}`}
          />
        );
      })}
    </div>
  );
}

export default function GameStateInfo({ game, timeLeft, winningPattern }: GameStateInfoProps) {
  const isTimeToHide = timeLeft !== null && timeLeft <= 5 && game?.status === 'playing';
  
  const displayBall = isTimeToHide 
    ? null 
    : (game?.current_number || (game?.drawn_numbers && game.drawn_numbers.length > 0 ? game.drawn_numbers[game.drawn_numbers.length - 1] : null));

  const ballLetter = displayBall 
    ? BINGO_CONFIG.getLetter(displayBall, game.ball_limit as 75 | 100) 
    : '';

  return (
    <div className="flex flex-col mb-0.5 shrink-0 overflow-hidden rounded-b-xl border-x border-b border-slate-100 shadow-md mx-0">
      {/* Top Main Status Bar */}
      <div className="grid grid-cols-3 items-center bg-white/95 backdrop-blur-md px-2 py-1.5 relative z-10">
        {/* Left: Next Ball */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-3xl font-black italic border-2 border-white shadow-xl transition-all duration-500 ${displayBall ? 'bg-blue-600' : 'bg-slate-100'}`}>
              <span className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {displayBall || (isTimeToHide ? '...' : '--')}
              </span>
            </div>
            {game?.status === 'playing' && !game?.is_paused && timeLeft !== null && (
              <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border border-white shadow-lg ${timeLeft <= 5 ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 text-white'}`}>
                {timeLeft}
              </div>
            )}
          </div>
          {!isTimeToHide && displayBall && (
            <div className="text-4xl font-black text-blue-600 italic tracking-tighter font-display drop-shadow-md leading-none">
              {ballLetter}
            </div>
          )}
        </div>

        {/* Center: Objective (Minimal in Top Bar) */}
        <div className="flex flex-col items-center justify-center text-center px-2">
          <div className="text-[7px] font-black text-slate-400 uppercase italic tracking-widest leading-none mb-1 font-display">OBJETIVO</div>
          <div className="text-[11px] font-black text-blue-800 uppercase tracking-tight leading-tight bg-blue-100/30 px-2 py-1 rounded-lg border border-blue-200/30 w-full truncate italic font-display">
            {game ? winningPattern.name : 'Sin Partida'}
          </div>
        </div>

        {/* Right: Status */}
        <div className="flex justify-end items-center gap-2">
          {!game ? (
            <div className="flex items-center gap-1.5 bg-slate-50 text-slate-400 px-2 py-1 rounded-full border border-slate-100 italic">
              <span className="text-[8px] font-black uppercase italic">Desconectado</span>
            </div>
          ) : game.status === 'waiting' ? (
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-2 py-1 rounded-full border border-blue-100 animate-pulse min-w-[80px] justify-center">
              <span className="text-[8px] font-black uppercase italic whitespace-nowrap">Esperando Admin</span>
            </div>
          ) : game.is_paused ? (
            <div className="flex items-center gap-1.5 bg-amber-50 text-amber-600 px-2 py-1 rounded-full border border-amber-100">
              <Pause className="w-3 h-3 fill-current" />
              <span className="text-[9px] font-black uppercase italic">Pausa</span>
            </div>
          ) : game.status === 'finished' ? (
            <div className="flex flex-col items-end">
               <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <div className="text-[8px] font-black text-slate-500 uppercase tracking-wider italic">Finalizado</div>
               </div>
            </div>
          ) : (
            <div className="flex flex-col items-end">
               <div className="flex items-center gap-1.5 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></div>
                  <div className="text-[8px] font-black text-green-600 uppercase tracking-wider italic">En Vivo</div>
               </div>
               <div className="text-[8px] text-slate-400 font-bold mt-1 uppercase">{(game?.drawn_numbers || []).length} Bolas Jugadas</div>
            </div>
          )}
        </div>
      </div>

      {/* Integrated Pattern Banner - Slimmed down */}
      {winningPattern.description && game && (
        <div className="bg-blue-600 text-white px-2 py-0.5 flex items-center gap-2 overflow-hidden relative group border-t border-blue-500/30">
          <div className="absolute -top-1 -right-1 p-2 opacity-10 rotate-12">
             <Star className="w-8 h-8 fill-current" />
          </div>
          
          <PatternThumbnail patternId={winningPattern.id} />
          
          <div className="flex-1 min-w-0">
            <p className="text-[7px] font-bold tracking-tight leading-3 italic">
              <span className="bg-white/20 px-1 rounded-[2px] mr-1 text-[6px] font-black not-italic opacity-100">TABLA</span>
              {winningPattern.description}
            </p>
          </div>

          <div className="flex-shrink-0 w-0.5 h-0.5 bg-blue-300 rounded-full animate-pulse shadow-[0_0_8px_rgba(147,197,253,1)]" />
        </div>
      )}
    </div>
  );
}
