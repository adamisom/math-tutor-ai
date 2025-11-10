# Pre-Production Quick Test Checklist

**Time:** ~10-15 minutes  
**Status:** ✅ Persistence tested and working

---

## 🚀 Critical Path (Must Test)

### **1. Authentication Flow** (~2 min)
- [ ] Sign up with new email → creates account
- [ ] Sign in with existing account → works
- [ ] Sign out → returns to anonymous mode
- [ ] Sign back in → data loads correctly (you already tested this ✅)

### **2. Core Chat Functionality** (~3 min)
- [ ] Type a problem → AI responds with Socratic questions
- [ ] Solve a problem → XP awarded, congratulations modal appears
- [ ] Upload image with problem → extracts correctly
- [ ] Generate AI problem → creates new problem

### **3. Data Persistence** (~1 min)
- [ ] ✅ Already tested - logout/login works
- [ ] Quick verify: Solve problem → log out → log in → XP/conversations still there

### **4. Voice Features** (~2 min)
- [ ] Enable TTS → AI responses are spoken
- [ ] Enable STT → speak problem → text appears in input
- [ ] Both work without errors

### **5. Error Handling** (~2 min)
- [ ] Invalid input → graceful error message
- [ ] Network error → user-friendly message
- [ ] No crashes or blank screens

### **6. Production-Specific** (~2 min)
- [ ] Test page blocked on production URL (localhost only)
- [ ] All environment variables set in Vercel
- [ ] Database connection works in production

---

## ⚡ Quick Smoke Tests (30 seconds each)

- [ ] **Conversation History**: Click "💬 Chat History" → see past conversations
- [ ] **XP Display**: Shows correct level and XP in header
- [ ] **Clear Storage**: Dev button works (clears data)
- [ ] **New Problem**: Clears screen and starts fresh
- [ ] **Mobile responsive**: Check on phone/tablet viewport

---

## 🔍 Production Deployment Checklist

### **Before Deploy:**
- [ ] All tests pass: `npm run lint && npm run build && npm test`
- [ ] Environment variables set in Vercel:
  - `ANTHROPIC_API_KEY`
  - `DATABASE_URL`
  - `NEXTAUTH_URL` (production URL)
  - `NEXTAUTH_SECRET`
- [ ] Database migrations run: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`

### **After Deploy:**
- [ ] Production URL loads
- [ ] Sign up works
- [ ] Chat works (AI responds)
- [ ] Database saves data
- [ ] No console errors

---

## 🐛 Known Issues (Acceptable for Launch)

- **Problem completion detection can misfire** - documented in Architecture.md
- **Voice features browser-specific** - Chrome/Edge recommended
- **Test page localhost-only** - by design

---

## ✅ You're Ready If:

1. ✅ Auth works (sign up/in/out)
2. ✅ Chat works (AI responds, solves problems)
3. ✅ Data persists (logout/login tested)
4. ✅ No critical errors
5. ✅ Environment variables set
6. ✅ Database accessible

**Estimated total test time: 10-15 minutes**

---

## 🚨 Stop and Fix If:

- ❌ Auth doesn't work
- ❌ Chat doesn't respond
- ❌ Data doesn't save
- ❌ Critical errors in console
- ❌ Database connection fails

---

## 📝 Quick Commands

```bash
# Run all checks
npm run lint && npm run build && npm test

# Check database connection
npx dotenv -e .env.local -- npx prisma studio

# Verify environment variables
echo $ANTHROPIC_API_KEY
echo $DATABASE_URL
echo $NEXTAUTH_SECRET
```

---

**TL;DR:** Test auth, chat, persistence (already done ✅), voice, errors. If those work, you're good to deploy!

