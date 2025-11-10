# Testing Phase 8 Without Google OAuth

You can test most Phase 8 functionality **without setting up Google OAuth**. Here's what you can test and what requires OAuth.

## What You CAN Test Without OAuth

### ✅ 1. Anonymous User Mode (Full Functionality)

**No OAuth needed!** The app works fully for anonymous users:

```bash
# Just need these in .env.local:
ANTHROPIC_API_KEY=your_key
DATABASE_URL=postgresql://...  # Optional for anonymous mode
```

**What works:**
- ✅ All chat functionality
- ✅ Conversation history (localStorage)
- ✅ XP system (localStorage)
- ✅ Problem generation
- ✅ Voice interface
- ✅ Everything except cross-device sync

**What doesn't work:**
- ❌ Sign in button (but you can ignore it)
- ❌ Database persistence (uses localStorage only)
- ❌ Cross-device sync

### ✅ 2. Database & API Routes (Direct Testing)

You can test the database and API routes directly without OAuth by:

**Option A: Use Prisma Studio**
```bash
npx prisma studio
# Directly view/edit database tables
```

**Option B: Mock Auth for API Testing**
See "Mock Auth Setup" section below.

### ✅ 3. Database Schema & Migrations

Test database structure without OAuth:
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio  # View tables
```

---

## What REQUIRES OAuth

- ❌ Sign in/out UI flow
- ❌ Automatic data sync on login
- ❌ Cross-device sync
- ❌ API routes with authentication (unless you mock it)

---

## Option 1: Skip OAuth Entirely (Recommended for Quick Testing)

**Just test anonymous mode:**

1. **Minimal `.env.local`**:
```bash
ANTHROPIC_API_KEY=your_key
# That's it! No DATABASE_URL, no OAuth needed
```

2. **Start app**: `npm run dev`
3. **Use app normally** - everything works with localStorage

**What you're testing:**
- ✅ All Phase 6 features (history, XP, voice, etc.)
- ✅ localStorage persistence
- ✅ App functionality

**What you're NOT testing:**
- ❌ Database integration
- ❌ Authentication flow
- ❌ Cross-device sync

---

## Option 2: Test Database Only (No OAuth)

**Test database without authentication:**

1. **`.env.local`**:
```bash
ANTHROPIC_API_KEY=your_key
DATABASE_URL=postgresql://user:password@localhost:5432/math_tutor
# No OAuth credentials needed
```

2. **Setup database**:
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma studio
```

3. **Test database directly**:
- Use Prisma Studio to create/edit records
- Verify schema is correct
- Test data relationships

**What you're testing:**
- ✅ Database schema
- ✅ Prisma setup
- ✅ Data structure

**What you're NOT testing:**
- ❌ Authentication
- ❌ API routes (they require auth)
- ❌ Hybrid storage sync

---

## Option 3: Mock Auth for API Testing

**Test API routes without real OAuth:**

### Quick Mock Setup

1. **Temporarily modify `app/lib/auth.ts`** for development:

```typescript
// TEMPORARY: For testing without OAuth
export async function requireAuth() {
  // Mock session for development
  if (process.env.NODE_ENV === 'development' && process.env.MOCK_AUTH === 'true') {
    return {
      user: {
        id: 'mock-user-id',
        name: 'Test User',
        email: 'test@example.com',
      },
    } as any;
  }
  
  // Real auth (original code)
  const session = await auth();
  if (!session?.user?.id) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session as Session & { user: { id: string } };
}
```

2. **`.env.local`**:
```bash
ANTHROPIC_API_KEY=your_key
DATABASE_URL=postgresql://...
MOCK_AUTH=true  # Enable mock auth
```

3. **Test API routes**:
```bash
# Now these work without OAuth:
curl http://localhost:3000/api/conversations
curl http://localhost:3000/api/xp
```

**⚠️ Remember**: Remove mock auth before committing or deploying!

---

## Option 4: Use a Simpler OAuth Provider

If you want OAuth but Google is too complex, consider:

### NextAuth Email Provider (No External Setup)

**Pros:**
- No Google Cloud setup needed
- Works with any email
- Good for development

**Cons:**
- Requires email server (or use a service like SendGrid)
- Less realistic than Google OAuth

### GitHub OAuth (Easier than Google)

**Pros:**
- Simpler setup (just GitHub account)
- No cloud console needed
- Free

**Cons:**
- Still requires OAuth app registration (but simpler)

---

## Recommended Testing Path

### Phase 1: Quick Functionality Test (No Setup)
```bash
# Just ANTHROPIC_API_KEY
npm run dev
# Test anonymous mode - everything works!
```

### Phase 2: Database Test (Minimal Setup)
```bash
# Add DATABASE_URL
npx prisma migrate dev
npx prisma studio
# Test database structure
```

### Phase 3: Full Auth Test (When Ready)
```bash
# Add Google OAuth credentials
# Test full authentication flow
```

---

## Summary

**You DON'T need Google OAuth to:**
- ✅ Test app functionality (anonymous mode)
- ✅ Test localStorage features
- ✅ Test database schema
- ✅ Develop new features

**You DO need Google OAuth to:**
- ❌ Test sign in/out UI
- ❌ Test automatic data sync
- ❌ Test cross-device sync
- ❌ Test authenticated API routes (unless you mock)

**Recommendation**: Start with anonymous mode testing, then add database, then add OAuth when you're ready to test the full flow.

---

**Last Updated**: November 2025

