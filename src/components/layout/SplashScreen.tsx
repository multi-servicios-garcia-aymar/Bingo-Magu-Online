/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  isVisible: boolean;
  user?: { name: string } | null;
}

const HINTS = [
  { title: 'Sala Global', description: 'Juega partidas en vivo con toda la comunidad' },
  { title: 'Partidas Privadas', description: 'Crea tu propia sala y juega con amigos' },
  { title: 'Modo Práctica', description: 'Entrena solo y mejora tus reflejos' },
  { title: 'Voz en Vivo', description: 'Escucha al administrador cantar las balotas' }
];

export default function SplashScreen({ isVisible, user }: SplashScreenProps) {
  const [hintIndex, setHintIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setHintIndex(prev => (prev + 1) % HINTS.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          id="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.5, ease: 'easeInOut' } }}
          className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center overflow-hidden"
        >
          <div className="relative flex flex-col items-center w-full max-w-sm px-6">
            {/* Background Decorative Circles */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.5, opacity: 0.1 }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                repeatType: 'reverse',
                ease: 'easeInOut' 
              }}
              className="absolute w-64 h-64 bg-blue-500 rounded-full blur-3xl -z-10"
            />
            
            {/* Logo Container */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.16, 1, 0.3, 1] 
              }}
              className="relative mb-8"
            >
              <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-center p-4 border border-blue-50 relative overflow-hidden group">
                <img 
                  src="/icon.png" 
                  alt="Bingo Magu Online Logo" 
                  className="w-full h-full object-contain relative z-10"
                  referrerPolicy="no-referrer"
                />
                
                {/* Shine effect */}
                <motion.div 
                  initial={{ x: '-100%', skewX: -20 }}
                  animate={{ x: '200%' }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    repeatDelay: 2,
                    ease: 'linear'
                  }}
                  className="absolute inset-x-0 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent z-20"
                />
              </div>
              
              {/* Logo Shadow/Glow */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-20 h-4 bg-blue-100/50 rounded-full blur-xl" />
            </motion.div>

            {/* App Name */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-center space-y-2"
            >
              <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase italic font-display">
                Bingo Magu <span className="text-blue-600">Online</span>
              </h1>
              <div className="flex items-center justify-center gap-2">
                <div className="h-[1px] w-8 bg-slate-200" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Multijugador</span>
                <div className="h-[1px] w-8 bg-slate-200" />
              </div>
            </motion.div>

            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-10 flex flex-col items-center text-center"
            >
              <p className="text-xl font-black text-blue-600 uppercase italic tracking-tight">
                {user ? `¡Qué bueno verte, ${user.name}!` : '¡Bienvenido al Bingo Magu!'}
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">
                {user ? 'Sincronizando tus tablas...' : 'Preparando la diversión online...'}
              </p>
            </motion.div>

            {/* Hint Cycle */}
            <div className="mt-12 h-16 w-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={hintIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1 text-center"
                >
                  <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest leading-none">Tip de Juego</p>
                  <h3 className="text-xs font-black text-slate-800 uppercase italic tracking-tight">{HINTS[hintIndex].title}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{HINTS[hintIndex].description}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          {/* Footer branding */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute text-[10px] font-black text-slate-300 uppercase tracking-widest"
            style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
          >
            Bingo Magu Online v2.5
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
