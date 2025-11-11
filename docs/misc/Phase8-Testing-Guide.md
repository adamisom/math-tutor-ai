# Phase 8 Testing Guide: Authentication, Database & API

Complete testing guide for Phase 8 features: authentication, database persistence, and API routes.

## Prerequisites

### 1. Environment Variables

Create/update `.env.local` with:

```bash
# Required: AI Features
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here

# Required: Database
DATABASE_URL="postgresql://user:password@localhost:5432/math_tutor?schema=public"

# Required: NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate: openssl rand -base64 32
```

**Note**: No OAuth credentials needed - app uses email/password authentication.

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Create database tables (includes password field)
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

---

## Testing Checklist

### ✅ Test 1: Anonymous User (No Auth)

**Goal**: Verify app works without authentication (localStorage only)

1. **Start app**: `npm run dev`
2. **Verify UI**: 
   - "Sign In" button visible in header
   - Can use app without signing in
3. **Create conversation**:
   - Type a math problem: `2x + 5 = 13`
   - Have a conversation with the AI
   - Earn some XP by solving
4. **Check localStorage** (DevTools → Application → Local Storage):
   - `math-tutor-conversation-history` exists with your conversation
   - `math-tutor-xp` exists with XP data
5. **Refresh page**: 
   - ✅ Data persists (from localStorage)
   - ✅ Conversation history visible
   - ✅ XP/Level displayed correctly

**Expected**: App works fully as anonymous user, all data in localStorage.

---

### ✅ Test 2: Sign Up Flow

**Goal**: Test account creation and automatic sign-in

1. **Click "Sign In"** button in header
2. **Click "Sign up"** link in the modal
3. **Fill in sign-up form**:
   - Email: `test@example.com`
   - Password: `password123` (at least 8 characters)
   - Name: `Test User` (optional)
4. **Click "Sign Up"**
5. **Verify UI**:
   - ✅ Automatically signed in after sign-up
   - ✅ "Sign In" button replaced with user info
   - ✅ User name/email displayed
   - ✅ "Sign Out" button visible
6. **Check browser console**:
   - Look for: "Syncing localStorage to server" (or similar)
   - No errors
7. **Check database** (Prisma Studio: `npx prisma studio`):
   - ✅ `User` table: Your user record created with hashed password
   - ✅ `Conversation` table: Your conversations synced (if any)
   - ✅ `XPState` table: Your XP synced (if any)

**Expected**: Account created, automatically signed in, data synced to database.

### ✅ Test 2b: Sign In Flow

**Goal**: Test sign-in with existing account

1. **Sign out** (if signed in)
2. **Click "Sign In"** button
3. **Enter credentials**:
   - Email: `test@example.com`
   - Password: `password123`
4. **Click "Sign In"**
5. **Verify**:
   - ✅ Successfully signed in
   - ✅ User info displayed
   - ✅ Previous data loaded
6. **Check database**:
   - ✅ User record exists
   - ✅ Data accessible

**Expected**: Sign-in successful, previous data accessible.

---

### ✅ Test 3: Authenticated User - Create New Data

**Goal**: Verify hybrid storage (localStorage + database)

1. **While signed in**: Create a new conversation
   - Type: `3x - 7 = 14`
   - Complete the conversation
   - Earn XP
2. **Check localStorage** (DevTools):
   - ✅ New conversation in `math-tutor-conversation-history`
   - ✅ Updated XP in `math-tutor-xp`
3. **Check database** (Prisma Studio):
   - ✅ New conversation in `Conversation` table
   - ✅ Updated XP in `XPState` table
   - ✅ `userId` matches your user ID
4. **Refresh page**:
   - ✅ Data persists from both sources
   - ✅ Conversation history shows new conversation

**Expected**: Data saved to both localStorage AND database.

---

### ✅ Test 4: Sign Out Flow

**Goal**: Verify graceful fallback to anonymous mode

1. **While signed in**: Click "Sign Out"
2. **Verify UI**:
   - ✅ "Sign In" button appears again
   - ✅ User info disappears
3. **Verify functionality**:
   - ✅ Can still use app
   - ✅ Can create new conversations
   - ✅ Data saved to localStorage only
4. **Check database** (Prisma Studio):
   - ✅ Previous data still in database (not deleted)
   - ✅ New conversations NOT in database (anonymous mode)

**Expected**: Sign out works, app falls back to localStorage-only mode.

---

### ✅ Test 5: Sign Back In - Data Persistence

**Goal**: Verify data persists across login sessions

1. **Sign out** (if signed in)
2. **Sign back in** with same email/password
3. **Verify**:
   - ✅ Previous conversations appear in history
   - ✅ XP/Level restored
   - ✅ Can continue from where you left off
4. **Check database**:
   - ✅ Same user record (not duplicated)
   - ✅ All previous data intact

**Expected**: Data persists across login sessions.

---

### ✅ Test 6: API Routes - Direct Testing

**Goal**: Test API endpoints directly

#### 6a. Test Authentication Check

```bash
# Without auth (should fail)
curl http://localhost:3000/api/conversations

# Expected: 401 Unauthorized
```

#### 6b. Test Conversations API

**Get session token** (from browser after sign-in):
1. Open DevTools → Application → Cookies
2. Find `next-auth.session-token`
3. Copy value

```bash
# Get conversations (replace SESSION_TOKEN)
curl -H "Cookie: next-auth.session-token=SESSION_TOKEN" \
  http://localhost:3000/api/conversations

# Expected: JSON array of conversations
```

**Create conversation**:
```bash
curl -X POST \
  -H "Cookie: next-auth.session-token=SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Problem",
    "problemText": "2x + 5 = 13",
    "messages": [],
    "completed": false,
    "xpEarned": 0
  }' \
  http://localhost:3000/api/conversations

# Expected: Created conversation object with ID
```

#### 6c. Test XP API

```bash
# Get XP state
curl -H "Cookie: next-auth.session-token=SESSION_TOKEN" \
  http://localhost:3000/api/xp

# Expected: XP state object

# Update XP state
curl -X POST \
  -H "Cookie: next-auth.session-token=SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "totalXP": 100,
    "level": 5,
    "transactions": []
  }' \
  http://localhost:3000/api/xp

# Expected: Updated XP state
```

#### 6d. Test Sync API

```bash
# Sync localStorage data to database
curl -X POST \
  -H "Cookie: next-auth.session-token=SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "conversations": [...],
    "xp": {...}
  }' \
  http://localhost:3000/api/sync

# Expected: {"success": true}
```

---

### ✅ Test 7: Error Handling

**Goal**: Verify graceful error handling

1. **Database connection error**:
   - Stop PostgreSQL server
   - Try to sign in
   - ✅ App should fall back to localStorage
   - ✅ No crashes, error messages in console

2. **Invalid API request**:
   - Try to access `/api/conversations` without auth
   - ✅ Returns 401 Unauthorized
   - ✅ No crashes

3. **Network error**:
   - Disconnect internet
   - Try to create conversation while signed in
   - ✅ Saves to localStorage
   - ✅ Shows warning in console
   - ✅ No crashes

**Expected**: All errors handled gracefully, app continues working.

---

### ✅ Test 8: Data Integrity

**Goal**: Verify data consistency

1. **Create conversation while signed in**
2. **Check both storage locations**:
   - localStorage: Conversation exists
   - Database: Conversation exists with same ID
3. **Update conversation** (add messages):
   - Check localStorage: Updated
   - Check database: Updated
   - ✅ Both have same data
4. **Delete conversation** (via UI):
   - Check localStorage: Removed
   - Check database: Removed
   - ✅ Both in sync

**Expected**: Data consistent between localStorage and database.

---

### ✅ Test 9: Edge Cases

1. **Empty state**:
   - New user signs in
   - ✅ No errors
   - ✅ Can create first conversation

2. **Large data**:
   - Create conversation with many messages (50+)
   - ✅ Saves successfully
   - ✅ Loads correctly

3. **Special characters**:
   - Create conversation with special chars: `x² + 5 = 13`
   - ✅ Saves correctly
   - ✅ Displays correctly

4. **Concurrent updates**:
   - Open app in two tabs
   - Update conversation in tab 1
   - Refresh tab 2
   - ✅ Latest data shown

**Expected**: All edge cases handled correctly.

---

## Quick Verification Commands

```bash
# Check database connection
npx prisma db pull

# View database in browser
npx prisma studio

# Check Prisma client generation
npx prisma generate

# Run migrations
npx prisma migrate dev

# Check environment variables
node -e "console.log(process.env.DATABASE_URL ? '✅ DATABASE_URL set' : '❌ DATABASE_URL missing')"
node -e "console.log(process.env.NEXTAUTH_SECRET ? '✅ NEXTAUTH_SECRET set' : '❌ NEXTAUTH_SECRET missing')"
```

---

## Troubleshooting

### "Missing DATABASE_URL"
- Add `DATABASE_URL` to `.env.local`
- Format: `postgresql://user:password@host:port/database?schema=public`
- For local: `postgresql://postgres:password@localhost:5432/math_tutor?schema=public`

### "Prisma client not generated"
```bash
npx prisma generate
```

### "Tables don't exist"
```bash
npx prisma migrate dev --name init
```

### "Invalid email or password"
- Verify email exists in database (check Prisma Studio)
- Check password is correct
- Try resetting password (if implemented)
- Verify password was hashed correctly on sign-up

### "Sync not working"
- Check browser console for errors
- Verify database connection: `npx prisma studio`
- Check network tab for failed API calls
- Verify `NEXTAUTH_SECRET` is set

### "401 Unauthorized" on API calls
- Verify you're signed in
- Check session cookie exists
- Try signing out and back in

### "Data not syncing"
- Check browser console for sync errors
- Verify database is accessible
- Check `syncLocalStorageToServer()` is called on login
- Verify API routes are working (Test 6)

---

## Success Criteria

✅ All tests pass  
✅ No console errors  
✅ Data persists across page refreshes  
✅ Authentication works (sign in/out)  
✅ Data syncs to database when authenticated  
✅ App works for anonymous users  
✅ API routes return correct responses  
✅ Error handling works gracefully  

---

**Last Updated**: November 2025  
**Phase**: 8 (Authentication, Database & API)

