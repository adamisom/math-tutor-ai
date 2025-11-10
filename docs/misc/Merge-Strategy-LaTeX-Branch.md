# Merge Strategy: Preserving LaTeX Experimental Branch

**Date:** December 2024  
**Goal:** Merge `implementation-phase3` → `main` while preserving `attempted-latex-rendering-fixes` for easy future access

## Current Situation

- `attempted-latex-rendering-fixes` branches from commit `e538fb8` (Update README)
- `implementation-phase3` has moved forward with revert commit `bb0497f`
- Experimental branch has 5 unique commits with LaTeX rendering fixes
- Branch is currently isolated and safe

## Strategy: Tag and Preserve

### Step 1: Tag the Experimental Branch
```bash
git tag experimental/latex-rendering-fixes attempted-latex-rendering-fixes
git push origin experimental/latex-rendering-fixes
```

This creates a permanent reference that won't be lost even if the branch is deleted.

### Step 2: Push Branch to Remote (Backup)
```bash
git push origin attempted-latex-rendering-fixes
```

Ensures the branch is backed up remotely.

### Step 3: Document Current State
- Branch: `attempted-latex-rendering-fixes`
- Tag: `experimental/latex-rendering-fixes`
- Base commit: `e538fb8`
- Latest commit: `694ccbd`
- Files changed: 13 files, ~1400 lines

### Step 4: Merge implementation-phase3 → main
Proceed with normal merge. The experimental branch remains untouched.

## How to Revisit Later

### Option A: Rebase onto Current Main (Recommended)
```bash
# After main has been updated
git checkout attempted-latex-rendering-fixes
git rebase main
# Resolve conflicts, test thoroughly
```

### Option B: Create New Branch from Main and Cherry-Pick
```bash
# After main has been updated
git checkout main
git checkout -b latex-rendering-fixes-v2
git cherry-pick e538fb8..694ccbd
# Or cherry-pick individual commits
```

### Option C: Create New Branch and Manually Apply Good Parts
```bash
# After main has been updated
git checkout main
git checkout -b latex-rendering-fixes-v2
# Review the experimental branch
git show experimental/latex-rendering-fixes:app/lib/math-tag-parser.ts
# Manually apply the good parts
```

## What's Preserved

### Code
- All 5 experimental commits
- New files: `math-tag-parser.ts`, `math-tag-cleaner.ts`
- Modified files: `message-list.tsx`, `prompts.ts`, etc.
- Test files: `math-tag-parser.test.ts`, `math-tag-integration.test.tsx`

### Documentation
- `docs/Detecting-Untagged-Equations.md`
- `docs/LaTeX-Double-Rendering-Hypotheses.md`
- `docs/XML-Tag-LaTeX-Approach.md`

### Analysis
- Hypothesis testing
- Approach documentation
- Integration test results

## Safety Checklist

Before merging to main:
- [ ] Tag experimental branch: `git tag experimental/latex-rendering-fixes`
- [ ] Push tag to remote: `git push origin experimental/latex-rendering-fixes`
- [ ] Push branch to remote: `git push origin attempted-latex-rendering-fixes`
- [ ] Verify branch is not merged: `git log main..attempted-latex-rendering-fixes` (should show 5 commits)
- [ ] Document current state in this file
- [ ] Update Phase 6 planning doc with deferral notice

After merging to main:
- [ ] Verify experimental branch still exists: `git branch | grep attempted`
- [ ] Verify tag exists: `git tag | grep experimental`
- [ ] Test that you can checkout: `git checkout attempted-latex-rendering-fixes`

## Quick Reference

**To find the experimental work later:**
```bash
# List all experimental tags
git tag | grep experimental

# Checkout the experimental branch
git checkout attempted-latex-rendering-fixes

# Or checkout the tagged version
git checkout experimental/latex-rendering-fixes

# See what's different from main
git diff main attempted-latex-rendering-fixes
```

**To see the experimental commits:**
```bash
git log main..attempted-latex-rendering-fixes
```

---

**Status:** Ready for merge  
**Last Updated:** December 2024

