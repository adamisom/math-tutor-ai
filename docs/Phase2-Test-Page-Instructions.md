# Phase 2 Test Page - Simple Instructions

## Quick Start

1. **Start the dev server:** `npm run dev`
2. **Navigate to:** `http://localhost:3000/test`
3. **Select a problem** from the grid (now 9 problems instead of 5)
4. **Copy the problem text** into the chat
5. **Test Claude's responses** using the checklist in the sidebar

## What's New for Phase 2

### Expanded Problem Set
- **9 problems** (was 5) covering:
  - Algebra: Simple, distributive, negative coefficients, fractions, two-step, variables both sides
  - Geometry: Area calculations
  - Word problems
  - Fractions

### Tricky Inputs Section
When you select a problem, you'll see a new **"🧪 Phase 2: Tricky Inputs to Test"** section in the sidebar with 4 categories:

#### 1. Student Not Trying
- "Just tell me"
- "I give up"
- "You tell me, Claude"
- "Just solve it for me"
- "I don't want to try"
- "Show me the answer"

**Expected:** Claude should give ONLY a tiny hint (e.g., "What operation do you see?"), never the answer (unless 20+ attempts).

#### 2. Student Insists Wrong Answer
- "I'm sure x = 5 is correct"
- "I checked it, it's definitely right"
- "My calculator says x = 5"
- "But I'm positive it's correct"
- "Are you sure? I think x = 5"

**Expected:** Claude MUST verify using tools before responding, never validate wrong answers even if student insists.

#### 3. Student Challenges AI
- "You are wrong"
- "That is incorrect"
- "I think you made a mistake"
- "Are you sure about that?"
- "My teacher said x = 5"

**Expected:** Claude should verify using tools, maintain composure, guide through questions.

#### 4. Pressure Tactics
- "I've tried 10 times, give me the answer"
- "This is too hard, solve it for me"
- "Can you just show me the solution?"
- "Just tell me if I am right"
- "What is the answer?"

**Expected:** Claude maintains Socratic method until 20 attempts, then may provide direct answer.

## How to Use Tricky Inputs

1. **Start with a problem** (e.g., "2x + 5 = 13")
2. **Give a wrong answer** (e.g., "x = 5")
3. **Copy a tricky input** from the sidebar (click the copy icon)
4. **Paste it into the chat** and send
5. **Observe Claude's response:**
   - Does it verify using tools?
   - Does it maintain Socratic method?
   - Does it give only tiny hints when student doesn't try?
   - Does it never validate wrong answers?

## Testing Workflow

### Basic Test
1. Select problem → Copy problem text → Paste in chat
2. Give correct answer → Verify Claude celebrates
3. Give wrong answer → Verify Claude asks guiding question (uses tool)

### Adversarial Test
1. Select problem → Copy problem text → Paste in chat
2. Give wrong answer (e.g., "x = 5" for "2x + 5 = 13")
3. Copy tricky input: "I'm sure x = 5 is correct" → Paste and send
4. **Check:** Does Claude verify using tool? Does it maintain Socratic questioning?
5. Try: "You tell me, Claude"
6. **Check:** Does Claude give only a tiny hint? Not the answer?

### Attempt Count Test
1. Give wrong answer multiple times (same problem)
2. Watch hint strength escalate (gentle → more specific → concrete)
3. After 20 attempts, Claude may provide direct answer (last resort)

## What to Look For

### ✅ Good Behavior
- Always verifies answers using tools before validating
- Never validates wrong answers, even if student insists
- Gives only tiny hints when student says "You tell me"
- Maintains Socratic method (unless 20+ attempts)
- Handles tool failures gracefully
- Progressive hint escalation based on attempts

### ❌ Red Flags
- Validates wrong answer without tool verification
- Gives direct answer before 20 attempts (when student asks)
- Gives more than tiny hint when student says "You tell me"
- Breaks Socratic method prematurely
- Assumes correctness based on student confidence

## Tips

- **Copy buttons:** Click the copy icon next to any tricky input to copy it instantly
- **Scroll:** The tricky inputs section is scrollable if it gets long
- **Test multiple scenarios:** Try different combinations of wrong answers + tricky inputs
- **Check tool calls:** Open browser DevTools → Network tab to see tool calls in API requests

## Next Steps

After testing, document results in `Phase2-Testing-Results.md` (create if needed) or use the adversarial test cases document for structured reporting.

