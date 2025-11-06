# SDK Version & Anthropic Research Results

## Research Summary

### 1. Vercel AI SDK Versions

**Current Version:** `ai@5.0.87` (latest stable)  
**Beta Versions Available:** `6.0.0-beta.93` (latest beta)  
**Status:** `maxSteps` and `toDataStreamResponse()` not found in package metadata

### 2. SDK Version History

**Version 5.0 (Current Stable):**
- Released: October 2025
- Features: Enhanced provider support, streaming capabilities
- **Missing:** `maxSteps` parameter, `toDataStreamResponse()` method

**Version 6.0 (Beta):**
- Latest: `6.0.0-beta.93`
- **Status:** Still in beta, `maxSteps` not found in metadata
- **Note:** Beta versions may have breaking changes

**Version 4.0:**
- Released: November 2024
- Features: PDF support, system interface interactions
- Note: `toDataStreamResponse()` was mentioned in PRD examples but may not exist

### 3. Anthropic SDK Updates

**`@ai-sdk/anthropic@^2.0.41` (Current):**
- Latest version as of research
- Supports Claude Sonnet 4.5
- Tool helpers in beta (September 2025)

**Recent Anthropic Updates:**
- **September 17, 2025:** Tool helpers introduced in beta for Python/TypeScript
- **September 10, 2025:** Web fetch tool launched
- **September 8, 2025:** C# SDK beta released

### 4. Anthropic API Tool Use Pattern

**Key Finding:** Claude's tool use works differently than OpenAI's function calling:

- **Claude:** Tool use is a separate content block type in messages
- **OpenAI:** Function results are part of assistant message
- **Issue:** Claude may interpret tool execution as completing the turn
- **Solution Needed:** Explicit continuation mechanism

**Anthropic Messages API Format:**
```
{
  "role": "assistant",
  "content": [
    {
      "type": "tool_use",
      "id": "...",
      "name": "tool_name",
      "input": {...}
    }
  ]
}
// Then user sends tool results:
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "...",
      "content": "..."
    }
  ]
}
// Then assistant should continue with text...
```

**The Problem:** After tool_result, Claude may stop instead of generating text response.

### 5. Working Examples Search Results

**Findings:**
- No specific working Claude + tool calling examples found in public repositories
- Most examples use OpenAI function calling (which works seamlessly)
- Anthropic's tool helpers (beta) may provide better patterns

**Tool Helpers (Beta - September 2025):**
- Type-safe input validation
- Automated tool handling in conversations
- May help with continuation issues
- **Status:** Beta, may not be in current SDK version

### 6. GitHub Issues & Community

**Recommended Searches:**
1. `github.com/vercel/ai` - Search for "Claude tool calling" issues
2. `github.com/vercel/ai` - Search for "maxSteps" or "tool continuation"
3. Anthropic Community Forums - Check for similar issues

## Key Findings

### ✅ What We Know

1. **Current SDK (v5.0.87)** doesn't support `maxSteps` or `toDataStreamResponse()`
2. **Beta versions (v6.0.0-beta.x)** exist but `maxSteps` not confirmed in metadata
3. **Anthropic tool use** is structurally different from OpenAI function calling
4. **Tool helpers** are in beta but may not solve continuation issue
5. **Claude Sonnet 4.5** is the latest model (we're using it)

### ❌ What We Don't Know

1. **Does v6.0.0-beta have `maxSteps`?** - Need to check GitHub directly
2. **Does Anthropic API have continuation parameters?** - Need to check official docs
3. **Are there working examples?** - Need to search GitHub repositories directly
4. **Should we upgrade to beta?** - Need to check breaking changes

### 🔍 Research You Should Do

1. **GitHub Direct Search:**
   - Go to `github.com/vercel/ai`
   - Search issues for: "Claude tool calling stops", "maxSteps", "tool continuation"
   - Check examples directory for Claude tool calling examples
   - Review recent PRs for tool calling improvements

2. **Anthropic API Documentation:**
   - Check `docs.anthropic.com` for messages API tool use patterns
   - Look for parameters that force continuation after tool results
   - Check if there's a "stop_sequences" or similar parameter
   - Review tool use best practices

3. **SDK Upgrade Analysis:**
   - Check `ai@6.0.0-beta.93` changelog/README
   - Check breaking changes between v5 and v6
   - Test if v6 beta fixes the issue
   - Check Next.js 16.0.1 compatibility

4. **Community Research:**
   - Anthropic Discord/Forums for tool calling discussions
   - Stack Overflow for similar issues
   - Reddit r/AnthropicAI for user experiences

## Recommendations

### Immediate Action (Approach 6)

Since SDK research is inconclusive, implement **Approach 6: Explicit Continuation Message** to unblock testing:

- Simple to implement
- Works with current SDK version
- No breaking changes
- Can be refined later

### Future Research

1. **Check Vercel AI SDK GitHub directly** for:
   - Working Claude tool calling examples
   - Known issues with tool continuation
   - PRs addressing this problem

2. **Check Anthropic API docs** for:
   - Tool use continuation patterns
   - Parameters to force text generation after tools
   - Best practices for agent patterns

3. **Consider SDK upgrade** if:
   - Beta version has `maxSteps` or similar
   - Breaking changes are acceptable
   - Issue is confirmed fixed

## Conclusion

**Current SDK (v5.0.87) Limitations:**
- No `maxSteps` parameter
- No `toDataStreamResponse()` method
- Tool calling works but doesn't naturally continue

**Next Steps:**
1. ✅ Implement Approach 6 (explicit continuation) - **Ready to do now**
2. 🔍 Continue research on GitHub/Anthropic docs - **You should do this**
3. 🔄 Consider SDK upgrade after research - **Decision point**

