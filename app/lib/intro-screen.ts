/**
 * Intro Screen Logic
 * 
 * Manages when to show/hide the intro screen
 */

const INTRO_SHOWN_KEY = 'math-tutor-intro-shown';
const INTRO_VERSION = 1;

export function shouldShowIntro(): boolean {
  if (typeof window === 'undefined') return true;
  
  try {
    const stored = localStorage.getItem(INTRO_SHOWN_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      
      if (data.version !== INTRO_VERSION) {
        return true;
      }
      
      // Check if user has significant history
      try {
        const { loadConversationHistory } = require('./conversation-history');
        const { getTotalXP } = require('./xp-system');
        const history = loadConversationHistory();
        const totalXP = getTotalXP();
        
        if (history.sessions.length >= 3 || totalXP >= 50) {
          return false;
        }
      } catch {
        // If modules not available, continue with date check
      }
      
      const daysSinceShown = (Date.now() - data.shownAt) / (1000 * 60 * 60 * 24);
      if (daysSinceShown > 30) {
        return true;
      }
      
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Failed to check intro status:', error);
    return true;
  }
}

export function markIntroAsShown(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(INTRO_SHOWN_KEY, JSON.stringify({
      version: INTRO_VERSION,
      shownAt: Date.now(),
    }));
  } catch (error) {
    console.warn('Failed to save intro status:', error);
  }
}

export function resetIntro(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(INTRO_SHOWN_KEY);
  } catch (error) {
    console.warn('Failed to reset intro:', error);
  }
}

