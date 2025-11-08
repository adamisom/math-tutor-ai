# LaTeX Double Rendering - Hypotheses

Based on the observed behavior where the equation "2x + 5 = 13" appears twice:
1. First in a sentence with LaTeX: "Great! Let's work through this equation together: $2x + 5 = 13$"
2. Then on a separate line as plain text: "2x + 5 = 13"

## Hypothesis 1: AI Pattern Behavior (Most Likely) ⭐⭐⭐⭐⭐

**Theory:** The AI has learned a conversational pattern of "introduce equation → show equation separately" from training data or previous interactions.

**Evidence:**
- The pattern is consistent: sentence with equation, then standalone equation
- This is a common teaching pattern ("Let's work with X. [X on new line]")
- The prompt says "NEVER show twice" but doesn't explicitly forbid this specific pattern

**Why prompt might not be working:**
- The AI might interpret "twice" as "same format twice" not "any format twice"
- The prompt doesn't explicitly say "don't show equation on a separate line after mentioning it"
- AI might think showing it separately is helpful for clarity

**Fix:**
- Add explicit instruction: "NEVER show the equation on a separate line after mentioning it in a sentence"
- Add example: ❌ "Let's work with $2x + 5 = 13$\n\n$2x + 5 = 13$" (wrong - showing twice)
- Add: "If you mention an equation in a sentence, that's enough - don't repeat it"

---

## Hypothesis 2: Prompt Not Strong Enough ⭐⭐⭐⭐

**Theory:** The current prompt warnings aren't strong enough or positioned correctly in the prompt hierarchy.

**Evidence:**
- The formatting rules are in section 5, but might be getting overridden by other instructions
- The "NEVER show twice" rule might not be emphasized enough
- Other instructions (like "be clear", "help student understand") might conflict

**Why it might not work:**
- Prompt engineering: Rules lower in the prompt might have less weight
- The AI might prioritize "being helpful" over "formatting rules"
- Multiple conflicting instructions (be clear vs don't repeat)

**Fix:**
- Move formatting rules to the top (right after critical rules)
- Add to CRITICAL RULES section: "NEVER show any equation twice in any form"
- Use stronger language: "ABSOLUTELY FORBIDDEN", "CRITICAL VIOLATION"
- Add negative examples in multiple places

---

## Hypothesis 3: AI Doesn't Recognize Plain Text as "Same Equation" ⭐⭐⭐

**Theory:** The AI generates LaTeX correctly, but then adds plain text thinking it's "explaining" or "clarifying" the equation.

**Evidence:**
- The plain text appears on a new line, suggesting it's intentional
- The AI might think: "I showed LaTeX, now let me show it in plain text so they understand"
- Pattern suggests the AI thinks it's being helpful

**Why prompt might not work:**
- The prompt says "NEVER show both LaTeX and plain text" but AI might not recognize plain text "2x + 5 = 13" as the "same equation" as "$2x + 5 = 13$"
- AI might think showing both formats is helpful for learning

**Fix:**
- Be more explicit: "If you show $2x + 5 = 13$, you MUST NOT also show '2x + 5 = 13' anywhere else in your response"
- Add: "Showing an equation in LaTeX is sufficient - do NOT also show it in plain text"
- Add example: "If you write '$2x + 5 = 13$', you cannot write '2x + 5 = 13' anywhere else"

---

## Hypothesis 4: Rendering Issue (Unlikely) ⭐⭐

**Theory:** The rendering code is somehow showing both LaTeX and plain text from the same message.

**Evidence:**
- The code looks correct - it parses LaTeX and renders it, text parts are separate
- But maybe there's a bug where LaTeX fallback shows AND the text shows?

**Why unlikely:**
- The code clearly separates LaTeX from text
- MathErrorBoundary fallback would show raw LaTeX, not plain text
- The plain text "2x + 5 = 13" appears to be from the AI's actual response

**Fix:**
- Check if MathErrorBoundary fallback is being used incorrectly
- Verify that text parts don't accidentally contain the equation
- Add logging to see what the AI actually generated

---

## Hypothesis 5: AI Training Data Pattern ⭐⭐⭐⭐

**Theory:** The AI's training data contains many examples of "introduce equation, then show it separately" as a teaching pattern.

**Evidence:**
- This is a common pattern in math education materials
- Many textbooks and tutorials use this format
- The AI might have learned this as "best practice"

**Why prompt might not work:**
- Training data patterns can be very strong
- The AI might think this pattern is helpful despite instructions
- Need very explicit counter-instruction

**Fix:**
- Add explicit counter-example: "Many teaching materials show equations twice, but you MUST NOT do this"
- Add: "Even though some teaching materials repeat equations, you should only show it once"
- Use few-shot examples showing the WRONG way and RIGHT way

---

## Hypothesis 6: Prompt Token Limit / Truncation ⭐

**Theory:** The prompt is too long and the formatting rules are getting truncated or deprioritized.

**Evidence:**
- The prompt is quite long
- Formatting rules are in the middle/end
- AI might not be "seeing" all the rules

**Why unlikely:**
- Prompt doesn't seem that long
- Rules are repeated in multiple places
- Other parts of prompt seem to work

**Fix:**
- Move critical formatting rules to the very top
- Condense formatting rules into a shorter, more impactful section
- Use bullet points with strong language

---

## Recommended Fix Strategy

### Priority 1: Strengthen Prompt (Address Hypotheses 1, 2, 3, 5)

1. **Add to CRITICAL RULES (top of prompt):**
   ```
   CRITICAL: NEVER show any equation twice in any form:
   - Not LaTeX + plain text
   - Not LaTeX + bold
   - Not in a sentence AND on a separate line
   - If you mention "$2x + 5 = 13$" in a sentence, that's enough - DO NOT show it again
   ```

2. **Add explicit pattern prohibition:**
   ```
   FORBIDDEN PATTERN (NEVER DO THIS):
   ❌ "Let's work with $2x + 5 = 13$
   
   $2x + 5 = 13$
   
   What should we do?"
   
   CORRECT PATTERN (DO THIS):
   ✅ "Let's work with $2x + 5 = 13$. What should we do?"
   ```

3. **Add to MATH FORMATTING section:**
   ```
   - NEVER show an equation on a separate line after mentioning it in a sentence
   - If you write "Let's work with $2x + 5 = 13$", that's sufficient - don't show it again
   - Showing an equation once in LaTeX is enough - do NOT repeat it in any form
   ```

### Priority 2: Add Few-Shot Examples

Add examples showing the WRONG way (with double rendering) and RIGHT way (single LaTeX):

```
WRONG (showing twice):
"Great! Let's work through this equation together: $2x + 5 = 13$

$2x + 5 = 13$

What do you think would be a good first step?"

RIGHT (showing once):
"Great! Let's work through this equation together: $2x + 5 = 13$. What do you think would be a good first step?"
```

### Priority 3: Add Response Validation (Future)

Consider adding a post-processing step that:
- Detects duplicate equations
- Removes plain text versions if LaTeX version exists
- Logs violations for monitoring

---

## Testing Plan

1. **Update prompt** with stronger prohibitions
2. **Test with same problem** ("2x + 5 = 13")
3. **Check if pattern persists**
4. **If persists, try:**
   - Moving rules to very top
   - Adding more negative examples
   - Using different phrasing
   - Adding response validation

---

## Most Likely Root Cause

**Hypothesis 1 + 5 combined:** The AI has learned a teaching pattern from training data where you "introduce equation, then show it separately" and this pattern is strong enough to override the prompt instructions. The prompt needs to be more explicit about this specific pattern being forbidden.

