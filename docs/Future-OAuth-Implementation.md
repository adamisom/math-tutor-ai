# Future OAuth Implementation Guide

Guide for adding OAuth providers (Google, GitHub, etc.) to the email/password authentication system.

## Overview

The app currently uses **email/password authentication** via NextAuth.js CredentialsProvider. This guide shows how to add OAuth providers (like Google, GitHub) in the future while keeping email/password as an option.

## Why Add OAuth?

- **Better UX**: One-click sign-in for users with OAuth accounts
- **No password management**: OAuth provider handles security
- **Trusted providers**: Users trust Google/GitHub more than custom auth
- **Faster sign-up**: No need to create password

## Implementation Approach

### Option 1: Add OAuth Alongside Email/Password (Recommended)

Support **both** authentication methods - users choose their preference.

### Option 2: Replace Email/Password with OAuth

Remove email/password entirely and use OAuth only.

---

## Step-by-Step: Add Google OAuth

### Step 1: Install Dependencies

No additional packages needed - NextAuth.js includes Google provider.

### Step 2: Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Enable **Google+ API** (APIs & Services → Library)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Copy **Client ID** and **Client Secret**

### Step 3: Update Environment Variables

Add to `.env.local`:

```bash
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

### Step 4: Update Auth Configuration

**File**: `app/lib/auth.ts`

```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use PrismaAdapter for OAuth, JWT for Credentials
  adapter: PrismaAdapter(prisma),
  
  providers: [
    // Keep existing email/password
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // ... existing code ...
      },
    }),
    
    // Add Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  // Use JWT when mixing Credentials with adapter
  session: {
    strategy: 'jwt',
  },
  
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/',
  },
});
```

### Step 5: Update Prisma Schema

**File**: `prisma/schema.prisma`

The schema already supports OAuth via the `Account` model. No changes needed if you're adding OAuth alongside email/password.

**Note**: The `password` field in `User` model should remain nullable to support OAuth users (who don't have passwords).

### Step 6: Update UI Components

**File**: `app/components/auth-button.tsx`

Add Google sign-in option:

```typescript
// In the sign-in modal, add:
<button
  onClick={() => signIn('google')}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
>
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    {/* Google icon SVG */}
  </svg>
  Sign in with Google
</button>
```

Or add a separate "Sign in with Google" button alongside "Sign In".

### Step 7: Handle Account Linking

**Important**: If a user signs up with email/password, then later tries to sign in with Google using the same email, you may want to link accounts.

**File**: `app/lib/auth.ts` (in callbacks)

```typescript
callbacks: {
  async signIn({ user, account, profile }) {
    // If signing in with OAuth and email already exists with password
    if (account?.provider === 'google') {
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });
      
      if (existingUser?.password) {
        // Email already has password - you can:
        // Option 1: Link accounts (create Account record)
        // Option 2: Prevent sign-in, ask to use password
        // Option 3: Allow both (recommended)
      }
    }
    return true;
  },
  // ... rest of callbacks
}
```

---

## Step-by-Step: Add GitHub OAuth

Same process as Google, but simpler setup:

### Step 1: Get GitHub OAuth Credentials

1. Go to GitHub → Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Application name: `Math Tutor AI`
4. Homepage URL: `http://localhost:3000` (or production URL)
5. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
6. Copy **Client ID** and **Client Secret**

### Step 2: Update Environment Variables

```bash
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

### Step 3: Update Auth Configuration

**File**: `app/lib/auth.ts`

```typescript
import GitHubProvider from 'next-auth/providers/github';

// In providers array:
GitHubProvider({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
}),
```

---

## Key Code Fragments

### Complete Auth Config (Both Providers)

```typescript
// app/lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user || !user.password) {
          return null;
        }
        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );
        if (!isValid) {
          return null;
        }
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  
  session: {
    strategy: 'jwt',
  },
  
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  
  pages: {
    signIn: '/',
  },
});
```

### Sign In with OAuth (Client Component)

```typescript
// In any client component
import { signIn } from 'next-auth/react';

// Sign in with Google
<button onClick={() => signIn('google')}>
  Sign in with Google
</button>

// Sign in with GitHub
<button onClick={() => signIn('github')}>
  Sign in with GitHub
</button>
```

### Account Linking Logic

```typescript
// In auth.ts callbacks
callbacks: {
  async signIn({ user, account, profile }) {
    if (account?.provider === 'google' || account?.provider === 'github') {
      // Check if email already exists with password
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });
      
      if (existingUser?.password) {
        // User exists with password - allow both methods
        // Or implement account linking logic here
      }
    }
    return true;
  },
}
```

---

## Testing OAuth

### Local Development

1. Set up OAuth credentials (Google/GitHub)
2. Add to `.env.local`
3. Start dev server: `npm run dev`
4. Click "Sign in with Google/GitHub"
5. Complete OAuth flow
6. Verify user created in database

### Production

1. Add production redirect URI to OAuth app
2. Add environment variables to Vercel
3. Deploy
4. Test OAuth flow in production

---

## Migration Strategy

### From Email/Password to OAuth-Only

1. **Phase 1**: Add OAuth alongside email/password (users can choose)
2. **Phase 2**: Encourage OAuth sign-in (better UX)
3. **Phase 3**: Optionally deprecate email/password (if desired)

### Keeping Both (Recommended)

- **Email/Password**: For users who prefer it or don't have OAuth accounts
- **OAuth**: For users who want one-click sign-in
- **Same account**: If email matches, link accounts (optional)

---

## Additional OAuth Providers

NextAuth.js supports many providers:

- **GitHub**: `GitHubProvider` (simplest setup)
- **Google**: `GoogleProvider` (most common)
- **Facebook**: `FacebookProvider`
- **Twitter**: `TwitterProvider`
- **Discord**: `DiscordProvider`
- **And many more**: See [NextAuth.js providers](https://next-auth.js.org/providers/)

All follow the same pattern:
1. Get credentials from provider
2. Add to environment variables
3. Import and add to providers array
4. Update UI to include sign-in button

---

## Troubleshooting

### "redirect_uri_mismatch"

- Check redirect URI matches exactly (no trailing slash)
- Development: `http://localhost:3000/api/auth/callback/google`
- Production: `https://your-domain.com/api/auth/callback/google`

### "OAuth account not linking to existing user"

- Implement account linking in `signIn` callback
- Or allow separate accounts (same email, different auth methods)

### "Session not persisting with OAuth"

- Ensure `session.strategy = 'jwt'` when mixing Credentials with adapter
- Or use database sessions for OAuth only (remove Credentials)

---

## Resources

- [NextAuth.js OAuth Providers](https://next-auth.js.org/providers/)
- [Google OAuth Setup](https://developers.google.com/identity/protocols/oauth2)
- [GitHub OAuth Setup](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)

---

**Last Updated**: November 2025  
**Current Auth**: Email/Password (CredentialsProvider)  
**Future Enhancement**: Add OAuth providers alongside email/password

