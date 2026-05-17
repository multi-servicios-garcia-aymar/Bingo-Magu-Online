/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Check, Star, Sparkles } from 'lucide-react';
import { getPatternCells } from '../lib/patternHighlight';
import { hapticFeedback } from '../lib/feedback';

interface BingoCardProps {
  card: number[][];
  drawnNumbers: number[];
  initialMarkedKeys: string[];
  onToggleMark?: (marks: string[]) => void;
  onBingo: (markedKeys: string[]) => void;
  gameFinished: boolean;
  isWinner: boolean;
  winningPatternId?: string;
  winningPatternName?: string;
}

export default function BingoCard({ 
  card, 
  drawnNumbers, 
  initialMarkedKeys,
  onToggleMark,
  onBingo, 
  gameFinished, 
  isWinner,
  winningPatternId,
  winningPatternName 
}: BingoCardProps) {
  const [localMarked, setLocalMarked] = useState<{[key: string]: boolean}>(() => {
    const obj: {[key: string]: boolean} = {};
    (initialMarkedKeys || []).forEach(k => obj[k] = true);
    return obj;
  });

  // Sync with remote marks if they change (e.g. from another device or after a reconnect)
  useEffect(() => {
    const obj: {[key: string]: boolean} = {};
    (initialMarkedKeys || []).forEach(k => obj[k] = true);
    setLocalMarked(obj);
  }, [initialMarkedKeys]);

  const toggleMark = (row: number, col: number, val: number) => {
    if (gameFinished) return;
    const key = `${row}-${col}`;
    
    hapticFeedback.selection();
    const nextMarks = { ...localMarked, [key]: !localMarked[key] };
    setLocalMarked(nextMarks);

    if (onToggleMark) {
      onToggleMark(Object.keys(nextMarks).filter(k => nextMarks[k]));
    }
  };
  const patternCells = winningPatternId ? getPatternCells(winningPatternId) : new Set<string>();

  const isDrawn = (val: number) => val === 0 || drawnNumbers.includes(val);
  
  return (
    <div className="flex flex-col items-center space-y-0.5 w-full max-w-[320px] sm:max-w-md mx-auto py-1 px-1 justify-center relative">
      <div className={`bg-white p-1.5 sm:p-4 rounded-[1.2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 w-full relative transition-all duration-700 shrink-0 ${isWinner ? 'winner-glow scale-105 ring-4 ring-green-400/30' : ''}`}>
        
        {/* Destello / Flash Effect */}
        <AnimatePresence>
          {isWinner && (
            <>
              <motion.div
                initial={{ opacity: 0, rotate: -45, x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 z-10 pointer-events-none bg-gradient-to-r from-transparent via-white/40 to-transparent w-full"
              />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 z-0 pointer-events-none bg-green-500/5 rounded-inherit"
              />
              {/* Corner Sparkles */}
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1 z-20 text-yellow-400">
                <Sparkles className="w-6 h-6 fill-current" />
              </motion.div>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} className="absolute -bottom-1 -left-1 z-20 text-yellow-400">
                <Sparkles className="w-5 h-5 fill-current" />
              </motion.div>
            </>
          )}
        </AnimatePresence>
        
        <div className="grid grid-cols-5 gap-1 sm:gap-2.5 mb-1 sm:mb-2 md:mb-3">
          {['B', 'I', 'N', 'G', 'O'].map((letter) => (
            <div key={letter} className="text-center font-black text-xs sm:text-2xl md:text-3xl text-blue-600 italic font-display flex items-center justify-center">
              {letter}
            </div>
          ))}
        </div>

        {/* Numbers Grid - Perfect Square */}
        <div className="grid grid-cols-5 gap-0.5 sm:gap-2.5 aspect-square">
          {card.map((row, rowIndex) => {
            return row.map((cell, colIndex) => {
              const key = `${rowIndex}-${colIndex}`;
              const isFree = cell === 0;
              const isActuallyMarked = localMarked[key] || isFree;
              const isCorrect = isDrawn(cell);
              const isPattern = patternCells.has(key);
              
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => toggleMark(rowIndex, colIndex, cell)}
                  className={`
                    relative flex items-center justify-center rounded-md sm:rounded-xl text-[14px] sm:text-[33px] font-black aspect-square transition-colors duration-300
                    ${isFree ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-inner' : 
                      isActuallyMarked 
                        ? (isWinner && isPattern 
                            ? 'bg-yellow-500 text-white animate-bounce-slow shadow-[0_0_15px_rgba(234,179,8,0.5)] ring-2 ring-yellow-200' 
                            : isCorrect 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 ring-2 ring-white/40' 
                              : 'bg-red-500 text-white')
                        : isPattern 
                          ? (isWinner ? 'bg-yellow-100 border-yellow-300' : 'bg-blue-50/50 text-slate-600 border border-blue-100')
                          : 'bg-white text-slate-800 border border-slate-200 shadow-sm'}
                    ${isActuallyMarked ? 'scale-90' : ''}
                  `}
                >
                  {isFree ? <Star className="w-3 sm:w-10 h-3 sm:h-10 fill-current animate-pulse opacity-80" /> : <span className="drop-shadow-sm italic">{cell}</span>}
                  
                  {isActuallyMarked && isCorrect && !isFree && (
                    <Check className="absolute top-0.5 right-0.5 w-2 h-2 sm:w-4 sm:h-4 opacity-80 text-white" />
                  )}
                  
                  {isPattern && !isActuallyMarked && !isFree && (
                    <div className="absolute inset-0 bg-blue-500/5 rounded-md sm:rounded-xl border border-blue-500/20 pointer-events-none" />
                  )}
                </motion.button>
              );
            });
          })}
        </div>
      </div>

      <div className="w-full flex flex-col gap-0.5 sm:gap-2 shrink-0 min-h-[36px] sm:min-h-[60px] justify-center">
        <AnimatePresence mode="wait">
          {isWinner ? (
            <motion.div 
              key="winner-msg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="bg-green-600 text-white py-1 rounded-xl text-center font-black w-full text-[10px] flex items-center justify-center gap-2 shadow-lg border border-white/30 italic uppercase"
            >
              <Sparkles className="w-3 h-3 animate-pulse" />
              ¡GANASTE BINGO!
            </motion.div>
          ) : (
            <motion.button
              key="claim-btn"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={gameFinished ? {} : { scale: 1.02 }}
              whileTap={gameFinished ? {} : { scale: 0.95 }}
              disabled={gameFinished}
              onClick={() => onBingo(Object.keys(localMarked).filter(k => localMarked[k]))}
              className={`w-full h-8 sm:h-12 font-black text-[10px] sm:text-xl rounded-lg sm:rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-tight italic border border-white/20 ${gameFinished ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
            >
              <Trophy className="w-3 sm:w-6 h-3 sm:h-6" />
              <span>¡BINGO!</span>
              <span className="text-[6px] font-bold opacity-60 tracking-normal ml-2">VERIFICAR</span>
            </motion.button>
          )}
        </AnimatePresence>

        <div className="text-[7px] font-black text-slate-300 uppercase tracking-[0.2em] italic text-center leading-none">
          CANTAR BINGO VERIFICA SEGÚN {winningPatternName}
        </div>
      </div>
    </div>
  );
}
