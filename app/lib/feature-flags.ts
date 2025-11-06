/**
 * Feature flags for enabling/disabling features
 */

/**
 * Check if LaTeX rendering is enabled
 * Can be controlled via environment variable or default to true
 */
export function isLaTeXEnabled(): boolean {
  // Check environment variable first
  if (typeof window !== 'undefined') {
    // Client-side: check localStorage for override
    const stored = localStorage.getItem('feature:latex');
    if (stored !== null) {
      return stored === 'true';
    }
  }
  
  // Server-side or no localStorage override: check env var
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ENABLE_LATEX !== undefined) {
    return process.env.NEXT_PUBLIC_ENABLE_LATEX === 'true';
  }
  
  // Default: disabled (until double rendering bug is fixed)
  return false;
}

/**
 * Set LaTeX feature flag (client-side only)
 */
export function setLaTeXEnabled(enabled: boolean): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('feature:latex', enabled ? 'true' : 'false');
  }
}

