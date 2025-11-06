# AI SDK Version Analysis & Provider Choice

## Current Setup

### Current Versions
- **Vercel AI SDK**: `ai@5.0.87`
- **Anthropic SDK**: `@ai-sdk/anthropic@^2.0.41`
- **Model**: `claude-sonnet-4-5-20250929`

### What's Missing in Current Version (v5.0.87)

1. **`maxSteps` parameter** ❌
   - Not available in `streamText()` for this version
   - Would allow controlling how many tool call rounds occur
   - Needed to ensure Claude continues after tool execution

2. **`toDataStreamResponse()` method** ❌
   - Not available in this SDK version
   - Would provide better tool call handling
   - Currently only `toTextStreamResponse()` is available

### What Works in Current Version

✅ Basic `streamText()` with tools  
✅ `toolChoice: 'auto'`  
✅ `toTextStreamResponse()` for streaming  
✅ Tool definitions with Zod schemas  
✅ Anthropic Claude integration  

## Why Claude Was Chosen

### Based on PRD & Architecture Docs

1. **Socratic Methodology Focus**
   - Claude's instruction-following aligns with Socratic questioning
   - Better at maintaining strict "never give direct answers" rule
   - More consistent at following pedagogical guidelines

2. **Vision API Integration**
   - Built-in image extraction capabilities
   - Can process math problem images directly
   - No need for separate OCR service

3. **Large Context Window**
   - 200k token context window
   - Can maintain longer conversation threads
   - Better for multi-step problem solving

4. **Mathematical Reasoning**
   - Strong performance on mathematical problems
   - Better at understanding step-by-step solutions
   - More reliable verification of student work

### Comparison: Claude vs OpenAI

| Feature | Claude (Anthropic) | OpenAI (GPT) |
|---------|-------------------|--------------|
| **Socratic Methodology** | ✅ Excellent at following strict rules | ⚠️ May occasionally give direct answers |
| **Tool Calling** | ❌ Stops after tool execution (current issue) | ✅ Naturally continues after function calls |
| **Vision API** | ✅ Built-in, excellent | ✅ Available (GPT-4 Vision) |
| **Context Window** | ✅ 200k tokens | ✅ 128k tokens (GPT-4 Turbo) |
| **Cost** | 💰 Moderate | 💰 Moderate |
| **Instruction Following** | ✅ Very strong | ✅ Strong |
| **Mathematical Reasoning** | ✅ Excellent | ✅ Excellent |

### Key Trade-off

**Claude's Strength:** Better at following strict Socratic methodology  
**Claude's Weakness:** Tool calling doesn't naturally continue (needs workaround)

**OpenAI's Strength:** Tool calling works seamlessly  
**OpenAI's Weakness:** May occasionally violate "never give direct answers" rule

## SDK Version Research Needed

### Questions to Research

1. **What SDK versions support `maxSteps`?**
   - Check if newer versions (v6.x, v7.x) have this
   - Check if it's Anthropic-specific or universal
   - Check GitHub issues/PRs for this feature

2. **What SDK versions support `toDataStreamResponse()`?**
   - May have been in earlier versions and removed
   - May be in newer versions
   - May be provider-specific

3. **Should we upgrade the SDK?**
   - Check breaking changes between v5.0.87 and latest
   - Check if newer versions fix tool calling issues
   - Check compatibility with Next.js 16.0.1

### Recommended Research Actions

1. **Check Vercel AI SDK GitHub:**
   - Search for "maxSteps" issues/PRs
   - Search for "toDataStreamResponse" issues/PRs
   - Check latest version changelog

2. **Check Anthropic SDK:**
   - Check `@ai-sdk/anthropic` latest version
   - Check if Anthropic has specific parameters for tool continuation
   - Review Anthropic API docs for tool use patterns

3. **Check Example Repositories:**
   - Look for working Claude + tool calling examples
   - See what SDK versions they use
   - Compare implementation patterns

## Alternative Solutions (Current SDK)

Since current SDK doesn't support `maxSteps` or `toDataStreamResponse()`, we need to use:

### Approach 6: Explicit Continuation Message
- Add user message after tool execution
- Simple, works with current SDK
- May affect conversation flow

### Approach 1: Two-Phase Pattern
- Separate tool execution from response generation
- Most reliable, full control
- More API calls, higher latency

### Approach 5: Hybrid Verification
- Verify on server, don't use tools
- Simplest, fastest
- Loses tool transparency

## Recommendation

**Short-term:** Implement Approach 6 (explicit continuation) to unblock testing  
**Research:** Investigate SDK upgrades and alternative patterns  
**Long-term:** Consider if OpenAI's natural tool calling is worth the trade-off for Socratic methodology

