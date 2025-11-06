# Tool Calling Research & Alternative Approaches

## Key Finding: Claude vs OpenAI Tool Calling Differences

### OpenAI API Pattern (What Works for You)

- Function calling is built into the completion response
- After tool execution, OpenAI naturally continues generating text
- Tool results are seamlessly integrated into the conversation flow
- No special configuration needed for continuation

### Claude API Pattern (What We're Using)

- Tool use is a separate content block type in messages
- Claude may interpret tool execution as "completing the turn"
- Requires explicit continuation instructions
- May need different message format or configuration

## Research Findings

### Pattern Differences

1. **Message Format Differences:**
   - OpenAI: Function results are part of assistant message
   - Claude: Tool use and results are separate content blocks
   - This structural difference might cause Claude to think the turn is complete

2. **SDK Handling:**
   - Vercel AI SDK abstracts both, but implementation may differ
   - `toTextStreamResponse()` might not handle Claude's tool use format properly
   - `toDataStreamResponse()` might be required for Claude tool calls

3. **maxSteps Behavior:**
   - With OpenAI, maxSteps naturally continues after tools
   - With Claude, maxSteps might need to be higher or configured differently
   - Claude might count tool execution as a "step" differently than OpenAI

## Alternative Approaches

### Approach 1: Two-Phase Pattern (Recommended First Try)

Instead of relying on Claude to continue after tools, handle it explicitly:

```typescript
// Phase 1: Tool Execution
const toolResult = await executeToolCall();
// Phase 2: Explicit Continuation Request
const continuationPrompt = `Based on the tool result: ${JSON.stringify(toolResult)}, 
generate a Socratic response to guide the student.`;
const response = await streamText({
  model: anthropic(...),
  messages: [...messages, {role: 'user', content: continuationPrompt}]
});
```

**Pros:**

- Guaranteed text generation after tool
- Full control over flow
- Works with any model

**Cons:**

- More API calls
- Higher latency
- More complex logic

### Approach 2: Tool Result Preprocessing

Wrap tool results to force continuation:

```typescript
execute: async ({ equation, claimed_solution }) => {
  const result = verifyEquationSolution(equation, claimed_solution);
  // Add continuation hint to result
  return {
    ...result,
    _continuation_hint: "Now respond to the student with a Socratic question based on this result"
  };
}
```

### Approach 3: Custom Stream Wrapper

Intercept tool results and inject continuation:

```typescript
const stream = new ReadableStream({
  async start(controller) {
    for await (const chunk of result.fullStream) {
      if (chunk.type === 'tool-result') {
        // After tool result, inject continuation instruction
        controller.enqueue(encoder.encode(
          "\n[System: Continue with Socratic response based on tool result]\n"
        ));
      }
      // Forward other chunks
    }
  }
});
```

### Approach 4: Switch to Data Stream (Requires Client Changes)

Update both server and client to use data stream format:

**Server:**

```typescript
return result.toDataStreamResponse();
```

**Client:**

```typescript
import { readDataStream } from 'ai';
const { text } = await readDataStream(response.body);
```

**Pros:**

- Proper handling of tool calls
- Better metadata access
- Recommended by Vercel AI SDK for tool calls

**Cons:**

- Requires client-side refactoring
- Need to update stream parsing logic

### Approach 5: Hybrid Verification Pattern

Don't use tools for verification - verify on server, then guide:

```typescript
// Server-side verification (no tool call)
const isCorrect = verifyEquationSolution(equation, solution);
// Add verification result to prompt context
const prompt = `${systemPrompt}\n\nVerification Result: ${isCorrect ? 'Correct' : 'Incorrect'}. 
Now guide the student with Socratic questions.`;
```

**Pros:**

- No tool calling issues
- Faster (no tool call round-trip)
- Simpler architecture

**Cons:**

- Claude doesn't "see" verification process
- Less transparent
- Might feel less interactive

### Approach 6: Explicit Tool Result Message Pattern

After tool execution, add explicit user message to continue:

```typescript
// In messages array, after tool result:
messages.push({
  role: 'user',
  content: 'Please respond to the student based on the tool result above.'
});
```

**Pros:**

- Forces continuation
- Simple to implement
- Works with current setup

**Cons:**

- Adds artificial message
- Might confuse conversation history
- Not ideal UX

### Approach 7: Conditional Tool Calling

Only use tools when you know Claude will continue:

```typescript
// Don't use tools for verification - use tools for evaluation only
// Verify on server, then use tool for "evaluate expression" if needed
```

### Approach 8: Tool Description Enhancement

Make tool descriptions explicitly require continuation:

```typescript
description: `Verify if a student's solution is correct. 
IMPORTANT: After receiving this result, you MUST immediately generate 
a response to the student. Never stop after calling this tool.`
```

## Recommendations

### Quick Fixes to Try (In Order)

1. **Increase maxSteps to 15-20** - Test if it's a step limit
2. **Add explicit continuation instruction in tool description**
3. **Try Approach 6** - Add explicit continuation message (easiest)
4. **Switch to toDataStreamResponse()** - Requires client changes but might be necessary

### If Quick Fixes Don't Work

1. **Approach 4** - Switch to data stream (most proper solution)
2. **Approach 1** - Two-phase pattern (most reliable)
3. **Approach 5** - Hybrid verification (simplest, but loses tool transparency)

## Questions for Further Research

You might want to research:

1. **Vercel AI SDK GitHub Issues** - Search for "Claude tool calling" or "tool use stops"
2. **Anthropic Claude API Documentation** - Check messages format for tool use continuation
3. **Vercel AI SDK Examples** - Look for working Claude + tool calling examples
4. **Anthropic Community Forums** - See if others have this issue
5. **Check if there's a `toolChoice` setting** that affects continuation behavior

### Approach 9: Stream Interception with Continuation Injection

Intercept the stream and inject continuation prompts when tool results are detected:

```typescript
const stream = new TransformStream({
  transform(chunk, controller) {
    // Parse chunk to detect tool-result
    if (chunk contains 'tool-result') {
      // Inject continuation instruction
      controller.enqueue(encoder.encode(
        "\n[System continuation prompt]\n"
      ));
    }
    controller.enqueue(chunk);
  }
});
```

### Approach 10: Tool Result Formatting

Format tool results as strings instead of objects to force processing:

```typescript
execute: async ({ equation, claimed_solution }) => {
  const result = verifyEquationSolution(equation, claimed_solution);
  // Return as formatted string instead of object
  return `Verification result: ${result.is_correct ? 'Correct' : 'Incorrect'}. 
  ${result.verification_steps}. 
  Now respond to the student with a guiding question.`;
}
```

### Approach 11: Server-Side Verification Only

Don't use tools - verify on server, add to context:

```typescript
// Before calling Claude:
const verificationResult = verifyEquationSolution(equation, solution);
const enhancedPrompt = `${systemPrompt}\n\n[Verification: ${verificationResult.is_correct ? 'Correct' : 'Incorrect'}]\n
Based on this verification, guide the student with Socratic questions.`;
```

### Approach 12: Hybrid Tool Usage

Use tools only for complex calculations, verify simple cases on server:

```typescript
// Simple verification: server-side
// Complex calculations: use tools
// This reduces tool calls and potential issues
```

## Comparison: OpenAI vs Claude Tool Calling

### OpenAI Pattern (What Works)

```text
User: "x = 5"
  ↓
Assistant calls function
  ↓
Function executes
  ↓
Assistant automatically continues with text ✅
```

### Claude Pattern (Current Issue)

```text
User: "x = 5"
  ↓
Assistant calls tool
  ↓
Tool executes
  ↓
Assistant stops ❌ (thinks turn is complete)
```

### Key Difference

- **OpenAI**: Function calling is part of the response generation
- **Claude**: Tool use might be interpreted as completing the assistant's turn
- **Solution**: Need explicit continuation signal or different message format

## Recommended Testing Order

1. ✅ **maxSteps: 15** - Test if it's just a step limit (quick test)
2. ✅ **Tool description enhancement** - Add continuation instruction to tool description
3. **Approach 6** - Add explicit continuation message (easiest code change)
4. **Approach 4** - Switch to `toDataStreamResponse()` (proper solution, requires client changes)
5. **Approach 1** - Two-phase pattern (most reliable, but more complex)
6. **Approach 5** - Hybrid verification (simplest, but loses tool transparency)

## Questions You Should Research

1. **Vercel AI SDK GitHub Issues:**
   - Search: "Claude tool calling stops" or "tool use empty response"
   - Check if there's a known issue or workaround

2. **Anthropic Claude API Documentation:**
   - Check messages API format for tool use continuation
   - Look for examples of continuing conversation after tool use
   - Check if there's a specific parameter for continuation

3. **Vercel AI SDK Examples Repository:**
   - Look for working Claude + tool calling examples
   - Compare with our implementation

4. **Anthropic Community:**
   - Post question about tool use continuation
   - Check if others have this issue

5. **Check toolChoice Options:**
   - Maybe `toolChoice: 'required'` or other options affect behavior
   - Check if there's a way to force continuation

## Next Steps

1. ✅ Try maxSteps: 15 (already implemented)
2. ✅ Add continuation instruction to tool description (already implemented)
3. Test these changes
4. If still broken, implement Approach 6 (add continuation message)
5. If still broken, implement Approach 4 (data stream) - proper solution
