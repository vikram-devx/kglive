/**
 * Sound utilities for the game
 * Uses simple Audio elements to play WAV files
 */

// Sound mute state
let isMuted = false;

/**
 * Initialize audio (now just a placeholder function)
 */
export function initAudio() {
  // Nothing to initialize for basic Audio elements
  return true;
}

/**
 * Toggle the mute state
 */
export function toggleMute() {
  isMuted = !isMuted;
  return isMuted;
}

/**
 * Get the current mute state
 */
export function isSoundMuted() {
  return isMuted;
}

/**
 * Helper function to play sounds
 */
function playSound(url: string) {
  if (isMuted) return;

  try {
    // Create a new audio element for each sound to avoid conflicts
    const sound = new Audio(url);
    sound.volume = 0.8;
    sound.play().catch(error => {
      console.error(`Error playing sound (${url}):`, error);
    });
  } catch (error) {
    console.error(`Error playing sound (${url}):`, error);
  }
}

/**
 * Play the coin flip sound
 */
export function playCoinFlipSound() {
  playSound('/sounds/coin-flip-sound.wav');
}

/**
 * Play the win sound
 */
export function playWinSound() {
  // Using the same sound for win as well
  playSound('/sounds/coin-flip-sound.wav');
}

/**
 * Placeholder for losing sound - not used as per user request
 */
export function playLoseSound() {
  // No sound played for losses as requested by the user
  return;
}