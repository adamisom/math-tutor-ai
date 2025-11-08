/**
 * Unit Tests for Feature Flags
 * 
 * Tests LaTeX feature flag logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { isLaTeXEnabled, setLaTeXEnabled } from '../../app/lib/feature-flags';

// Mock window and localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

describe('isLaTeXEnabled', () => {
  beforeEach(() => {
    // Reset mocks
    mockLocalStorage.clear();
    delete (process.env as { NEXT_PUBLIC_ENABLE_LATEX?: string }).NEXT_PUBLIC_ENABLE_LATEX;
  });

  it('should default to enabled when no flags are set', () => {
    // Mock window without localStorage override
    global.window = {
      localStorage: mockLocalStorage,
    } as unknown as Window & typeof globalThis;
    
    // No localStorage or env var set - should default to true (LaTeX is enabled by default)
    expect(isLaTeXEnabled()).toBe(true);
  });

  it('should respect localStorage override (client-side)', () => {
    // Mock window and localStorage
    global.window = {
      localStorage: mockLocalStorage,
    } as unknown as Window & typeof globalThis;
    
    // Set localStorage override
    mockLocalStorage.setItem('feature:latex', 'false');
    expect(isLaTeXEnabled()).toBe(false);
    
    // Test enabled
    mockLocalStorage.setItem('feature:latex', 'true');
    expect(isLaTeXEnabled()).toBe(true);
  });

  it('should use environment variable when localStorage not set', () => {
    // Mock window without localStorage override
    global.window = {
      localStorage: mockLocalStorage,
    } as unknown as Window & typeof globalThis;
    
    // Set environment variable
    process.env.NEXT_PUBLIC_ENABLE_LATEX = 'false';
    expect(isLaTeXEnabled()).toBe(false);
    
    // Test enabled
    process.env.NEXT_PUBLIC_ENABLE_LATEX = 'true';
    expect(isLaTeXEnabled()).toBe(true);
  });

  it('should prioritize localStorage over environment variable', () => {
    // Mock window with localStorage
    global.window = {
      localStorage: mockLocalStorage,
    } as unknown as Window & typeof globalThis;
    
    // Set both
    mockLocalStorage.setItem('feature:latex', 'false');
    process.env.NEXT_PUBLIC_ENABLE_LATEX = 'true';
    
    // localStorage should win
    expect(isLaTeXEnabled()).toBe(false);
  });

  it('should handle missing environment variable gracefully', () => {
    // Mock window without localStorage
    global.window = {
      localStorage: mockLocalStorage,
    } as unknown as Window & typeof globalThis;
    
    // No env var set
    delete (process.env as { NEXT_PUBLIC_ENABLE_LATEX?: string }).NEXT_PUBLIC_ENABLE_LATEX;
    
    // Should default to true (LaTeX is enabled by default)
    expect(isLaTeXEnabled()).toBe(true);
  });
});

describe('setLaTeXEnabled', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  it('should set localStorage value (client-side)', () => {
    global.window = {
      localStorage: mockLocalStorage,
    } as unknown as Window & typeof globalThis;
    
    setLaTeXEnabled(false);
    expect(mockLocalStorage.getItem('feature:latex')).toBe('false');
    
    setLaTeXEnabled(true);
    expect(mockLocalStorage.getItem('feature:latex')).toBe('true');
  });

  it('should not throw when window is undefined (server-side)', () => {
    const originalWindow = global.window;
    // @ts-expect-error - intentionally removing window
    delete global.window;
    
    // Should not throw
    expect(() => setLaTeXEnabled(false)).not.toThrow();
    expect(() => setLaTeXEnabled(true)).not.toThrow();
    
    global.window = originalWindow;
  });
});

