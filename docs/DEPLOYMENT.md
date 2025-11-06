# Deployment Guide

This guide walks you through deploying the AI Math Tutor to a public URL.

## Quick Deploy: Vercel (Recommended - 5-10 minutes)

### Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin implementation
```

### Step 2: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Easiest)

1. **Sign up/Login** at [vercel.com](https://vercel.com) (use GitHub account)
2. **Click "Add New Project"**
3. **Import your GitHub repository** (`math-tutor-ai`)
4. **Configure Project:**
   - Framework Preset: `Next.js` (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
5. **⚠️ CRITICAL: Add Environment Variable**
   - Before clicking "Deploy", scroll down to **"Environment Variables"**
   - Click **"Add"** button
   - Name: `ANTHROPIC_API_KEY`
   - Value: Your actual API key (starts with `sk-ant-api03-...`)
   - Select environments: ✅ Production, ✅ Preview, ✅ Development
   - Click **"Save"**
6. **Click "Deploy"**
7. Wait 2-3 minutes for build and deployment

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (will prompt for configuration)
vercel

# When prompted:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? math-tutor-ai
# - Directory? ./
# - Override settings? No

# Add environment variable
vercel env add ANTHROPIC_API_KEY production
# Paste your API key when prompted

# Deploy to production
vercel --prod
```

### Step 3: Verify Deployment

1. Visit your deployment URL (provided by Vercel)
2. Test with a simple problem: `2x + 5 = 13`
3. If you see "Server configuration error", check:
   - Environment variable is set correctly in Vercel dashboard
   - Environment variable is set for all environments (Production, Preview, Development)
   - You may need to redeploy after adding the env var

### Step 4: Update Environment Variables (After Deployment)

If you need to update the API key later:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Edit `ANTHROPIC_API_KEY`
3. Save changes
4. Redeploy: Go to Deployments tab → Click "..." on latest deployment → "Redeploy"

---

## Alternative Platforms

### Netlify

1. Sign up at [netlify.com](https://netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect GitHub repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
5. **Add Environment Variable:**
   - Go to Site settings → Environment variables
   - Add `ANTHROPIC_API_KEY` with your key
6. Deploy

### Railway

1. Sign up at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub repo
3. Add environment variable in Variables tab
4. Railway auto-detects Next.js and deploys

### Render

1. Sign up at [render.com](https://render.com)
2. New → Web Service → Connect GitHub repo
3. Settings:
   - Build command: `npm run build`
   - Start command: `npm start`
4. Add `ANTHROPIC_API_KEY` in Environment section

---

## Troubleshooting

### "Server configuration error" after deployment

**Cause:** Missing or incorrect `ANTHROPIC_API_KEY` environment variable.

**Fix:**
1. Check Vercel dashboard → Settings → Environment Variables
2. Verify `ANTHROPIC_API_KEY` exists and is correct
3. Ensure it's enabled for Production environment
4. Redeploy the project

### Build fails with TypeScript errors

**Fix:**
```bash
# Fix locally first
npm run build
npm run lint

# Fix any errors, then push and redeploy
git add .
git commit -m "Fix TypeScript errors"
git push
```

### Build succeeds but app doesn't work

**Check:**
- Environment variables are set for **all environments** (Production, Preview, Development)
- API key is correct (no extra spaces, correct format)
- Check Vercel deployment logs for errors
- Verify the API key works locally: `npm run dev`

### Environment variable not taking effect

**Solution:**
- After adding/updating env vars, you **must redeploy**
- Go to Deployments tab → Click "..." → "Redeploy"
- Or trigger a new deployment by pushing a commit

---

## Security Checklist

- ✅ Never commit `.env.local` to git (already in `.gitignore`)
- ✅ Never commit API keys in code or documentation
- ✅ Use environment variables in production
- ✅ Rotate API keys if accidentally exposed
- ✅ Use different API keys for dev/staging/production if needed

---

## Post-Deployment

After successful deployment:

1. **Test the public URL** with a few problems
2. **Monitor usage** in Vercel dashboard for API costs
3. **Set up custom domain** (optional) in Vercel Settings → Domains
4. **Enable preview deployments** (default) - each PR gets its own URL

---

## Support

If you encounter issues:
- Check Vercel deployment logs: Dashboard → Your Project → Deployments → Click deployment → View logs
- Check browser console for client-side errors
- Verify environment variables are set correctly
- Test locally first: `npm run dev` should work before deploying

