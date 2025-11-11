# Production Deployment Guide

**Platform:** Vercel  
**Database:** Neon Postgres (or other PostgreSQL provider)  
**Time:** ~15-20 minutes

---

## 📋 Pre-Deployment Checklist

### **Step 1: Run Pre-Deployment Checks** (~2 min)

```bash
# Run all checks
npm run lint && npm run build && npm test
```

**Expected:** All should pass with 0 errors

**If errors:**
- Fix lint errors: `npm run lint -- --fix`
- Fix build errors: Check TypeScript errors
- Fix test failures: Review test output

---

## 🚀 Deployment Steps

### **Step 2: Deploy to Vercel** (~2 min)

**Option A: CLI Deployment (Simple)**

```bash
# Deploy to production
vercel --prod
```

This will:
- Build your project
- Deploy to production
- Use your existing Vercel project (if linked) or create a new one

**Note:** If you haven't linked your project yet:
```bash
vercel link  # Link to existing project or create new one
vercel --prod  # Deploy
```

---

**Option B: GitHub Integration (Auto-Deploy)**

If you want automatic deployments on every push:

### **Step 2a: Push Code to GitHub** (~1 min)

```bash
# Make sure all changes are committed
git status

# Push to your main branch
git push origin main
```

**Note:** If you're on a different branch, merge to main first or deploy that branch.

### **Step 2b: Connect to GitHub in Vercel** (~5 min)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Find your project → **Settings → Git**
3. Click **"Connect Git Repository"** or **"Connect GitHub"**
4. Select your GitHub repository
5. Choose `main` as the production branch

After connecting, every push to `main` will auto-deploy.

---

### **Step 3: Set Up Vercel Project** (~5 min)

**Note:** Skip this step if you already have a Vercel project set up (via CLI or previous deployment).

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)
   - **Install Command:** `npm install` (default)

4. **Click "Deploy"** (we'll add env vars after)

**Or use CLI:**
```bash
vercel link  # Link to existing project or create new one
```

---

### **Step 4: Set Environment Variables** (~5 min)

**In Vercel Dashboard → Your Project → Settings → Environment Variables:**

Add these 4 variables:

#### **1. ANTHROPIC_API_KEY**
```
Value: [Your Anthropic API key]
Environment: Production, Preview, Development (all)
```

#### **2. DATABASE_URL**
```
Value: [Your Neon Postgres connection string]
Example: postgresql://user:password@host.neon.tech/dbname?sslmode=require
Environment: Production, Preview, Development (all)
```

**If using Neon:**
- Go to your Neon dashboard
- Copy the connection string
- Make sure it includes `?sslmode=require`

#### **3. NEXTAUTH_URL**
```
Value: https://your-app-name.vercel.app
Environment: Production only
```

**Important:** Replace `your-app-name` with your actual Vercel project name.

#### **4. NEXTAUTH_SECRET**
```
Value: [Generate with: openssl rand -base64 32]
Environment: Production, Preview, Development (all)
```

**Generate secret:**
```bash
openssl rand -base64 32
```

Copy the output and paste as the value.

---

### **Step 5: Run Database Migrations** (~2 min)

**Option A: Using Vercel CLI (Recommended)**

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project (if not already linked)
vercel link

# Pull environment variables
vercel env pull .env.production

# Run migrations with production DATABASE_URL
npx dotenv -e .env.production -- npx prisma migrate deploy
```

**Expected output:**
- If migrations are pending: `X migrations found and applied successfully`
- If already applied: `No pending migrations to apply` ✅ (this is fine!)

**Option B: Direct Connection**

```bash
# Set DATABASE_URL temporarily
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy
```

**Option C: Using Neon Dashboard**

1. Go to Neon dashboard → SQL Editor
2. Run migrations manually (copy from `prisma/migrations`)

---

### **Step 6: Redeploy** (~2 min)

After setting environment variables, you need to redeploy:

**Option A: CLI Deployment**
```bash
vercel --prod
```

**Option B: Via Dashboard (Web Console)**
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to the **"Deployments"** tab
4. Find the latest deployment (or the one you want to redeploy)
5. Click the **three dots (⋯)** menu on that deployment
6. Click **"Redeploy"**
7. Watch the build logs in real time

**Option C: If Connected to GitHub**
```bash
git commit --allow-empty -m "Trigger redeploy"
git push origin main
```

**Why redeploy?** Environment variables are only available during build/runtime, so you need to redeploy after adding them.

---

### **Step 7: Verify Deployment** (~5 min)

1. **Check Build Logs:**
   - Go to Vercel Dashboard → Your Project → Deployments
   - Click on the latest deployment
   - Check "Build Logs" for errors

2. **Test Production URL:**
   - Open your production URL: `https://your-app-name.vercel.app`
   - Should load without errors

3. **Quick Smoke Tests:**
   - [ ] Page loads
   - [ ] Sign up works
   - [ ] Sign in works
   - [ ] Chat responds (AI works)
   - [ ] No console errors

4. **Test Database Connection:**
   - Sign up a test user
   - Solve a problem
   - Check Neon dashboard → Tables → Verify data exists
   - **Or use Prisma Studio:**
     ```bash
     # For local development
     npx dotenv -e .env.local -- npx prisma studio
     # Opens at http://localhost:5555
     ```

---

## 🔧 Troubleshooting

### **Build Fails**

**Error: `Missing required environment variable: DATABASE_URL`**
- ✅ This is expected during build (we use dummy URL)
- ✅ Make sure `DATABASE_URL` is set in Vercel env vars
- ✅ The dummy URL in `package.json` build script is intentional

**Error: `Prisma Client not generated`**
- ✅ Check build logs - should see "Prisma Client generated"
- ✅ If not, the `postinstall` script should handle it

**Error: `Module not found`**
- ✅ Check that all dependencies are in `package.json`
- ✅ Run `npm install` locally to verify

---

### **Runtime Errors**

**Error: `Database connection failed`**
- ✅ Check `DATABASE_URL` is correct in Vercel
- ✅ Verify database is accessible (check Neon dashboard)
- ✅ Ensure connection string includes `?sslmode=require`

**Error: `NextAuth configuration error`**
- ✅ Check `NEXTAUTH_URL` matches your production URL exactly
- ✅ Check `NEXTAUTH_SECRET` is set
- ✅ Verify no typos in environment variable names

**Error: `API route not found`**
- ✅ Check Vercel build logs for route compilation
- ✅ Verify API routes are in `app/api/` directory

---

### **Database Issues**

**Migrations not applied:**
```bash
# Connect to production database
export DATABASE_URL="your-production-url"
npx prisma migrate deploy
```

**Check migration status:**
```bash
npx prisma migrate status
```

**View database in browser (Prisma Studio):**
```bash
# For local development
npx dotenv -e .env.local -- npx prisma studio
# Opens at http://localhost:5555

# For production (with DATABASE_URL set)
export DATABASE_URL="your-production-url"
npx prisma studio
```

**Reset database (⚠️ DESTRUCTIVE):**
```bash
npx prisma migrate reset
```

---

## ✅ Post-Deployment Verification

### **Critical Tests:**

1. **Authentication:**
   - [ ] Sign up with new email
   - [ ] Sign in
   - [ ] Sign out
   - [ ] Sign back in → data persists

2. **Core Functionality:**
   - [ ] Type problem → AI responds
   - [ ] Solve problem → XP awarded
   - [ ] Upload image → extracts problem
   - [ ] Generate AI problem → works

3. **Data Persistence:**
   - [ ] Solve problem while logged in
   - [ ] Log out → log back in
   - [ ] Verify XP and conversations persist

4. **Security:**
   - [ ] Test page blocked: `https://your-app.vercel.app/test` → should show access denied
   - [ ] API routes require auth (test manually or check logs)

---

## 🔄 Continuous Deployment

**If connected to GitHub:**
- Vercel automatically deploys on every push to `main` branch
- Pull requests get preview deployments
- Environment variables are automatically available

**Manual deployment (CLI):**
```bash
vercel --prod
```

**Manual redeploy (if connected to GitHub):**
```bash
git commit --allow-empty -m "Redeploy"
git push origin main
```

---

## 📊 Monitoring

**Vercel Dashboard:**
- **Deployments:** View build logs, deployment history
- **Analytics:** Traffic, performance metrics
- **Logs:** Runtime logs (Functions tab)

**Neon Dashboard:**
- **Database:** Connection status, queries
- **Tables:** View data, run queries
- **Metrics:** Database performance

---

## 🎯 Quick Reference

**Environment Variables Needed:**
```bash
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[generated secret]
```

**Deployment Commands:**
```bash
# Pre-deploy checks
npm run lint && npm run build && npm test

# Deploy to production (CLI)
vercel --prod

# Or push to trigger auto-deploy (if connected to GitHub)
git push origin main

# Run migrations (after env vars set)
npx dotenv -e .env.production -- npx prisma migrate deploy
```

**Production URL:**
- Format: `https://[project-name].vercel.app`
- Find in: Vercel Dashboard → Your Project → Settings → Domains

---

## 🚨 Emergency Rollback

**If deployment breaks:**

1. **Revert to previous deployment:**
   - Vercel Dashboard → Deployments
   - Find working deployment
   - Click "..." → "Promote to Production"

2. **Or revert code:**
   ```bash
   git revert HEAD
   git push origin main
   ```

---

**You're ready! Follow the steps above and you'll be live in ~15-20 minutes.** 🚀

