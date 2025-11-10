import { XPState } from './xp-system';

/**
 * Hybrid storage: Save XP to both localStorage and database (if authenticated)
 */
export async function saveXPStateHybrid(xpState: XPState, isAuthenticated: boolean): Promise<void> {
  // Always save to localStorage
  const { setStorageItem } = await import('./local-storage');
  setStorageItem('math-tutor-xp', xpState);

  // If authenticated, also save to database
  if (isAuthenticated) {
    try {
      await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(xpState),
      });
    } catch (error) {
      console.warn('Failed to save XP to database, using localStorage only:', error);
    }
  }
}

/**
 * Hybrid storage: Load XP from database (if authenticated) or localStorage
 */
export async function loadXPStateHybrid(isAuthenticated: boolean): Promise<XPState> {
  if (isAuthenticated) {
    try {
      const response = await fetch('/api/xp');
      if (response.ok) {
        const xpState = await response.json();
        return {
          totalXP: xpState.totalXP,
          level: xpState.level,
          transactions: xpState.transactions,
        };
      }
    } catch (error) {
      console.warn('Failed to load XP from database, falling back to localStorage:', error);
    }
  }

  // Fallback to localStorage
  const { getXPState } = await import('./xp-system');
  return getXPState();
}

