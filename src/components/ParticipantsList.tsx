/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';
import { GameParticipant } from '../types/bingo';
import { Users, Trophy } from 'lucide-react';

interface ParticipantsListProps {
  participants: GameParticipant[];
}

export default function ParticipantsList({ participants }: ParticipantsListProps) {
  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-4 shadow-xl border border-white/40 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 italic">
          <Users className="w-4 h-4 text-blue-500" />
          Sala de Jugadores
        </h3>
        <span className="text-[9px] font-black bg-blue-600 text-white px-2 py-0.5 rounded-lg shadow-lg shadow-blue-100">
          {participants.length}
        </span>
      </div>

      <div className="space-y-2 overflow-y-auto pr-1 no-scrollbar flex-1">
        <AnimatePresence initial={false}>
          {participants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-30 italic">
              <Users className="w-8 h-8 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">Esperando Jugadores</p>
            </div>
          ) : (
            participants.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex justify-between items-center p-2.5 rounded-2xl border transition-all duration-300 ${
                  player.has_won 
                  ? 'bg-yellow-400 border-yellow-300 shadow-lg shadow-yellow-100 text-yellow-950' 
                  : 'bg-white border-slate-100 hover:border-blue-100 shadow-sm'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl border-2 border-white flex items-center justify-center text-[10px] font-black shadow-md flex-shrink-0 transition-transform ${
                    player.has_won ? 'bg-yellow-500 text-white scale-110' : 'bg-slate-50 text-slate-400'
                  }`}>
                    {player.user_name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black uppercase italic tracking-tighter text-sm truncate max-w-[100px] ${player.has_won ? 'text-yellow-950' : 'text-slate-800'}`}>
                        {player.user_name}
                      </span>
                    </div>
                  </div>
                </div>
                
                {player.has_won && (
                   <motion.div 
                     animate={{ rotate: [0, 10, -10, 0] }}
                     transition={{ repeat: Infinity, duration: 0.5 }}
                     className="bg-white/40 p-1.5 rounded-lg"
                   >
                     <Trophy className="w-4 h-4 fill-current" />
                   </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
