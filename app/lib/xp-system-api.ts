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
      const response = await fetch('/api/xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(xpState),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const saved = await response.json();
      console.log('[saveXPStateHybrid] Saved to database:', {
        totalXP: saved.totalXP,
        level: saved.level
      });
    } catch (error) {
      console.error('[saveXPStateHybrid] Failed to save XP to database:', error);
      console.warn('XP saved to localStorage only');
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
        console.log('[loadXPStateHybrid] Loaded from database:', {
          totalXP: xpState.totalXP,
          level: xpState.level,
          transactionsCount: Array.isArray(xpState.transactions) ? xpState.transactions.length : 0
        });
        return {
          totalXP: xpState.totalXP || 0,
          level: xpState.level || 1,
          transactions: Array.isArray(xpState.transactions) ? xpState.transactions : [],
        };
      } else {
        const errorText = await response.text();
        console.warn('[loadXPStateHybrid] Failed to load XP from database:', response.status, errorText);
      }
    } catch (error) {
      console.warn('[loadXPStateHybrid] Failed to load XP from database, falling back to localStorage:', error);
    }
  }

  // Fallback to localStorage
  const { getXPState } = await import('./xp-system');
  const localXP = getXPState();
  console.log('[loadXPStateHybrid] Using localStorage fallback:', localXP);
  return localXP;
}

