import { useCallback, useRef } from 'react';

// Mechanical click sound for tactile feedback
const CLICK_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';

// Success ping for confirmations
const SUCCESS_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3';

const SOUND_ENABLED_KEY = 'dave-sound-enabled';

function isSoundEnabled(): boolean {
  const stored = localStorage.getItem(SOUND_ENABLED_KEY);
  return stored !== null ? stored === 'true' : true;
}

// Use native Audio API to avoid React version conflicts with use-sound
export function useClickSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const play = useCallback(() => {
    if (!isSoundEnabled()) return;
    
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(CLICK_SOUND_URL);
        audioRef.current.volume = 0.25;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay restrictions
      });
    } catch {
      // Ignore errors
    }
  }, []);
  
  return play;
}

export function useSuccessSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const play = useCallback(() => {
    if (!isSoundEnabled()) return;
    
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(SUCCESS_SOUND_URL);
        audioRef.current.volume = 0.3;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Ignore autoplay restrictions
      });
    } catch {
      // Ignore errors
    }
  }, []);
  
  return play;
}
