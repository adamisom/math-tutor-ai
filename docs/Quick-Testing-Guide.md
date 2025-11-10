# Quick Testing Guide

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
Runs all unit tests (114 tests)

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

## 📝 Testing Checklist

- [ ] Basic problem solving works
- [ ] LaTeX renders correctly
- [ ] No double rendering
- [ ] Error retry works
- [ ] Loading states look good
- [ ] Image upload works
- [ ] Error boundaries catch crashes
- [ ] Socratic methodology maintained

