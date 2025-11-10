# Attempt Tracking: Client vs Server

## Two Layers

### 1. Client-Side Tracking (localStorage)

**Purpose:** Persist attempt counts across page refreshes and sessions

**What it does:**

- Stores attempt counts per problem signature in browser localStorage
- Survives page refreshes and browser restarts
- Fast - no network calls needed

**Location:** `app/lib/attempt-tracking.ts`

**Example:**

```typescript
// User attempts problem "2x + 5 = 13"
const signature = generateProblemSignature("2x + 5 = 13");
incrementAttemptCount(signature); // Stores in localStorage
const count = getAttemptCount(signature); // Returns 1, 2, 3...
```

### 2. Sending to Server (API Request)

**Purpose:** Allow server to use attempt count in prompts

**What it does:**

- Client reads from localStorage
- Includes attempt metadata in API request body
- Server uses it to adjust prompt (e.g., "After 20 attempts, provide direct answer")

**Location:** `app/components/chat-interface.tsx` (sends) + `app/api/chat/route.ts` (receives)

**Example:**

```typescript
// Client sends:
{
  messages: [...],
  attemptMetadata: {
    previousProblem: "2x + 5 = 13",
    problemSignature: "x=|2|5|13|+|=|",
    attemptCount: 3  // ← From localStorage
  }
}

// Server uses:
const systemPrompt = getSocraticPrompt({
  attemptCount: attemptMetadata.attemptCount, // ← Adjusts prompt
  // ...
});
```

## Why Both?

- **Client-side:** Persistence + fast access
- **Server-side:** Prompt adjustment based on attempt count
- **Together:** Complete solution that persists across sessions and adjusts prompts

## Current Implementation Status

✅ **FULLY INTEGRATED**

The client-side tracking and server metadata sending is **already implemented** in:

- `app/components/chat-interface.tsx` - Tracks attempts and sends metadata
- `app/api/chat/route.ts` - Receives and uses attempt metadata in prompts

**How it works:**

1. User sends message → Client tracks in localStorage
2. Client sends API request with `attemptMetadata` in body
3. Server receives metadata and uses `attemptCount` in prompt
4. Prompt adjusts based on attempt count (1-3, 4-19, 20+)

## Security Note

⚠️ **Client-side tracking is manipulable** - users can clear localStorage or modify values.

For anti-cheating, move tracking server-side with:

- Database storage
- User authentication
- Rate limiting
