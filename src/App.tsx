/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, Play, RotateCcw, AlertCircle, Loader2, 
  Grid3X3, X, ChevronLeft, ChevronRight, Trophy, Settings2
} from 'lucide-react';

// Types
import { GameMode } from './types/bingo';

// Hooks
import { useGame } from './hooks/useGame';
import { useParticipant } from './hooks/useParticipant';
import { useBingoAuth } from './hooks/useBingoAuth';
import { useAds } from './hooks/useAds';
import { useNotifications } from './hooks/useNotifications';

// Services
import { GameService } from './services/gameService';
import { AuthService, PublicityService } from './services/authService';
import { supabase } from './lib/supabase';

// Libs
import { validateClaimStatus } from './lib/bingoRules';
import { GameAudio, hapticFeedback } from './lib/feedback';

// Components
import BingoCard from './components/BingoCard';
import BingoBoard from './components/BingoBoard';
import GameConfigModal from './components/GameConfigModal';
import { AuthModal, SuperAdminPanel, PublicityAlert, SidebarAd, RankingModal, ProfileSettingsModal } from './components/AuthModals';
import Chat from './components/game/Chat';

// Hooks
import { useGameSounds } from './hooks/useGameSounds';

// Modular Layout Components
import GameHeader from './components/layout/GameHeader';
import SplashScreen from './components/layout/SplashScreen';
import GameLobby from './components/game/GameLobby';
import GameStateInfo from './components/game/GameStateInfo';
import HistoryRail from './components/game/HistoryRail';

// Constants
import { WINNING_PATTERNS, BINGO_CONFIG } from './constants/bingo';

export default function App() {
  const [gameMode, setGameMode] = useState<GameMode | null>(null);
  const [view, setView] = useState<'lobby' | 'game'>('lobby');
  const { playSound } = useGameSounds();

  const {
    user, setUser, isAdmin, setIsAdmin,
    isSuperAdmin, setIsSuperAdmin
  } = useBingoAuth(gameMode);

  const { 
    game, 
    participantsCount, 
    uniqueParticipantsCount, 
    loading, 
    isRefreshing,
    setGame, 
    error: gameError 
  } = useGame(gameMode, user?.id);
  const { participants: userCards, register, updateMarks } = useParticipant(game?.id, user?.id);

  const { activePopupAd, setActivePopupAd, sidebarAds } = useAds(gameMode, game?.status, game?.drawn_numbers?.length || 0, true);
  
  const { isEnabled: isPushEnabled, subscribe: handleSubscribePush } = useNotifications(user?.id);

  const [isMuted, setIsMuted] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [cardCount, setCardCount] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSuperAdminPanel, setShowSuperAdminPanel] = useState(false);
  const [showRanking, setShowRanking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [showWelcomeSplash, setShowWelcomeSplash] = useState(false);

  const ADMIN_IDS = useMemo(() => import.meta.env.VITE_ADMIN_IDS?.split(',') || [], []);
  const IS_SUPABASE_CONFIGURED = import.meta.env.VITE_SUPABASE_URL?.includes('.supabase.co');

  const winPattern = useMemo(() => {
    return WINNING_PATTERNS.find(p => p.id === game?.winning_pattern) || WINNING_PATTERNS[0];
  }, [game?.winning_pattern]);

  const winPatternName = winPattern.name;

  // Sync index when game changes
  useEffect(() => { setCurrentCardIndex(0); }, [game?.id]);

  // Audio/Haptic on draw
  useEffect(() => {
    if (game?.current_number) {
      if (!isMuted) {
        GameAudio.ballDraw();
        playSound('DRAW');
      }
      hapticFeedback.impact('medium');
      
      // Voice Synthesis
      if ('speechSynthesis' in window && !isMuted) {
        const letter = BINGO_CONFIG.getLetter(game.current_number, game.ball_limit);
        const utterance = new SpeechSynthesisUtterance(`${letter}, ${game.current_number}`);
        utterance.lang = 'es-ES';
        utterance.rate = 1.0;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, [game?.current_number, game?.ball_limit, isMuted]);

  // Voice Command (Microphone) Logic
  useEffect(() => {
    if (!isMicActive) return;

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Tu navegador no soporta reconocimiento de voz.');
      setIsMicActive(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1;
      const text = event.results[last][0].transcript.toLowerCase();
      
      if (text.includes('bingo')) {
        const currentCard = userCards[currentCardIndex];
        if (currentCard) {
          handleBingo(currentCard.marked_keys || []);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setError('Permiso de micrófono denegado.');
        setIsMicActive(false);
      }
    };

    recognition.start();
    return () => recognition.stop();
  }, [isMicActive, userCards, currentCardIndex]);

  // Auto-draw logic: Synchronized with Server
  useEffect(() => {
    if (!game || game.status !== 'playing' || game.is_paused) {
      setTimeLeft(null);
      return;
    }

    const updateCountdown = () => {
      const lastBallTime = new Date(game.last_ball_at || game.created_at).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - lastBallTime) / 1000);
      const remaining = Math.max(0, (BINGO_CONFIG.DRAW_INTERVAL_MS / 1000) - elapsed);
      setTimeLeft(remaining);
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [game?.status, game?.is_paused, game?.id, game?.last_ball_at, game?.created_at]);

  const handleBingo = async (markedKeys: string[]) => {
    const currentCard = userCards[currentCardIndex];
    if (!currentCard || !game) return;

    const validation = validateClaimStatus(
      currentCard.card_data,
      markedKeys,
      game.drawn_numbers || [],
      game.winning_pattern
    );

    if (!validation.isValid) {
      hapticFeedback.notification('error');
      setError(validation.error || 'Bingo inválido');
      return;
    }

    try {
      await GameService.claimBingo(currentCard.id, game.id);
      GameAudio.bingoSuccess();
      playSound('VICTORY');
      hapticFeedback.notification('success');
    } catch (e: any) { 
      playSound('ERROR');
      setError(e.message); 
    }
  };

  const handleReset = useCallback(() => {
    setGameMode(null);
    setView('lobby');
    setError(null);
    hapticFeedback.selection();
  }, []);

  const handleJoin = useCallback(async () => {
    // If we're in Telegram and have a tg user, we already set the 'user' state in useBingoAuth
    // So if 'user' is missing, it means we really need auth (browser)
    if (!user) { 
      playSound('CLICK');
      setShowAuthModal(true); 
      return; 
    }
    
    try {
      setIsLoggingIn(true);
      playSound('CLICK');
      hapticFeedback.impact('light');
      
      let targetGame = game;

      // In custom or personal mode, if no active game exists, create one automatically
      if (!targetGame && (gameMode === 'custom' || gameMode === 'personal')) {
        const { data, error: createError } = await GameService.createSession({
          type: gameMode,
          ball_limit: 75,
          winning_pattern: 'full_house',
          creator_id: user.id
        });
        if (createError) throw createError;
        if (data) {
          targetGame = data as any;
          setGame(targetGame);
        }
      }

      if (!targetGame) {
        throw new Error('No hay una partida activa para unirse.');
      }
      
      // Register cards
      for (let i = 0; i < cardCount; i++) {
        await register(targetGame.id, user.id, user.name, targetGame.ball_limit);
      }
      
      setCardCount(1);
      if (view === 'lobby') setView('game');
      
      // @ts-ignore
      window.Telegram?.WebApp?.MainButton?.hide();
    } catch (e: any) { 
      playSound('ERROR');
      setError(e.message); 
    } finally { 
      setIsLoggingIn(false); 
    }
  }, [user, game, gameMode, cardCount, register, view, setGame]);

  // Telegram BackButton Controller
  useEffect(() => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    if (view === 'game') {
      tg.BackButton.show();
      tg.BackButton.onClick(handleReset);
      return () => {
        tg.BackButton.hide();
        tg.BackButton.offClick(handleReset);
      };
    } else {
      tg.BackButton.hide();
    }
  }, [view, handleReset]);

  // Telegram MainButton Controller
  useEffect(() => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (!tg) return;

    if (view === 'game' && !userCards.length && user && game?.status === 'waiting') {
      tg.MainButton.text = `GENERAR ${cardCount} ${cardCount === 1 ? 'TABLA' : 'TABLAS'}`;
      tg.MainButton.show();
      tg.MainButton.onClick(handleJoin);
      return () => {
        tg.MainButton.hide();
        tg.MainButton.offClick(handleJoin);
      };
    } else if (view === 'game' && !user && game?.status === 'waiting') {
      tg.MainButton.text = 'INICIAR SESIÓN PARA JUGAR';
      tg.MainButton.show();
      tg.MainButton.onClick(handleJoin);
      return () => {
        tg.MainButton.hide();
        tg.MainButton.offClick(handleJoin);
      };
    } else {
      tg.MainButton.hide();
    }
  }, [view, userCards, user, game, cardCount, handleJoin, handleBingo, currentCardIndex]);

  // Telegram integration setup
  useEffect(() => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      
      // Sync theme colors if requested
      try {
        tg.setHeaderColor(tg.themeParams?.header_bg_color || '#ffffff');
        tg.setBackgroundColor(tg.themeParams?.bg_color || '#f8fafc');
        
        // Optimize for Mini App - disable vertical swipes to prevent accidental closing
        if (tg.isVersionAtLeast('7.7')) {
          tg.requestFullscreen?.();
        }
      } catch (e) {
        console.warn('Could not set Telegram colors', e);
      }
    }
  }, []);

  // Splash Screen Delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppReady(true);
      // @ts-ignore
      window.Telegram?.WebApp?.ready();
    }, 15000); // 15 seconds as requested by user
    return () => clearTimeout(timer);
  }, []);

  const handleTogglePause = async () => {
    if (!game) return;
    hapticFeedback.selection();
    await GameService.togglePause(game.id, !game.is_paused);
  };

  const handleFinishGame = async () => {
    if (!game || !window.confirm('¿Terminar juego?')) return;
    await GameService.finishSession(game.id);
  };


  const handleProfileUpdate = useCallback((data: { username?: string, avatarUrl?: string }) => {
    setUser(prev => {
      if (!prev) return null;
      return {
        ...prev,
        name: data.username ?? prev.name,
        avatarUrl: data.avatarUrl ?? prev.avatarUrl
      };
    });
  }, []);

  const handleStartRequest = async () => {
    if (!game || game.status === 'finished') { setShowConfig(true); return; }
    // Only super admin can start global games
    if (gameMode === 'global' && !isSuperAdmin) return;
    
    await GameService.startSession(game.id);
  };

  const handleConfirmConfig = async (config: any) => {
    setShowConfig(false);
    setError(null);
    try {
      const { data, error } = await GameService.createSession({
        ...config,
        type: gameMode,
        creator_id: gameMode === 'personal' ? user?.id : null
      });
      if (error) throw error;
      if (data) setGame(data as any);
    } catch (e: any) { setError(e.message); }
  };


  const handleModeSelect = useCallback((mode: GameMode) => {
    // Re-initialize state before opening modal
    setError(null);
    setGameMode(mode);
    setView('game');
    hapticFeedback.selection();
  }, []);

  const isTelegram = useMemo(() => {
    // @ts-ignore
    return !!window.Telegram?.WebApp?.initData;
  }, []);

  return (
    <div className={`h-[100dvh] flex flex-row font-sans transition-colors overflow-hidden items-stretch justify-center gap-0 lg:gap-4 ${gameMode === 'global' ? 'bg-slate-100' : 'bg-indigo-100/30'}`}>
      <SplashScreen isVisible={!isAppReady || showWelcomeSplash} user={user} />
      
      {/* Lateral Ad Left */}
      {!isTelegram && (
        <div className="hidden lg:flex w-24 xl:w-48 flex-col py-4 shrink-0">
          <SidebarAd ad={sidebarAds[0]} />
          {sidebarAds.length > 2 && <SidebarAd ad={sidebarAds[2]} />}
        </div>
      )}

      <div className="w-full max-w-2xl h-full flex flex-col bg-white shadow-2xl relative overflow-hidden">
        {view === 'lobby' ? (
          <GameLobby onSelectMode={handleModeSelect} />
        ) : (
          <>
            <GameHeader 
              game={game as any}
              gameMode={gameMode}
              isAdmin={isAdmin}
              isSuperAdmin={isSuperAdmin}
              user={user}
              participantsCount={participantsCount}
              isPushEnabled={isPushEnabled}
              isMuted={isMuted}
              isMicActive={isMicActive}
              onSubscribe={handleSubscribePush}
              onToggleMute={() => { setIsMuted(!isMuted); hapticFeedback.selection(); }}
              onToggleMic={() => { setIsMicActive(!isMicActive); hapticFeedback.selection(); }}
              onTogglePause={handleTogglePause}
              onFinishGame={handleFinishGame}
              onStartRequest={handleStartRequest}
              onReset={() => setShowConfig(true)}
              onViewLobby={handleReset}
              onShowAdmin={() => setShowAuthModal(true)}
              onShowSuperAdmin={() => setShowSuperAdminPanel(true)}
              onShowSettings={() => setShowSettings(true)}
            />

            {/* Debug/Dev alerts - hide in professional view */}
            {/* !IS_SUPABASE_CONFIGURED && (
              <div className="bg-amber-100 border-b border-amber-200 p-2 flex items-center gap-2 animate-pulse">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span className="text-[10px] font-black uppercase italic">⚠️ Falta Configuración de Base de Datos</span>
              </div>
            ) */}

            {(error || gameError) && (
              <div className="bg-red-50 border-b border-red-100 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-3 h-3 text-red-500" />
                  <span className="text-[9px] font-medium text-red-700">{error || (gameError as string)}</span>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 p-1"><X className="w-3 h-3" /></button>
              </div>
            )}

            <main className="flex-1 overflow-hidden flex flex-col p-1 space-y-0.5 relative">
              {loading ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                    <span className="text-[10px] font-black text-slate-300 uppercase italic animate-pulse">Iniciando Bingo...</span>
                  </div>
                </div>
              ) : (
                <>
                  <AnimatePresence>
                    {isRefreshing && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-2 left-1/2 -translate-x-1/2 z-50 bg-blue-600/90 text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg backdrop-blur-sm"
                      >
                         <Loader2 className="w-3 h-3 animate-spin" />
                         <span className="text-[8px] font-black uppercase italic">Sincronizando...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="shrink-0">
                    <GameStateInfo 
                      game={game as any} 
                      timeLeft={timeLeft} 
                      winningPattern={winPattern} 
                    />
                  </div>
                  
                  <div className="shrink-0 bg-white/40 p-0.5 rounded-lg shadow-inner border border-white/40 relative group overflow-hidden">
                     {!user && game && (
                       <div 
                         onClick={() => setShowAuthModal(true)}
                         className="absolute inset-0 bg-blue-600/5 backdrop-blur-[1px] z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                       >
                         <div className="bg-white/90 px-3 py-1.5 rounded-full shadow-lg border border-blue-100 flex items-center gap-2">
                           <Play className="w-3 h-3 text-blue-600 fill-current" />
                           <span className="text-[10px] font-black uppercase italic text-blue-700">Iniciar Sesión para Jugar</span>
                         </div>
                       </div>
                     )}
                     <BingoBoard drawnNumbers={game?.drawn_numbers || []} ballLimit={game?.ball_limit || 75} />
                     <div className="h-4 overflow-hidden mt-0.5">
                       <HistoryRail drawnNumbers={game?.drawn_numbers || []} />
                     </div>
                  </div>

                  <div className="flex-1 flex flex-col min-h-0 relative">
                    {userCards.length > 0 ? (
                       <>
                         <div className="flex items-center justify-between px-2 py-0.5 glass rounded-lg mx-0.5 shadow-sm shrink-0 mb-1">
                            <button 
                              onClick={() => { setCurrentCardIndex(prev => Math.max(0, prev - 1)); hapticFeedback.selection(); }}
                              disabled={currentCardIndex === 0}
                              className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 disabled:opacity-20 text-blue-600 active:scale-95 transition-all">
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <div className="flex flex-col items-center">
                              <span className="text-[6px] font-black text-slate-400 uppercase italic tracking-widest leading-none">TABLA</span>
                              <div className="flex items-center gap-1.5">
                                <div className="text-xs font-black text-blue-700 italic font-display">#{currentCardIndex + 1}</div>
                                <div className="h-2 w-px bg-slate-200"></div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase">{userCards.length} TOTAL</div>
                              </div>
                            </div>

                            <button 
                              onClick={() => { setCurrentCardIndex(prev => Math.min(userCards.length - 1, prev + 1)); hapticFeedback.selection(); }}
                              disabled={currentCardIndex === userCards.length - 1}
                              className="p-1 rounded-lg bg-white shadow-sm border border-slate-100 disabled:opacity-20 text-blue-600 active:scale-95 transition-all">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                         </div>

                         <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden p-1">
                           <AnimatePresence mode="wait">
                             <motion.div
                                key={userCards[currentCardIndex].id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="w-full h-full flex items-center justify-center"
                             >
                               <BingoCard 
                                  card={userCards[currentCardIndex].card_data}
                                  initialMarkedKeys={userCards[currentCardIndex].marked_keys || []}
                                  onToggleMark={(marks) => { playSound('CLICK'); updateMarks(userCards[currentCardIndex].id, marks); }}
                                  drawnNumbers={game?.drawn_numbers || []}
                                  onBingo={handleBingo}
                                  gameFinished={game?.status === 'finished'}
                                  isWinner={userCards[currentCardIndex].has_won}
                                  winningPatternId={game?.winning_pattern}
                                  winningPatternName={winPatternName}
                                />
                             </motion.div>
                           </AnimatePresence>
                         </div>

                         {game?.id && user && (
                           <Chat 
                             gameId={game.id} 
                             userId={user.id} 
                             userName={user.name} 
                           />
                         )}

                         {game?.status === 'waiting' && userCards.length < 5 && (
                           <div className="mt-1 px-4 shrink-0 pb-1">
                             <button onClick={handleJoin} className="w-full text-[8px] font-black text-blue-600 uppercase italic flex items-center justify-center gap-1 bg-blue-50 py-1.5 rounded-lg border border-blue-200 shadow-sm active:scale-95 transition-all">
                               <Grid3X3 className="w-3 h-3" />
                               Añadir tabla
                             </button>
                           </div>
                         )}
      
                         {game?.status === 'finished' && (
                           <div className="mt-1 px-4 shrink-0 pb-1">
                             <button onClick={handleReset} className="w-full py-2 bg-slate-900 shadow-xl text-white rounded-xl font-black uppercase italic text-xs active:scale-95 transition-all flex items-center justify-center gap-2">
                               <RotateCcw className="w-4 h-4" />
                               Reiniciar Juego
                             </button>
                           </div>
                         )}
                       </>
                     ) : (
                       <div className="flex-1 flex flex-col items-center justify-center py-2 space-y-4">
                         <div 
                           onClick={() => {
                             if (!user) {
                               hapticFeedback.impact('light');
                               setShowAuthModal(true);
                             }
                           }}
                           className={`text-center space-y-3 ${!user ? 'cursor-pointer hover:bg-slate-50/50 p-2 rounded-2xl transition-all active:scale-95' : ''}`}
                         >
                           <div className="relative inline-block">
                             <div className="w-16 h-16 bg-blue-50/50 text-blue-200 rounded-3xl flex items-center justify-center mx-auto shadow-inner border border-blue-100/50">
                               <Users className="w-8 h-8" />
                             </div>
                             {!user && (
                               <div className="absolute -top-1 -right-1 bg-blue-600 text-white p-1 rounded-full shadow-lg border-2 border-white animate-bounce">
                                 <Play className="w-3 h-3 fill-current" />
                               </div>
                             )}
                           </div>
                           <div className="space-y-1">
                             <h3 className="font-black text-slate-800 uppercase italic leading-none font-display text-base">
                               {user ? 'Genera tus Tablas' : 'Inicia Sesión'}
                             </h3>
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider max-w-[200px] mx-auto">
                               {user ? 'Selecciona cuántas tablas quieres para participar' : 'Para participar en la partida y gritar BINGO'}
                             </p>
                           </div>
                         </div>

                          <div className="w-full px-4">
                            <div className="glass rounded-[2rem] p-4 space-y-4 shadow-xl border border-white">
                              {user && (
                                <div className="flex items-center justify-between">
                                  <span className="text-[9px] font-black text-slate-500 uppercase italic">Cant. Tablas</span>
                                  <div className="flex items-center gap-2">
                                     {[1, 2, 3, 4].map(num => (
                                       <button
                                         key={num}
                                         onClick={() => { setCardCount(num); hapticFeedback.selection(); }}
                                         className={`w-9 h-9 rounded-xl font-black text-sm transition-all border-2 ${cardCount === num ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200' : 'bg-white text-slate-600 border-slate-100 hover:bg-slate-50'}`}
                                       >
                                         {num}
                                       </button>
                                     ))}
                                  </div>
                                </div>
                              )}

                              <button 
                                 onClick={user ? handleJoin : () => { hapticFeedback.impact('light'); setShowAuthModal(true); }}
                                 disabled={(game && game.status !== 'waiting') || isLoggingIn}
                                 className={`w-full py-4 shadow-lg active:scale-95 transition-all text-white rounded-2xl font-black uppercase italic text-xs flex items-center justify-center gap-2 disabled:opacity-50 ${gameMode === 'global' ? 'bg-blue-600 shadow-blue-200' : 'bg-indigo-600 shadow-indigo-200'}`}
                               >
                                 {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                   user ? <Grid3X3 className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />
                                 )}
                                 {!user ? 'Iniciar Sesión para Jugar' : `Generar ${cardCount} ${cardCount === 1 ? 'Tabla' : 'Tablas'}`}
                               </button>
                            </div>
                          </div>
                       </div>
                     )}
                  </div>
                </>
              )}
            </main>

            <nav 
              className="bg-white border-t border-slate-200 flex items-center justify-around py-0.5 flex-shrink-0 shadow-sm"
              style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
            >
              <div className="flex flex-col items-center gap-0 text-blue-600 cursor-pointer min-w-[60px] py-1 active:scale-95 transition-transform" onClick={() => setView('lobby')}>
                <Users className="w-4 h-4" />
                <span className="text-[7px] font-black uppercase italic tracking-tighter">Comunidad</span>
              </div>
              
              <div 
                onClick={() => setShowRanking(true)}
                className="bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 flex items-center gap-1.5 shadow-inner cursor-pointer hover:bg-blue-100 transition-colors active:scale-95"
              >
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black text-blue-700 italic uppercase leading-none">{uniqueParticipantsCount} JUGADORES</span>
                  <span className="text-[6px] font-bold text-blue-400 uppercase tracking-tighter">{participantsCount} TABLAS ACTIVAS</span>
                </div>
              </div>

              <div 
                className="flex flex-col items-center gap-0 text-blue-600 cursor-pointer min-w-[60px] py-1 active:scale-90 transition-transform" 
                onClick={() => setShowRanking(true)}
              >
                <RotateCcw className="w-4 h-4" />
                <span className="text-[7px] font-black uppercase italic tracking-tighter">Ranking</span>
              </div>
            </nav>
          </>
        )}
      </div>

      {/* Lateral Ad Right */}
      {!isTelegram && (
        <div className="hidden lg:flex w-24 xl:w-48 flex-col py-4 shrink-0">
          <SidebarAd ad={sidebarAds[1] || sidebarAds[0]} />
          {sidebarAds.length > 3 && <SidebarAd ad={sidebarAds[3]} />}
        </div>
      )}

      <AnimatePresence>
        {showConfig && (
          <GameConfigModal 
            isOpen={showConfig} 
            onClose={() => setShowConfig(false)} 
            onConfirm={handleConfirmConfig} 
          />
        )}
        {showAuthModal && (
          <AuthModal 
            isOpen={showAuthModal} 
            onClose={() => setShowAuthModal(false)} 
            onAuthSuccess={(u, p) => {
              setUser({ 
                id: u.id, 
                name: p?.username || u.user_metadata?.username || u.email?.split('@')[0] || 'Jugador',
                avatarUrl: p?.avatar_url || u.user_metadata?.avatar_url
              });
              
              const isUserSuperAdmin = !!p?.is_super_admin;
              const isUserAdmin = isUserSuperAdmin || !!p?.is_admin || ADMIN_IDS.includes(u.id);
              
              setIsSuperAdmin(isUserSuperAdmin);
              setIsAdmin(isUserAdmin);

              // Show welcome splash
              setShowWelcomeSplash(true);
              setTimeout(() => setShowWelcomeSplash(false), 15000);
            }} 
          />
        )}
        {showSuperAdminPanel && (
          <SuperAdminPanel 
            isOpen={showSuperAdminPanel} 
            onClose={() => setShowSuperAdminPanel(false)} 
            currentUserId={user?.id} 
          />
        )}
        {showRanking && (
          <RankingModal
            isOpen={showRanking}
            onClose={() => setShowRanking(false)}
            mode={gameMode || 'global'}
          />
        )}
        {showSettings && user && (
          <ProfileSettingsModal
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            userId={user.id}
            onUpdate={handleProfileUpdate}
            onLogout={async () => {
              await AuthService.signOut();
              setUser(null);
            }}
            isSuperAdmin={isSuperAdmin}
            onShowSuperAdmin={() => setShowSuperAdminPanel(true)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {activePopupAd && (
          <PublicityAlert ad={activePopupAd} onClose={() => setActivePopupAd(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
