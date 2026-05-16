import { useCallback, useRef } from 'react';

const SOUND_URLS = {
  DRAW: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  VICTORY: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
  CLICK: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
  ERROR: 'https://assets.mixkit.co/active_storage/sfx/2573/2573-preview.mp3',
};

export function useGameSounds() {
  const audioContext = useRef<AudioContext | null>(null);

  const playSound = useCallback((type: keyof typeof SOUND_URLS) => {
    try {
      const audio = new Audio(SOUND_URLS[type]);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn('Audio play blocked by browser policy:', e));
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  }, []);

  return { playSound };
}
