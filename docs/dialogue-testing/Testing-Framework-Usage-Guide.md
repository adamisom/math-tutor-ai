# Testing Framework Usage Guide

Complete guide on how to use the Phase 4B testing framework.

> **Implementation Status:** 
> - ✅ Test Page (`/test`) - Fully implemented
> - ✅ Test Dialogue Script (`npm run test:dialogue`) - Implemented (Node.js and Bash versions)
> - ✅ Evaluation Checklist (`Socratic-Evaluation-Checklist.md`) - Available
> - ✅ Assessment Tools (`app/lib/dialogue-assessment.ts`) - Implemented
> - ⚠️ Some features may be partially implemented or in development

---

## Quick Start

### Option 1: Use the Test Page (Recommended for Visual Testing)

1. Start the dev server: `npm run dev`
2. Navigate to `http://localhost:3000/test`
3. Select a problem from the list
4. Use the sidebar to see expected patterns and red flags
5. Have a conversation with the AI
6. Mark as Pass/Fail when done

### Option 2: Use the Command-Line Script (Recommended for Systematic Testing)

1. Run: `npm run test:dialogue`
2. Script will start dev server if needed
3. Follow prompts to test each problem systematically
4. Use the checklist (`docs/Socratic-Evaluation-Checklist.md`) for evaluation

---

## Components Overview

### 1. Test Dialogue Script (`npm run test:dialogue`)

**What it does:**
- Automatically cycles through all test problems
- Shows expected patterns and red flags for each problem
- Waits for you to test each one before moving to the next

**When to use:**
- Systematic testing of all problems
- Ensuring you don't skip any problems
- Quick reference to what to look for

**Usage:**
```bash
npm run test:dialogue
```

**Features:**
- Auto-starts dev server if not running
- Shows problem, expected patterns, and red flags
- Type 'skip' to skip a problem, 'quit' to exit

---

### 2. Evaluation Checklist (`docs/Socratic-Evaluation-Checklist.md`)

**What it contains:**
- Detailed criteria for evaluating dialogue quality
- Scoring rubric (1-5 scale per category)
- Red flags section
- Overall assessment template

**When to use:**
- During or after each conversation
- To ensure consistent evaluation
- To document specific issues

**How to use:**
1. Open `docs/Socratic-Evaluation-Checklist.md`
2. Fill out for each problem you test
3. Save your assessments for tracking

---

### 3. Assessment Tools (`app/lib/dialogue-assessment.ts`)

**What it does:**
- Automated detection of patterns and red flags
- Can assess individual messages or full conversations
- Generates summary reports

**When to use:**
- Programmatically checking dialogue quality
- Building custom testing tools
- Integrating into test page (future enhancement)

**Example usage:**
```typescript
import { assessConversation, generateAssessmentSummary } from '../lib/dialogue-assessment';

const messages = [
  { role: 'user', content: '2x + 5 = 13' },
  { role: 'assistant', content: 'What are we trying to find?' },
  // ... more messages
];

const assessment = assessConversation(messages);
const summary = generateAssessmentSummary(assessment);
console.log(summary);
```

---

### 4. Test Page (`/test`)

**What it does:**
- Visual interface for testing
- Shows all test problems in a grid
- Displays expected patterns and red flags in sidebar
- Tracks pass/fail status

**When to use:**
- Visual testing workflow
- When you want to see all problems at once
- When testing specific problems (not all)

**Features:**
- Problem selection with visual feedback
- Sidebar with testing criteria
- Pass/Fail tracking
- Tricky inputs for adversarial testing

---

## Recommended Workflow

### For Quick Testing (1-2 problems):
1. Go to `/test` page
2. Select problem
3. Test conversation
4. Mark pass/fail

### For Comprehensive Testing (All problems):
1. Run `npm run test:dialogue`
2. For each problem:
   - Have conversation in browser
   - Check against expected patterns
   - Fill out checklist (optional but recommended)
   - Press Enter to continue
3. Review results

### For Deep Analysis (Quality Assessment):
1. Use test page or script
2. Have conversation
3. Use assessment tools programmatically (or manually check)
4. Fill out full checklist with scores
5. Document findings

---

## Integration Ideas (Future Enhancements)

### Real-Time Assessment Display
- Add assessment panel to test page sidebar
- Show automated checks updating in real-time
- Highlight detected patterns and red flags

### Assessment Export
- Save assessment results to JSON/CSV
- Track quality over time
- Generate reports

### Cross-Platform Script
- Create Node.js version of test script for Windows
- Or use existing bash script with WSL/Git Bash

---

## Tips

1. **Use the checklist** - Don't rely on memory, use the checklist for consistency
2. **Test systematically** - Use the script to ensure you test all problems
3. **Document issues** - Fill out the notes section when problems are found
4. **Compare over time** - Save assessments to track quality improvements
5. **Test edge cases** - Use tricky inputs to test adversarial scenarios

---

## Troubleshooting

**Script doesn't work on Windows:**
- Use Git Bash or WSL
- Or use the `/test` page instead

**Can't parse test problems:**
- Script uses simple regex parsing
- If it fails, manually test using `/test` page

**Assessment tools not detecting patterns:**
- Patterns are regex-based and may miss variations
- Always do manual review in addition to automated checks

