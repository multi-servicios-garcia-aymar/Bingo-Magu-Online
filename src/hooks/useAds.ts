import { useState, useEffect } from 'react';
import { PublicityService } from '../services/authService';

export function useAds(gameMode: string | null, gameStatus: string | undefined, drawnNumbersLength: number, isAppReady: boolean) {
  const [activePopupAd, setActivePopupAd] = useState<any>(null);
  const [hasShownOpenAd, setHasShownOpenAd] = useState(false);
  const [sidebarAds, setSidebarAds] = useState<any[]>([]);
  const [allActiveAds, setAllActiveAds] = useState<any[]>([]);

  useEffect(() => {
    const fetchAds = async () => {
      const { data } = await PublicityService.getActive();
      if (data) {
        setAllActiveAds(data);
        const sideAds = data.filter(ad => ad.display_settings?.show_in_game_side);
        setSidebarAds(sideAds);
      }
    };
    fetchAds();
    const interval = setInterval(fetchAds, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAppReady && !hasShownOpenAd && allActiveAds.length > 0) {
      const onOpenAd = allActiveAds.find(ad => ad.display_settings?.show_on_open);
      if (onOpenAd) {
        setActivePopupAd(onOpenAd);
        setHasShownOpenAd(true);
      }
    }
  }, [isAppReady, hasShownOpenAd, allActiveAds]);

  useEffect(() => {
    if (gameMode === 'global' && !gameStatus && isAppReady) {
      const lobbyAd = allActiveAds.find(ad => ad.display_settings?.show_in_lobby);
      if (lobbyAd) setActivePopupAd(lobbyAd);
    }
  }, [gameMode, gameStatus, isAppReady, allActiveAds]);

  useEffect(() => {
    if (gameMode === 'personal' && gameStatus === 'playing') {
      // Practice Mode specific popups
      if (drawnNumbersLength === 0) {
        const startAd = allActiveAds.find(ad => ad.display_settings?.private_game_frequency === 'start');
        if (startAd) {
          setActivePopupAd(startAd);
        } else {
          // Fallback Practice Mode Tip
          setActivePopupAd({
            id: 'practice-welcome',
            title: '¡Modo Práctica Activo!',
            message: 'Aprovecha este espacio para afinar tus reflejos y aprender los patrones de juego. ¡Mucha suerte!',
            display_settings: { show_on_open: false }
          });
        }
      }
      
      if (drawnNumbersLength > 0 && drawnNumbersLength % 15 === 0) {
        const freqAd = allActiveAds.find(ad => ad.display_settings?.private_game_frequency === 'every_5');
        if (freqAd) {
          setActivePopupAd(freqAd);
        } else {
          setActivePopupAd({
            id: 'practice-intersticial-' + drawnNumbersLength,
            title: 'Tip de Magu',
            message: '¿Sabías que puedes jugar con amigos creando tu propia sala privada? ¡Pruébalo pronto!',
            display_settings: { show_on_open: false }
          });
        }
      }
    } else if (gameMode === 'custom' && gameStatus === 'playing') {
      if (drawnNumbersLength === 0) {
        const startAd = allActiveAds.find(ad => ad.display_settings?.private_game_frequency === 'start');
        if (startAd) setActivePopupAd(startAd);
      }
      
      if (drawnNumbersLength > 0 && drawnNumbersLength % 5 === 0) {
        const freqAd = allActiveAds.find(ad => ad.display_settings?.private_game_frequency === 'every_5');
        if (freqAd) setActivePopupAd(freqAd);
      }
    }
  }, [drawnNumbersLength, gameStatus, gameMode, allActiveAds]);

  return {
    activePopupAd,
    setActivePopupAd,
    sidebarAds
  };
}
