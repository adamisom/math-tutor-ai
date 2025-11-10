# LaTeX Rendering Experimental Branch - CONTAINED

**Status:** 🔴 EXPERIMENTAL - DO NOT MERGE  
**Branch:** `attempted-latex-rendering-fixes`  
**Tag:** `experimental/latex-rendering-fixes` (permanent reference)  
**Priority:** ⚠️ **LOWEST PRIORITY - Revisit LAST**  
**Created:** November 2024  
**Preserved:** December 2024 (tagged for safe keeping)

## Purpose

This branch contains experimental work attempting to fix LaTeX double rendering and math tag flashing issues using an XML tag approach.

## Current Status

- **Isolated:** ✅ Branch is safely isolated from main work
- **Not Merged:** ✅ Changes are NOT in `implementation-phase3` or `main`
- **Experimental:** ⚠️ Contains experimental code that may not be production-ready

## What's on This Branch

### Commits (5 unique commits):
1. `694ccbd` - Fix math tag flashing and double rendering issues
2. `2f031f0` - Fix filterToolCallXml to preserve <math> tags and add integration tests
3. `bb245ec` - Implement XML tag approach for LaTeX rendering
4. `26c210e` - Add analysis of detecting untagged equations
5. `4e6c08b` - Add XML tag approach analysis for LaTeX rendering

### Files Changed:
- `app/lib/math-tag-cleaner.ts` (new)
- `app/lib/math-tag-parser.ts` (new)
- `app/components/message-list.tsx` (modified)
- `app/lib/feature-flags.ts` (modified)
- `app/lib/prompts.ts` (modified)
- `app/lib/tool-call-injection.ts` (modified)
- Multiple test files and documentation

### Documentation Created:
- `docs/Detecting-Untagged-Equations.md`
- `docs/LaTeX-Double-Rendering-Hypotheses.md`
- `docs/XML-Tag-LaTeX-Approach.md`

## Why It's Contained

The LaTeX rendering issues are complex and experimental solutions could:
- Break existing functionality
- Introduce new bugs
- Complicate the codebase
- Delay other important features

**Decision:** Keep this work isolated until all other Phase 6 features are complete, then revisit as a final polish task.

## Current Workaround

On `implementation-phase3`, the approach is:
- Reverted some LaTeX-related commits (see `bb0497f`)
- Using simpler, more stable LaTeX rendering approach
- Focusing on core functionality first

## When to Revisit

**Only after:**
- ✅ Phase 6 features are complete (XP, conversation history, AI problems, voice, intro screen)
- ✅ All features are tested and stable
- ✅ Main branch is up to date
- ✅ No other critical bugs or features pending

## How to Revisit

### Quick Access
```bash
# Option 1: Checkout the branch
git checkout attempted-latex-rendering-fixes

# Option 2: Checkout the tagged version (permanent reference)
git checkout experimental/latex-rendering-fixes

# See what's different from main
git diff main attempted-latex-rendering-fixes
```

### Full Process
1. Checkout the branch or tag (see above)
2. Review the documentation in `docs/`
3. Test the experimental approach
4. If promising, create a new branch from current `main`:
   ```bash
   git checkout main
   git checkout -b latex-rendering-fixes-v2
   ```
5. Rebase or cherry-pick the good parts:
   ```bash
   # Option A: Rebase (if branch structure is clean)
   git rebase attempted-latex-rendering-fixes
   
   # Option B: Cherry-pick specific commits
   git cherry-pick <commit-hash>
   ```
6. Test thoroughly before merging

See `docs/misc/Merge-Strategy-LaTeX-Branch.md` for detailed merge strategy.

## Notes

- The branch is based on an older commit of `implementation-phase3`
- It may need rebasing/updating if merged later
- The XML tag approach is experimental and may not be the final solution
- Consider alternative approaches before committing to this one

---

**Last Updated:** December 2024  
**Maintained By:** Development Team  
**Do Not Delete:** This branch contains valuable experimental work

