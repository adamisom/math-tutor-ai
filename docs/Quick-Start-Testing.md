# Quick Start: Testing Your App

**TL;DR**: Get your app running and test the new email/password authentication in 5 minutes.

## Step 1: Setup (One-Time)

### 1.1 Environment Variables

Create `.env.local`:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-api03-your_key_here
DATABASE_URL="postgresql://user:password@localhost:5432/math_tutor?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 1.2 Database Setup

```bash
# Generate Prisma client
npx dotenv -e .env.local -- npx prisma generate

# Create database tables
npx dotenv -e .env.local -- npx prisma migrate dev --name init
```

**Note:** Using `dotenv-cli` to load `.env.local` for Prisma commands.

### 1.3 Start App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 2: Test Authentication (2 minutes)

### Test Sign-Up

1. **Click "Sign In"** button (top right)
2. **Click "Sign up"** link in modal
3. **Fill in form**:
   - Email: `test@example.com`
   - Password: `test12345` (at least 8 characters)
   - Name: `Test User` (optional)
4. **Click "Sign Up"**
5. **Verify**:
   - ✅ Automatically signed in
   - ✅ Your name/email shows in header
   - ✅ "Sign Out" button visible

### Test Sign-In

1. **Click "Sign Out"**
2. **Click "Sign In"** button
3. **Enter credentials**:
   - Email: `test@example.com`
   - Password: `test12345`
4. **Click "Sign In"**
5. **Verify**: Successfully signed in

---

## Step 3: Test App Features (3 minutes)

### Test Anonymous Mode

1. **Sign out** (if signed in)
2. **Use app normally**:
   - Type a math problem: `2x + 5 = 13`
   - Chat with AI
   - Earn XP
3. **Check localStorage** (DevTools → Application → Local Storage):
   - ✅ `math-tutor-conversation-history` exists
   - ✅ `math-tutor-xp` exists
4. **Refresh page**: Data persists ✅

### Test Authenticated Mode

1. **Sign in** with your account
2. **Create conversation**: Type `3x - 7 = 14`
3. **Check database** (optional):
   ```bash
   npx prisma studio
   ```
   - ✅ User in `User` table
   - ✅ Conversation in `Conversation` table
   - ✅ XP in `XPState` table
4. **Sign out and back in**: Previous data accessible ✅

---

## Quick Verification

```bash
# Check if everything is set up
npm run lint    # Should pass
npm run build   # Should pass
npm test        # Should pass (189 tests)
```

---

## What to Test

✅ **Sign up** - Create account with email/password  
✅ **Sign in** - Login with existing account  
✅ **Sign out** - Logout works  
✅ **Anonymous mode** - App works without account (localStorage)  
✅ **Authenticated mode** - Data saves to database  
✅ **Data persistence** - Data persists across sessions  
✅ **XP system** - XP earned and saved  
✅ **Conversation history** - Conversations saved and accessible  

---

## Troubleshooting

### "Missing DATABASE_URL"
- Add `DATABASE_URL` to `.env.local`
- Format: `postgresql://user:password@localhost:5432/math_tutor`

### "Tables don't exist"
```bash
npx prisma migrate dev --name init
```

### "Invalid email or password"
- Check email exists in database: `npx prisma studio`
- Verify password is correct
- Try creating new account

### "Sign-up fails"
- Check password is at least 8 characters
- Check email is valid format
- Check database is running

---

## Next Steps

Once basic testing works:
- See `docs/Phase8-Testing-Guide.md` for comprehensive testing
- See `docs/Future-OAuth-Implementation.md` if you want to add OAuth later

---

**Time to first test**: ~5 minutes  
**Full testing**: See `docs/Phase8-Testing-Guide.md`

