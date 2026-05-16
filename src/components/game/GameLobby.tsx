/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Users, Play } from 'lucide-react';
import { GameMode } from '../../types/bingo';

interface GameLobbyProps {
  onSelectMode: (mode: GameMode) => void;
}

export default function GameLobby({ onSelectMode }: GameLobbyProps) {
  return (
    <div 
      className="h-screen bg-slate-50 flex flex-col p-4 items-center justify-center space-y-6 relative overflow-hidden"
      style={{ 
        paddingTop: 'calc(6.5rem + env(safe-area-inset-top))',
        paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))'
      }}
    >
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-blue-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-200/20 rounded-full blur-3xl" />

      <div className="text-center space-y-4 relative z-10 w-full max-w-sm">
        <img 
          src="/icon.png" 
          alt="Bingo Magu Logo" 
          className="w-28 h-28 mx-auto drop-shadow-[0_20px_50px_rgba(59,130,246,0.3)] animate-bounce-slow bg-white rounded-[2rem] p-2" 
          referrerPolicy="no-referrer" 
        />
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter font-display leading-none">
            Bingo Magu <span className="text-blue-600">Online</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.3em] italic">Multiplayer Experience</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 w-full max-w-sm relative z-10">
        <motion.button
          whileHover={{ scale: 1.05, translateY: -5 }} 
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectMode('global')}
          className="group bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/60 flex items-center gap-5 text-left transition-all hover:border-blue-500 hover:shadow-blue-200/50"
        >
          <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-inner shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-black text-slate-800 uppercase italic leading-tight font-display truncate">Sala Online</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gana Premios Reales</div>
          </div>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, translateY: -5 }} 
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectMode('personal')}
          className="group bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-2xl shadow-slate-200/60 flex items-center gap-5 text-left transition-all hover:border-indigo-500 hover:shadow-indigo-200/50"
        >
          <div className="w-16 h-16 bg-indigo-50 rounded-3xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-inner shrink-0">
            <Play className="w-8 h-8" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xl font-black text-slate-800 uppercase italic leading-tight font-display truncate">Práctica</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Afina tu Velocidad</div>
          </div>
        </motion.button>
      </div>

      <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest pt-10">
        v2.5.0 • Live Sync Enabled
      </div>
    </div>
  );
}
