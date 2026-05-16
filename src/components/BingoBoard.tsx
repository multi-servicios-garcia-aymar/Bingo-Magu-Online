/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { BINGO_CONFIG } from '../constants/bingo';

interface BingoBoardProps {
  drawnNumbers: number[];
  ballLimit: number;
}

export default function BingoBoard({ drawnNumbers, ballLimit }: BingoBoardProps) {
  const [zoomedNumber, setZoomedNumber] = useState<number | null>(null);
  const columns = ballLimit === 100 ? BINGO_CONFIG.RANGES_100 : BINGO_CONFIG.RANGES;

  const handleNumberClick = (n: number) => {
    if (!drawnNumbers.includes(n)) return;
    setZoomedNumber(n);
    setTimeout(() => {
      setZoomedNumber(prev => prev === n ? null : prev);
    }, 5000);
  };

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-white/40 flex flex-col w-full relative">
      <div className="flex items-center justify-between px-1 mb-0.5">
        <h3 className="text-[6px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1 italic">
          <div className="w-0.5 h-0.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_3px_rgba(59,130,246,0.5)]"></div>
          Bolas ({ballLimit})
        </h3>
        <span className="text-[6px] font-black text-blue-600 bg-blue-50 px-1 rounded-full border border-blue-100">
          {drawnNumbers.length}/{ballLimit}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        {BINGO_CONFIG.COLUMNS.map((colName) => {
          const [min, max] = columns[colName];
          const numbers = Array.from({ length: max - min + 1 }, (_, i) => min + i);
          
          return (
            <div key={colName} className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 flex-shrink-0 bg-blue-600 text-white rounded flex items-center justify-center text-[7px] font-black italic shadow-sm border border-blue-500/30">
                {colName}
              </div>
              
              <div 
                className="flex-1 grid gap-[1px]"
                style={{ gridTemplateColumns: ballLimit === 100 ? 'repeat(20, minmax(0, 1fr))' : 'repeat(15, minmax(0, 1fr))' }}
              >
                {numbers.map((n) => {
                  const isDrawn = drawnNumbers.includes(n);
                  const isZoomed = zoomedNumber === n;
                  
                  return (
                    <motion.button 
                      key={n}
                      onClick={() => handleNumberClick(n)}
                      animate={{
                        scale: isZoomed ? 6 : 1,
                        zIndex: isZoomed ? 100 : 10,
                        backgroundColor: isZoomed ? '#1d4ed8' : (isDrawn ? '#2563eb' : '#f8fafc'),
                        color: isZoomed ? '#ffffff' : (isDrawn ? '#ffffff' : '#1e293b'), // Much darker text for visibility
                        opacity: 1,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className={`
                        aspect-square rounded-full flex items-center justify-center text-[7px] sm:text-[14px] font-black transition-all duration-300 relative
                        ${isDrawn 
                          ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-400 scale-105' 
                          : 'bg-slate-50 text-slate-800 border-[1px] border-slate-200'}
                        ${!isDrawn ? 'cursor-default' : 'cursor-pointer'}
                      `}
                    >
                      {n}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
