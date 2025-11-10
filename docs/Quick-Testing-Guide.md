# Quick Testing Guide

**Purpose:** Manual testing guide for verifying core functionality and Phase 6 enhancements  
**Related:** See `Testing-Framework-Usage-Guide.md` for automated dialogue quality testing framework

---

## 🚀 Quick Start Testing

### 1. Start the App
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 2. Test Basic Functionality
- **Type a problem**: `2x + 5 = 13`
- **Check LaTeX rendering**: Equations should render beautifully (not show as `$2x + 5 = 13$`)
- **Verify no double rendering**: Should NOT see both LaTeX and plain text versions

### 3. Test Error Handling
- **Simulate error**: Disconnect internet or stop API
- **Check retry button**: Should appear on error, allows retry without losing conversation
- **Test error boundary**: Should show graceful error UI if component crashes

### 4. Test Loading States
- **Submit problem**: Watch for skeleton loader while AI thinks
- **Upload image**: Check progress indicator during image processing
- **Verify smooth transitions**: Loading states should be smooth

### 5. Test Image Upload
- **Upload image**: Click "Upload image here" button
- **Check extraction**: Should extract problem from image
- **Test multi-problem**: Upload image with 2 problems, should show selection

## 🧪 Systematic Testing

### Dialogue Quality Testing
```bash
npm run test:dialogue
```
- Cycles through all test problems
- Shows expected patterns and red flags
- Use checklist: `docs/Socratic-Evaluation-Checklist.md`

### Visual Testing Interface
Visit [http://localhost:3000/test](http://localhost:3000/test)
- Select problems from grid
- See expected patterns and red flags
- Mark pass/fail for each problem

### Unit Tests
```bash
npm run test
```
Runs all unit tests (166 tests including XP system and problem completion)

## 🔍 What to Check

### LaTeX Rendering
- ✅ Equations render as math (not plain text)
- ✅ No double rendering (LaTeX + plain text)
- ✅ Inline math: `$x^2$` renders correctly
- ✅ Block math: `$$\frac{a}{b}$$` renders correctly

### Error Handling
- ✅ Retry button works (doesn't lose conversation)
- ✅ Error messages are clear
- ✅ Error boundary catches crashes gracefully

### Loading States
- ✅ Skeleton loaders show while thinking
- ✅ Progress bar shows during image processing
- ✅ Smooth transitions between states

### Socratic Methodology
- ✅ AI asks questions, doesn't give direct answers
- ✅ Uses encouraging language
- ✅ Verifies answers using tools
- ✅ Provides hints (not solutions)

## 🐛 Quick Debugging

### LaTeX Not Rendering?
- Check browser console for errors
- Verify `isLaTeXEnabled()` returns `true`
- Check if equations are formatted as `$...$` or `$$...$$`

### Double Rendering?
- Check AI response - should only have LaTeX, not plain text too
- Verify prompt is being used correctly
- Check `message-list.tsx` rendering logic

### Errors Not Showing Retry?
- Check `lastFailedRequest` state is set
- Verify error handling in `chat-interface.tsx`
- Check browser console for errors

### XP Not Awarding?
- Check browser console for errors
- Verify `detectProblemCompletion()` is working
- Check localStorage for `math-tutor-xp` key
- Verify problem difficulty is detected correctly

### Conversation History Not Saving?
- Check localStorage quota (may be full)
- Verify `saveConversationSession()` is called
- Check browser console for storage errors
- Try clearing old sessions manually

### Voice Not Working?
- Verify browser support (Chrome/Edge for STT)
- Check microphone permissions
- Verify TTS/STT settings in localStorage
- Check browser console for API errors

---

## 🎤 Voice Interface Testing

### Text-to-Speech (TTS) Testing

**How to Test:**
1. **Enable TTS**: Click the 🔊 (speaker) button in the voice controls above the text input
   - Button should turn blue when enabled
   - Button should turn gray when disabled
2. **Ask a question**: Type a math problem (e.g., "Solve 2x + 5 = 13")
3. **Wait for response**: The AI tutor will respond
4. **Verify audio**: The AI's response should be read aloud automatically
5. **Disable TTS**: Click the 🔊 button again to stop audio

**What to Check:**
- ✅ TTS button toggles on/off correctly
- ✅ AI responses are read aloud when TTS is enabled
- ✅ Audio stops when TTS is disabled
- ✅ Multiple responses continue to be read (if enabled)
- ✅ System volume controls work

### Speech-to-Text (STT) Testing

**How to Test:**
1. **First-time setup**: Click the 🎤 (microphone) button
   - Browser will prompt for microphone permission
   - Click "Allow" to grant permission
   - Button should turn blue and start listening (red with spinner)
2. **Speak your problem**: Say something like:
   - "Solve 2x plus 5 equals 13"
   - "What is the derivative of x squared?"
   - "Find the area of a circle with radius 5"
3. **Verify transcription**: Your speech should appear in the text input field
4. **Submit**: Press Enter or click Send to submit the transcribed problem
5. **Test again**: Click the mic button again to start a new voice input

**What to Check:**
- ✅ Microphone permission prompt appears (first time only)
- ✅ Button changes color when listening (blue → red with spinner)
- ✅ Speech is accurately transcribed to text
- ✅ Transcribed text appears in input field
- ✅ Can submit transcribed text normally
- ✅ Can stop listening by clicking button again
- ✅ Error handling works if permission is denied

**Browser Compatibility:**
- ✅ **Chrome/Edge**: Full TTS + STT support
- ✅ **Safari**: TTS supported, limited STT support
- ⚠️ **Firefox**: Limited voice support
- ✅ **Mobile**: iOS Safari (TTS), Android Chrome (full support)

**Common Issues:**
- **"not-allowed" error**: User denied microphone permission - click browser's permission icon in address bar to allow
- **No transcription**: Check microphone is working, speak clearly, minimize background noise
- **TTS not speaking**: Check system volume, verify TTS is enabled (blue button)

---

## 📚 Testing Documentation Comparison

### Quick-Testing-Guide.md (This File)
**Purpose:** Manual testing guide for developers and QA  
**Focus:** 
- Quick verification of core functionality
- Phase 6 feature testing
- Visual/UX testing
- Error handling verification
- Browser compatibility checks

**When to use:**
- Before committing code
- After adding new features
- Quick smoke tests
- Manual regression testing

### Testing-Framework-Usage-Guide.md
**Purpose:** Guide for using the automated dialogue quality testing framework (Phase 4B)  
**Focus:**
- Systematic testing of all test problems
- Dialogue quality assessment
- Socratic methodology evaluation
- Automated pattern detection
- Quality scoring and tracking

**When to use:**
- Comprehensive quality audits
- Testing all problems systematically
- Evaluating AI response quality
- Tracking dialogue improvements over time
- Using the `/test` page for visual testing

**Key Difference:** This guide is for **manual functional testing**, while Testing-Framework-Usage-Guide.md is for **automated dialogue quality assessment**.

## 📝 Testing Checklist

### Core Functionality
- [ ] Basic problem solving works
- [ ] LaTeX renders correctly
- [ ] No double rendering
- [ ] Error retry works
- [ ] Loading states look good
- [ ] Image upload works
- [ ] Error boundaries catch crashes
- [ ] Socratic methodology maintained

### Phase 6 Features
- [ ] Conversation history saves and loads
- [ ] XP system awards points correctly
- [ ] AI problem generation works
- [ ] Voice interface functions (if supported)
  - [ ] TTS reads AI responses aloud when enabled
  - [ ] STT transcribes speech to text accurately
  - [ ] Microphone permission handling works
  - [ ] Voice controls are clear and intuitive
- [ ] Intro screen shows/hides appropriately

