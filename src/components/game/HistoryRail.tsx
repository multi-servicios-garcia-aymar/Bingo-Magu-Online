/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from 'motion/react';

interface HistoryRailProps {
  drawnNumbers: number[];
}

export default function HistoryRail({ drawnNumbers }: HistoryRailProps) {
  const lastBalls = [...drawnNumbers].slice(-6).reverse().slice(1); // Last 5 excluding the current one

  return (
    <div className="flex items-center gap-1 px-1 py-0.5 overflow-x-auto no-scrollbar">
      <div className="text-[6px] font-black text-slate-300 uppercase italic flex-shrink-0">ANT:</div>
      <div className="flex gap-1 h-5">
        <AnimatePresence initial={false}>
          {lastBalls.map((num, idx) => (
            <motion.div
              key={num}
              initial={{ scale: 0, opacity: 0, x: -10 }}
              animate={{ scale: 1, opacity: idx === 0 ? 1 : 0.4, x: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              className="w-4 h-4 bg-slate-100 rounded-full flex items-center justify-center text-[7px] font-bold text-slate-500 border border-white shrink-0"
            >
              {num}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
