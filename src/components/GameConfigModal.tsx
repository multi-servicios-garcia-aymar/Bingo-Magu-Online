import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WINNING_PATTERNS } from '../constants/bingo';
import { X, Settings2, CheckCircle2, ChevronRight, Loader2, Star } from 'lucide-react';
import { getPatternCells } from '../lib/patternHighlight';

interface GameConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: { ball_limit: 75 | 100; winning_pattern: string; starts_at?: string }) => void;
}

function PatternMiniGrid({ patternId, size = 'md' }: { patternId: string, size?: 'sm' | 'md' }) {
  const cells = getPatternCells(patternId);
  const isSm = size === 'sm';
  
  return (
    <div className={`grid grid-cols-5 gap-0.5 ${isSm ? 'w-10 h-10 p-0.5' : 'w-16 h-16 p-1'} bg-slate-100 rounded-md border border-slate-200 shrink-0`}>
      {Array.from({ length: 25 }).map((_, i) => {
        const r = Math.floor(i / 5);
        const c = i % 5;
        const key = `${r}-${c}`;
        const isActive = cells.has(key);
        const isCenter = r === 2 && c === 2;
        
        return (
          <div 
            key={key} 
            className={`
              rounded-[1px] flex items-center justify-center
              ${isActive ? 'bg-blue-500' : 'bg-white'} 
              ${isCenter && !isActive ? 'bg-blue-50/50' : ''}
            `}
          >
            {isCenter && (
              <Star className={`${isSm ? 'w-[2px] h-[2px]' : 'w-[4px] h-[4px]'} ${isActive ? 'text-white' : 'text-blue-300'}`} fill="currentColor" />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function GameConfigModal({ isOpen, onClose, onConfirm }: GameConfigModalProps) {
  const [ballLimit, setBallLimit] = useState<75 | 100>(75);
  const [pattern, setPattern] = useState(WINNING_PATTERNS[0].id);
  const [startTime, setStartTime] = useState(new Date().toISOString().slice(0, 16));
  const [loading, setLoading] = useState(false);

  const currentPattern = WINNING_PATTERNS.find(p => p.id === pattern);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm({ 
        ball_limit: ballLimit, 
        winning_pattern: pattern,
        starts_at: new Date(startTime).toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-black uppercase italic text-slate-800 tracking-tighter">Ajustes de Partida</h2>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-200 rounded-full transition-colors text-slate-400 -mr-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Visual Preview - Fixed at top of content */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 backdrop-blur-sm sticky top-0 z-10 flex items-center gap-4">
          <PatternMiniGrid patternId={pattern} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Star className="w-3 h-3 text-blue-600 fill-blue-600" />
              <h3 className="font-black text-blue-600 uppercase italic text-xs tracking-tight truncate">
                {currentPattern?.name}
              </h3>
            </div>
            <p className="text-[10px] text-slate-500 font-bold leading-tight mt-1">
              {currentPattern?.description}
            </p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
          {/* Ball Limit */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Límite de Bolos</label>
            <div className="grid grid-cols-2 gap-3">
              {[75, 100].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setBallLimit(val as 75 | 100)}
                  className={`py-4 rounded-2xl font-black text-xl border-2 transition-all ${
                    ballLimit === val 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-blue-200'
                  }`}
                >
                  {val} <span className="text-xs opacity-60">BOLOS</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scheduled Start */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Programar Inicio (Opcional)</label>
            <input 
              type="datetime-local" 
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-50 border border-slate-100 text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>

          {/* Winning Pattern */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] italic">Patrón de Victoria</label>
            <div className="grid grid-cols-1 gap-2">
              {WINNING_PATTERNS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPattern(p.id)}
                  className={`w-full p-4 rounded-xl flex items-center justify-between border transition-all scroll-mt-4 ${
                    pattern === p.id 
                    ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' 
                    : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 scale-75 origin-left">
                       <PatternMiniGrid patternId={p.id} size="sm" />
                    </div>
                    <span className="font-bold text-sm tracking-tight">{p.name}</span>
                  </div>
                  {pattern === p.id ? (
                    <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 shrink-0">
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase italic tracking-tighter shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
            {loading ? 'Creando...' : 'Confirmar y Crear'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
