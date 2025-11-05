# Phase 2 Testing Guide - Tool Calling

## Quick Start

1. Start dev server: `npm run dev`
2. Test each tool independently first
3. Test tool integration in chat flow
4. Verify attempt tracking and 20-attempt exception

## Test Cases

### 1. Equation Solution Verification

**Test Cases:**

- ✅ Correct solution: `2x + 5 = 13`, solution `x = 4`
- ❌ Incorrect solution: `2x + 5 = 13`, solution `x = 5`
- Edge: Invalid format (no `x =`), multiple solutions

**Expected:** Tool returns `is_correct: true/false` with verification steps

### 2. Algebraic Step Verification

**Test Cases:**

- ✅ Valid step: `2x + 5 = 13` → `2x = 8` (subtract 5)
- ❌ Invalid step: `2x + 5 = 13` → `2x = 18` (wrong operation)

**Expected:** Tool returns `is_valid: true/false` with explanation

### 3. Calculation Verification

**Test Cases:**

- ✅ Correct: `8 * 5` = `40`
- ❌ Incorrect: `8 * 5` = `35`
- Edge: Decimal calculations, fractions

**Expected:** Tool returns correct result and comparison

### 4. Derivative Verification (Calculus)

**Test Cases:**

- ✅ Correct: `x^2 + 3x`, derivative `2x + 3`
- ❌ Incorrect: `x^2 + 3x`, derivative `2x + 5`
- Edge: Equivalent forms, chain rule

**Expected:** Tool verifies derivative correctness

### 5. Integral Verification (Calculus)

**Test Cases:**

- ✅ Correct: `2x + 3`, integral `x^2 + 3x + C`
- ❌ Incorrect: `2x + 3`, integral `x^2 + 3x`
- Edge: Constant of integration handling

**Expected:** Tool verifies integral (ignoring +C variations)

### 6. Expression Evaluation

**Test Cases:**

- Numeric: `3 * 4 + 5` → `17`
- Symbolic: `x^2 + 5x` with `x=2` → `14`
- Edge: Invalid expressions, undefined variables

**Expected:** Tool returns evaluated result

## Integration Testing

### Tool Calling in Chat Flow

1. **Send problem:** "Solve 2x + 5 = 13"
2. **Student gives answer:** "x = 4"
3. **Verify:** Claude should call `verify_equation_solution` tool
4. **Check response:** Response should be Socratic, not direct correction

### Attempt Tracking

1. **First wrong answer:** Should get gentle question
2. **Second wrong:** Slightly more direct question
3. **Third wrong:** More specific guidance
4. **20th wrong:** Direct answer exception triggered

### New Problem Detection

1. **Solve:** "2x + 5 = 13"
2. **Switch to:** "Find area of rectangle: length 8, width 5"
3. **Verify:** Attempt count resets to 0

## Edge Cases

### Tool Failures

- Invalid expression format → Tool returns error, Claude handles gracefully
- Network timeout → Falls back to Claude-only mode
- Parse errors → Tool returns error description

### Invalid Inputs

- Empty strings
- Non-math text
- Malformed equations
- Special characters

## Manual Test Checklist

- [ ] All 6 tools work independently
- [ ] Tools integrate with Claude responses
- [ ] Wrong answers trigger gentle questions (not corrections)
- [ ] Correct answers are celebrated
- [ ] Attempt tracking increments correctly
- [ ] New problems reset attempt count
- [ ] 20+ attempts triggers direct answer exception
- [ ] Tool failures don't break chat flow
- [ ] Client sends attempt metadata to server

## Running Tests

```bash
# Run all unit tests
npm test

# Run only math verification tests
npm run test:unit

# Run tests in watch mode
npm test -- --watch
```

## Unit Tests

Unit tests are in `tests/unit/math-verification.test.ts`:

- Tests all 6 verification functions independently
- No AI/Claude involved - pure function testing
- Fast execution (<1 second)

## Test Problem Dataset

Test problems are in `tests/unit/test-problems.ts`:

- 8 problems covering all types (algebra, geometry, fractions, word problems, calculus)
- Based on common K-12 math problems
- Each includes expected patterns and red flags

## Expected Behavior

**Correct Answer:**

- Tool: `is_correct: true`
- Claude: "Great work! That's correct. What should we do next?"

**Wrong Answer (1st attempt):**

- Tool: `is_correct: false`
- Claude: "Let's check that together. What happens when we substitute x = 5 back into the original equation?"

**Wrong Answer (20th attempt):**

- Tool: `is_correct: false`
- Claude: "I really appreciate your persistence! After many attempts, let me provide the answer: x = 4. Would you like me to walk you through the solution method?"
