# LaTeX Rendering Feature Flag

## Overview

LaTeX math rendering can be enabled/disabled via a feature flag. This allows you to easily toggle LaTeX rendering without reverting code changes.

## How to Control the Feature Flag

### Method 1: Environment Variable (Recommended for Production)

Add to `.env.local`:
```bash
NEXT_PUBLIC_ENABLE_LATEX=true   # Enable LaTeX rendering
NEXT_PUBLIC_ENABLE_LATEX=false  # Disable LaTeX rendering (shows raw $...$ text)
```

### Method 2: Browser localStorage (For Quick Testing)

Open browser console and run:
```javascript
// Enable LaTeX
localStorage.setItem('feature:latex', 'true');
location.reload();

// Disable LaTeX
localStorage.setItem('feature:latex', 'false');
location.reload();
```

## Priority Order

1. **localStorage** (highest priority) - If set, this overrides everything
2. **Environment variable** (`NEXT_PUBLIC_ENABLE_LATEX`) - Used if localStorage not set
3. **Default** - Enabled by default if neither is set

## Behavior

- **When Enabled**: Math expressions like `$x^2 + 5$` render as formatted equations
- **When Disabled**: Math expressions show as plain text (e.g., `$x^2 + 5$` appears literally)

## Testing

To test with LaTeX disabled:
1. Set `NEXT_PUBLIC_ENABLE_LATEX=false` in `.env.local`
2. Restart dev server: `npm run dev`
3. Math expressions will show as plain text

To test with LaTeX enabled:
1. Set `NEXT_PUBLIC_ENABLE_LATEX=true` in `.env.local` (or remove it for default)
2. Restart dev server
3. Math expressions will render beautifully

## Code Location

- Feature flag logic: `app/lib/feature-flags.ts`
- LaTeX rendering: `app/components/math-renderer.tsx`
- Integration: `app/components/message-list.tsx`

