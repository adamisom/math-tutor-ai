/**
 * Intro Screen Logic
 * 
 * Manages when to show/hide the intro screen
 */

import { getStorageItem, setStorageItem, removeStorageItem } from './local-storage';

const INTRO_SHOWN_KEY = 'math-tutor-intro-shown';
const INTRO_VERSION = 1;

export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return true;
  
  const data = getStorageItem<{ version?: number; shownAt?: number } | null>(
    INTRO_SHOWN_KEY,
    null
  );
  
  if (data) {
      
      if (data.version !== INTRO_VERSION) {
        return true;
      }
      
      // Check if user has significant history (synchronous check)
      try {
        // Import synchronously for client-side only code
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { loadConversationHistory } = require('./conversation-history');
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const { getTotalXP } = require('./xp-system');
        const history = loadConversationHistory();
        const totalXP = getTotalXP();
        
        if (history.sessions.length >= 3 || totalXP >= 50) {
          return false;
        }
      } catch {
        // If modules not available, continue with date check
      }
      
      const daysSinceShown = (Date.now() - (data.shownAt || 0)) / (1000 * 60 * 60 * 24);
      if (daysSinceShown > 30) {
        return true;
      }
      
      return false;
    }
  
  return true;
}

export function markIntroAsShown(): void {
  setStorageItem(INTRO_SHOWN_KEY, {
    version: INTRO_VERSION,
    shownAt: Date.now(),
  });
}

export function resetIntro(): void {
  removeStorageItem(INTRO_SHOWN_KEY);
}

