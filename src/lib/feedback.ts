/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Basic browser audio context for simple game sounds
export const playSound = (freq: number, type: OscillatorType = 'sine', duration: number = 0.1) => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio blocked or not supported", e);
  }
};

export const GameAudio = {
  ballDraw: () => {
    playSound(440, 'sine', 0.1);
    setTimeout(() => playSound(880, 'sine', 0.05), 50);
  },
  bingoSuccess: () => {
    playSound(523.25, 'triangle', 0.2); // C5
    setTimeout(() => playSound(659.25, 'triangle', 0.2), 100); // E5
    setTimeout(() => playSound(783.99, 'triangle', 0.4), 200); // G5
  },
  click: () => playSound(1000, 'sine', 0.02)
};

export const hapticFeedback = {
  impact: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'medium') => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    try {
      if (tg?.HapticFeedback && tg.isVersionAtLeast('6.0')) {
        tg.HapticFeedback.impactOccurred(style);
      }
    } catch (e) {
      console.debug('Haptics not available');
    }
  },
  notification: (type: 'error' | 'success' | 'warning') => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    try {
      if (tg?.HapticFeedback && tg.isVersionAtLeast('6.0')) {
        tg.HapticFeedback.notificationOccurred(type);
      }
    } catch (e) {
      console.debug('Haptics not available');
    }
  },
  selection: () => {
    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    try {
      if (tg?.HapticFeedback && tg.isVersionAtLeast('6.0')) {
        tg.HapticFeedback.selectionChanged();
      }
    } catch (e) {
      console.debug('Haptics not available');
    }
  }
};
