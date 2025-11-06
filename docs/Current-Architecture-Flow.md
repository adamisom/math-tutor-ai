# Current Architecture & Flow - Tool Calling Issue Analysis

## Current Architecture Overview

### 1. Client-Side Flow (`app/components/chat-interface.tsx`)

```text
User Input → POST /api/chat
  ↓
Request Body:
  - messages: Array of {role, content}
  - attemptMetadata: {previousProblem, problemSignature, attemptCount}
  ↓
Stream Response → Read chunks → Accumulate → Update UI
```

### 2. API Route Flow (`app/api/chat/route.ts`)

```text
POST /api/chat
  ↓
1. Validate API key
2. Parse & validate messages
3. Extract problem context
4. Manage attempt tracking
5. Generate system prompt with context
  ↓
6. Call streamText():
   - model: claude-sonnet-4-5-20250929
   - system: [Socratic prompt]
   - messages: [conversation]
   - tools: mathVerificationTools (6 tools)
   - toolChoice: 'auto'
   - maxSteps: 7
  ↓
7. Return result.toTextStreamResponse()
```

### 3. Tool Definition Flow (`app/lib/math-tools.ts`)

```text
Tool Definition:
  - Uses tool() wrapper from 'ai' package
  - Zod schema for input validation
  - execute() function that:
    1. Logs call (dev mode)
    2. Calls verification function
    3. Logs result (dev mode)
    4. Returns result object
```

### 4. Tool Execution Flow

```text
Claude decides to call tool
  ↓
Tool.execute() called
  ↓
[Tool Call] logged
  ↓
Verification function executes
  ↓
[Tool Result] logged
  ↓
Result returned to Claude
  ↓
❌ PROBLEM: Claude doesn't generate text response
```

## Current Issue

**Symptom:**

- Tool executes successfully ✅
- Tool result is logged ✅
- But no text response from Claude ❌
- No errors in logs ❌

**What's Working:**

- Tool calls are being made
- Tools execute correctly
- Results are returned
- Streaming response is created

**What's Not Working:**

- Claude stops after receiving tool result
- No text generation after tool execution
- Even with maxSteps: 7, no continuation

## Potential Issues

### Issue 1: Tool Result Format

- Tool returns object: `{is_correct: false, verification_steps: "..."}`
- Maybe Claude expects a different format?
- Or maybe the result needs to be formatted differently?

### Issue 2: Prompt Instructions

- We have explicit instructions to respond after tool calls
- But maybe Claude isn't seeing them or they're not strong enough?
- Or maybe there's a conflict in the prompt?

### Issue 3: Vercel AI SDK Configuration

- Maybe `toTextStreamResponse()` doesn't handle tool results properly?
- Maybe we need to use `toDataStreamResponse()` instead?
- Or maybe we need to handle the stream differently?

### Issue 4: maxSteps Not Working

- Set to 7, but maybe it's not being respected?
- Or maybe Claude is hitting some other limit?

### Issue 5: Tool Result Processing

- Maybe Claude needs the tool result in a specific format?
- Or maybe the tool description doesn't tell Claude what to do with the result?

## Next Steps for Investigation

1. ✅ Check if tool results need to be formatted differently
2. ✅ Try using `toDataStreamResponse()` instead of `toTextStreamResponse()`
3. ✅ Add more explicit instructions about what to do with tool results
4. Add logging to see stop_reason and stream events
5. Check if tool result format is causing issues
6. Verify maxSteps is actually being respected

## Key Insights from Research

1. **stop_reason field**: Claude might be returning `stop_reason: "end_turn"` after tool execution, thinking the turn is complete
2. **Text blocks after tools**: Should NOT add text blocks immediately after tool results - this can teach Claude to expect user input
3. **toDataStreamResponse()**: The PRD example uses `toDataStreamResponse()` instead of `toTextStreamResponse()` - might be needed for tool calls
4. **Tool result processing**: Claude might need explicit instructions on how to process tool results

## Potential Solutions to Try

### Solution 1: Use toDataStreamResponse()

```typescript
return result.toDataStreamResponse();
```

This might handle tool calls better than `toTextStreamResponse()`.

### Solution 2: Add explicit tool result handling instructions

Add to prompt:

"After receiving a tool result, you MUST immediately generate a response to the student. The tool result is for YOUR use only - you must process it and respond in your own words."

### Solution 3: Check stop_reason

Add logging to see why Claude stops:

```typescript
const fullStream = result.fullStream;
for await (const chunk of fullStream) {
  if (chunk.type === 'finish') {
    console.log('Finish reason:', chunk.finishReason);
  }
}
```

### Solution 4: Increase maxSteps further

Try maxSteps: 10 or even 15 to see if it's a step limit issue.

### Solution 5: Tool result format

Maybe the tool result object needs to be simpler or formatted differently for Claude to process it.
