# Tool Call Duplication - Root Cause Analysis

## Current Hypothesis

The duplication is caused by a **feedback loop** between injected tool call markers and the conversation history:

### The Duplication Flow

1. **First Request Cycle:**
   ```
   User sends: "2 * 5 = 7"
   ↓
   Server: Claude calls tool, we inject markers
   ↓
   Stream sent to client: "[TOOL_CALL_START]...tool info...[TOOL_CALL_END]...response..."
   ↓
   Client accumulates: assistantMessage.content = "[TOOL_CALL_START]...tool info...[TOOL_CALL_END]...response..."
   ```

2. **Second Request Cycle (when user responds again):**
   ```
   Client sends messages: [
     {role: 'user', content: "2 * 5 = 7"},
     {role: 'assistant', content: "[TOOL_CALL_START]...tool info...[TOOL_CALL_END]...response..."}  // ← Contains markers!
   ]
   ↓
   Server receives: validMessages includes assistant message WITH tool call markers
   ```

3. **Continuation Request (Approach 6):**
   ```
   continuationMessages = [
     ...validMessages,  // ← Includes assistant message with tool call markers!
     {role: 'user', content: 'Please respond based on tool results...'}
   ]
   ↓
   Claude sees conversation history with tool call markers
   ↓
   Claude's continuation response might:
     a) Echo/reference the tool call information it sees
     b) Include text that accidentally matches our marker patterns
     c) Include the tool call content as part of its explanation
   ```

## Evidence Supporting This Hypothesis

1. **Tool call markers are in conversation history:**
   - We inject markers into the stream (server-side)
   - Client accumulates them into `assistantMessage.content`
   - Client sends ALL messages back on next request (line 112-115 in chat-interface.tsx)
   - Those messages include the assistant message with markers

2. **Continuation includes full history:**
   - `continuationMessages = [...validMessages, ...]` (line 215-221)
   - `validMessages` includes the assistant's previous response with markers

3. **Continuation response streams directly:**
   - We only filter `text-delta` chunks (line 237)
   - We don't filter or sanitize the text content
   - If Claude's response includes marker-like text, it gets parsed again

## Why This Creates Duplicates

**Scenario A: Claude Echoes Tool Call Content**
- Claude sees `[TOOL_CALL_START]...` in conversation history
- Claude's continuation response might include similar text: "I see the tool call showed..."
- Our parser sees `[TOOL_CALL_START]` in the continuation response text
- Parser treats it as a new tool call block
- Duplicate appears!

**Scenario B: Marker Pattern Collision**
- Our markers are: `[TOOL_CALL_START]`, `[TOOL_CALL_END]`, etc.
- If Claude's natural language happens to include these exact strings
- Parser incorrectly identifies them as tool call blocks

**Scenario C: Continuation Response References Tool Results**
- Claude sees tool results in conversation history
- Continuation response might format similar information
- If formatted similarly, parser might match it

## Why Duplicate Detection Doesn't Fully Help

1. **Server-side duplicate detection (ToolCallInjector):**
   - Only tracks tool calls from the ORIGINAL stream
   - Doesn't know about continuation response text
   - Can't prevent parsing of continuation text

2. **Client-side duplicate detection (parseToolCallBlocks):**
   - Happens AFTER streaming completes
   - During streaming, duplicates appear and then get filtered
   - User sees the flash because content streams in real-time

## The Real Problem

We're injecting developer-only markers into the conversation stream, but then:
1. Those markers become part of the conversation history
2. They get sent back to the server on subsequent requests
3. They appear in continuation requests
4. Claude might echo or reference them
5. Our parser can't distinguish between "real" injected markers and "echoed" text

## Potential Solutions

### Solution 1: Don't Include Tool Call Markers in Conversation History
- Strip markers before saving to client state
- Only show them in UI, but don't send them back
- Pros: Clean separation, no feedback loop
- Cons: Requires tracking what's "display-only" vs "conversation"

### Solution 2: Use Non-Textual Markers
- Instead of text markers like `[TOOL_CALL_START]`, use special unicode or binary markers
- Pros: Claude can't accidentally echo them
- Cons: More complex, harder to debug

### Solution 3: Filter Continuation Response Text
- Before streaming continuation response, check if it contains our markers
- If so, remove or escape them
- Pros: Simple fix
- Cons: Might miss edge cases

### Solution 4: Separate Tool Call Data from Conversation
- Store tool calls separately (not in message content)
- Render them in UI but don't include in API requests
- Pros: Clean architecture
- Cons: Requires refactoring message structure

### Solution 5: Sanitize validMessages Before Continuation
- Strip tool call markers from `validMessages` before sending to continuation
- Pros: Prevents feedback loop
- Cons: Need to identify and strip markers

## Recommended Investigation Steps

1. **Add logging to see what's in continuationMessages:**
   ```typescript
   console.log('[Continuation] Messages:', JSON.stringify(continuationMessages, null, 2));
   ```

2. **Check if continuation response text contains markers:**
   ```typescript
   if (chunk.text.includes('[TOOL_CALL_START]')) {
     console.log('[Continuation] Found marker in response text!');
   }
   ```

3. **Verify what's in validMessages:**
   - Check if assistant messages contain tool call markers
   - Log the content of assistant messages before continuation

4. **Test with a simple case:**
   - Send one message
   - Check if tool call appears in next request's messages
   - Trace through continuation request

## Most Likely Root Cause

**The conversation history includes tool call markers, and Claude's continuation response is either:**
1. Echoing those markers literally
2. Generating text that accidentally matches our marker patterns
3. Including tool call information in a format that triggers our parser

The fix should prevent markers from being included in conversation history sent to Claude, OR filter/sanitize the continuation response to prevent marker parsing.

