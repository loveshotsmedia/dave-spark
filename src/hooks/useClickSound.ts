import useSound from 'use-sound';

// Mechanical click sound for tactile feedback
const CLICK_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3';

export function useClickSound() {
  const [play] = useSound(CLICK_SOUND_URL, { 
    volume: 0.25 // Low volume for professional feel
  });
  return play;
}

// Success ping for confirmations
const SUCCESS_SOUND_URL = 'https://assets.mixkit.co/active_storage/sfx/1114/1114-preview.mp3';

export function useSuccessSound() {
  const [play] = useSound(SUCCESS_SOUND_URL, { 
    volume: 0.3 
  });
  return play;
}
