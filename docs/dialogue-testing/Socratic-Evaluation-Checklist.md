# Socratic Dialogue Evaluation Checklist

Use this checklist to evaluate the quality of AI tutor conversations. Check each item that applies.

---

## For Each Conversation

### Problem Information
- **Problem:** [Auto-filled from test dataset]
- **Problem Type:** [Algebra/Geometry/Word Problem/Fractions/etc.]
- **Conversation Length:** [Number of turns]

---

## Evaluation Criteria

### 1. Opening (First Response)

- [ ] Starts with a question, not a statement
- [ ] Asks "What are we trying to find?" or similar clarifying question
- [ ] Does NOT immediately start solving
- [ ] Does NOT give away the method or approach
- [ ] Engages student in thinking about the problem

**Red Flags:**
- [ ] ❌ Immediately begins solving: "First, we subtract 5..."
- [ ] ❌ Gives away method: "We need to use the distributive property"
- [ ] ❌ Provides direct answer or numerical result

---

### 2. Question Quality

- [ ] Questions guide thinking, not just check knowledge
- [ ] Questions build on previous student answers
- [ ] Questions are age-appropriate and clear
- [ ] Questions help student discover, not just recall
- [ ] Questions are open-ended when appropriate

**Red Flags:**
- [ ] ❌ Leading questions that give away the answer
- [ ] ❌ Questions that are too vague or confusing
- [ ] ❌ Questions that don't build on previous responses

---

### 3. Hint Strategy

- [ ] Provides hints only after student shows struggle (2+ turns)
- [ ] Hints are progressive (gentle → stronger)
- [ ] Hints guide method, not answer
- [ ] Never gives numerical answer directly
- [ ] Hints are appropriately vague to maintain discovery

**Red Flags:**
- [ ] ❌ Gives hint too early (before student tries)
- [ ] ❌ Hint is too direct: "Subtract 5 from both sides" (should ask "What should we do?")
- [ ] ❌ Hint reveals numerical answer: "Try subtracting 5"
- [ ] ❌ No hints when student is clearly stuck

---

### 4. Language & Tone

- [ ] Uses encouraging words: "Great!", "Exactly!", "Nice work!", "You're on the right track!"
- [ ] Avoids negative language: "Wrong", "No", "Incorrect", "That's not right"
- [ ] Patient and supportive throughout conversation
- [ ] Celebrates student discoveries and thinking
- [ ] Uses positive reinforcement

**Red Flags:**
- [ ] ❌ Uses discouraging language
- [ ] ❌ Dismissive or impatient tone
- [ ] ❌ Fails to acknowledge correct thinking
- [ ] ❌ Overly critical or harsh

---

### 5. Step Validation

- [ ] Validates each student step before proceeding
- [ ] Asks student to explain their reasoning
- [ ] Checks understanding before moving forward
- [ ] Doesn't rush through steps
- [ ] Confirms student understands before next step

**Red Flags:**
- [ ] ❌ Moves too fast without checking understanding
- [ ] ❌ Assumes student understands without confirmation
- [ ] ❌ Doesn't validate incorrect steps (should guide correction)

---

### 6. Socratic Method Adherence

- [ ] Maintains questioning approach throughout
- [ ] Never gives direct answers (even after many attempts)
- [ ] Guides student to discover solution themselves
- [ ] Uses "What do you think?" rather than "Do this"
- [ ] Encourages independent thinking

**Red Flags:**
- [ ] ❌ Gives direct answer: "x = 4" or "The answer is 4"
- [ ] ❌ Shows step-by-step solution
- [ ] ❌ Tells student what to do instead of asking
- [ ] ❌ Abandons Socratic method mid-conversation

---

## Critical Red Flags (Automatic Fail)

If ANY of these occur, the dialogue fails:

- [ ] ❌ **Gave direct numerical answer** (e.g., "x = 4", "The answer is 5")
- [ ] ❌ **Showed step-by-step solution** (e.g., "Step 1: Subtract 5. Step 2: Divide by 2")
- [ ] ❌ **Made mathematical errors** (incorrect calculations or concepts)
- [ ] ❌ **Used discouraging language** (e.g., "Wrong", "That's incorrect", "No")
- [ ] ❌ **Failed to help when student stuck** (no hints after 3+ turns of struggle)

---

## Scoring Rubric

Rate each category 1-5:

### Socratic Methodology (1-5)
- **5 (Excellent):** Perfect Socratic questioning, never gives answers, guides discovery flawlessly
- **4 (Good):** Mostly Socratic, minor slip-ups that don't compromise learning
- **3 (Acceptable):** Some direct guidance, but primarily uses questions
- **2 (Poor):** Too many direct hints, minimal questioning, gives away too much
- **1 (Fail):** Gives direct answers or step-by-step solutions

**Score:** ___

### Question Quality (1-5)
- **5:** Questions guide discovery perfectly, build on responses, age-appropriate
- **4:** Questions are helpful and appropriate, minor improvements possible
- **3:** Questions are okay but could be more effective
- **2:** Questions are too leading, unclear, or don't help discovery
- **1:** Questions don't help or are confusing

**Score:** ___

### Hint Appropriateness (1-5)
- **5:** Hints perfectly timed and appropriately vague, maintains discovery
- **4:** Good hint strategy, minor timing or directness issues
- **3:** Hints are okay but could be better timed or more vague
- **2:** Hints too direct or poorly timed, gives away too much
- **1:** Hints give away answers or provided too early/late

**Score:** ___

### Language & Tone (1-5)
- **5:** Consistently encouraging and supportive, celebrates thinking
- **4:** Mostly positive, minor issues with tone
- **3:** Neutral tone, not particularly encouraging
- **2:** Some negative or discouraging language
- **1:** Discouraging or inappropriate tone

**Score:** ___

### Overall Pedagogical Value (1-5)
- **5:** Student would learn deeply from this interaction, excellent teaching
- **4:** Good learning experience, student would understand concepts well
- **3:** Adequate but not exceptional, some learning would occur
- **2:** Limited learning value, student might not understand deeply
- **1:** Poor or counterproductive, might confuse student

**Score:** ___

---

## Overall Assessment

**Total Score:** ___ / 25

**Score Interpretation:**
- **20-25:** ✅ Excellent - Production ready
- **15-19:** ⚠️ Good - Minor improvements needed
- **10-14:** ⚠️ Acceptable - Needs prompt tuning
- **5-9:** ❌ Poor - Significant issues
- **<5:** ❌ Fail - Major rewrite needed

**Overall Status:**
- [ ] ✅ Meets Socratic standards
- [ ] ⚠️ Needs minor prompt adjustments
- [ ] ❌ Needs significant prompt changes
- [ ] ❌ Major issues - prompt rewrite required

---

## Notes & Observations

**Specific Issues Found:**
[Space for detailed notes about problems]

**What Worked Well:**
[Space for positive observations]

**Recommendations:**
[Space for improvement suggestions]

---

## Automated Checks (if using assessment tools)

- [ ] ✅ No direct answers detected
- [ ] ✅ Questions detected in responses
- [ ] ✅ Encouraging language detected
- [ ] ✅ Hints provided when needed
- [ ] ⚠️ Red flags detected: [list]

---

**Evaluator:** _________________  
**Date:** _________________  
**Test Problem ID:** _________________

