# Google OAuth Setup Guide

Step-by-step guide to get Google OAuth credentials for authentication.

## Quick Overview

You need to:
1. Create a Google Cloud project
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI
5. Copy credentials to `.env.local`

**Time required**: ~5-10 minutes

---

## Step-by-Step Instructions

### Step 1: Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

### Step 2: Create or Select a Project

1. Click the **project dropdown** at the top (next to "Google Cloud")
2. Click **"New Project"**
3. Enter project name: `Math Tutor AI` (or any name)
4. Click **"Create"**
5. Wait for project to be created, then select it from the dropdown

**OR** if you already have a project, just select it from the dropdown.

### Step 3: Enable Google+ API

1. In the left sidebar, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google+ API"**
3. Click on **"Google+ API"**
4. Click **"Enable"**
5. Wait for it to enable

**Note**: Google+ API is being deprecated, but it's still needed for OAuth. Google is transitioning to "Google Identity Services" but NextAuth.js still uses the OAuth 2.0 flow which requires this API.

### Step 4: Create OAuth 2.0 Credentials

1. In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

**If this is your first time:**
- You'll see a warning about "OAuth consent screen"
- Click **"Configure consent screen"**
- Select **"External"** (unless you have a Google Workspace)
- Click **"Create"**
- Fill in:
  - **App name**: `Math Tutor AI` (or any name)
  - **User support email**: Your email
  - **Developer contact email**: Your email
- Click **"Save and Continue"**
- On "Scopes" page, click **"Save and Continue"**
- On "Test users" page, click **"Save and Continue"**
- On "Summary" page, click **"Back to Dashboard"**

**Now create the OAuth client:**
4. Click **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
5. **Application type**: Select **"Web application"**
6. **Name**: `Math Tutor AI Local` (or any name)
7. **Authorized redirect URIs**: Click **"+ ADD URI"** and add:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
8. Click **"Create"**

### Step 5: Copy Your Credentials

You'll see a popup with:
- **Your Client ID**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
- **Your Client Secret**: `GOCSPX-abcdefghijklmnopqrstuvwxyz`

**⚠️ Important**: Copy these NOW - you won't be able to see the secret again!

### Step 6: Add to `.env.local`

Add these to your `.env.local` file:

```bash
GOOGLE_CLIENT_ID="123456789-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abcdefghijklmnopqrstuvwxyz"
```

Replace with your actual values.

---

## For Production (Vercel/Deployment)

When deploying to production, you'll need to:

1. **Add production redirect URI**:
   - Go back to Google Cloud Console → Credentials
   - Edit your OAuth client
   - Add another redirect URI:
     ```
     https://your-domain.vercel.app/api/auth/callback/google
     ```
   - Replace `your-domain.vercel.app` with your actual domain

2. **Update environment variables** in Vercel:
   - Use the same `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
   - Update `NEXTAUTH_URL` to your production URL

---

## Troubleshooting

### "redirect_uri_mismatch" Error

**Problem**: Redirect URI doesn't match what's configured.

**Solution**:
1. Check your redirect URI in Google Cloud Console
2. Must be exactly: `http://localhost:3000/api/auth/callback/google`
3. No trailing slashes, exact match required
4. For production: `https://your-domain.com/api/auth/callback/google`

### "OAuth consent screen not configured"

**Problem**: You tried to create OAuth client before configuring consent screen.

**Solution**:
1. Go to **"APIs & Services"** → **"OAuth consent screen"**
2. Complete the configuration (see Step 4 above)
3. Then create OAuth client

### "Invalid client secret"

**Problem**: Copied the secret incorrectly or it's expired.

**Solution**:
1. Go to Google Cloud Console → Credentials
2. Click on your OAuth client
3. Click **"Reset secret"** (or create new client)
4. Copy the new secret to `.env.local`

### Can't find "Google+ API"

**Problem**: API might be named differently or deprecated.

**Solution**:
- Search for **"Google Identity Services"** or **"OAuth 2.0"**
- The OAuth client creation should work even without enabling the API
- Try creating the OAuth client directly (Step 4)

---

## Quick Checklist

- [ ] Google Cloud project created/selected
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 client created (Web application type)
- [ ] Redirect URI added: `http://localhost:3000/api/auth/callback/google`
- [ ] Client ID copied to `.env.local`
- [ ] Client Secret copied to `.env.local`
- [ ] `.env.local` file saved
- [ ] Restart dev server: `npm run dev`

---

## Security Notes

1. **Never commit** `.env.local` to git (already in `.gitignore`)
2. **Never share** your Client Secret publicly
3. **Use different credentials** for development and production
4. **Rotate secrets** if they're ever exposed

---

## Alternative: Skip OAuth for Testing

If you just want to test the database/API without OAuth:

1. You can test anonymous user functionality (localStorage only)
2. For authenticated features, you'll need the OAuth credentials
3. Consider using a mock auth provider for development (advanced)

---

**Last Updated**: November 2025  
**Related**: See `docs/Phase8-Testing-Guide.md` for full testing instructions

