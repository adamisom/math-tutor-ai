# Email/Password Authentication Guide

Guide for switching from Google OAuth to email/password authentication using NextAuth.js Credentials Provider.

## Is It Straightforward?

**Yes!** NextAuth.js has built-in support for email/password via the `CredentialsProvider`. However, there are some important considerations:

### ✅ What Makes It Easy
- NextAuth.js CredentialsProvider is well-documented
- Works with your existing Prisma setup
- No external OAuth setup needed
- Full control over user accounts

### ⚠️ What You Need to Add
- Password hashing (bcrypt)
- Sign-up API route
- Sign-up UI component
- Password reset flow (optional but recommended)
- Email verification (optional but recommended)

### 🔄 Important Change
- **CredentialsProvider uses JWT strategy** (not database sessions)
- Can't use `PrismaAdapter` for sessions with CredentialsProvider
- Need to switch to JWT sessions OR use both providers

---

## Implementation Steps

### Step 1: Install Dependencies

```bash
npm install bcryptjs
npm install --save-dev @types/bcryptjs
```

### Step 2: Update Prisma Schema

Add password field to User model:

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?   // Add this - nullable for OAuth users
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  conversations Conversation[]
  xpState       XPState?
}
```

Run migration:
```bash
npx prisma migrate dev --name add-password-field
```

### Step 3: Update Auth Configuration

**Option A: Replace Google with Credentials (Simplest)**

```typescript
// app/lib/auth.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Remove PrismaAdapter - CredentialsProvider uses JWT
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
  ],
  session: {
    strategy: 'jwt', // Required for CredentialsProvider
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
    signIn: '/auth/signin',
  },
});
```

**Option B: Support Both Google AND Email/Password (Recommended)**

```typescript
// app/lib/auth.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma), // Works for Google OAuth
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Same as Option A
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Required when mixing Credentials with adapter
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

### Step 4: Create Sign-Up API Route

```typescript
// app/api/auth/signup/route.ts
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: 'User already exists' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name: name || null,
        password: hashedPassword,
      },
    });

    return Response.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    console.error('Sign-up error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create account' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

### Step 5: Create Sign-Up UI Component

```typescript
// app/components/signup-form.tsx
'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create account
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Sign-up failed');
      }

      // Auto sign-in after sign-up
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error('Sign-in failed');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-red-600 text-sm">{error}</div>
      )}
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name (optional)
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

### Step 6: Update Sign-In Component

Update `app/components/auth-button.tsx` to support email/password sign-in:

```typescript
// Add sign-in form modal
// Use signIn('credentials', { email, password }) for email/password
// Use signIn('google') for Google OAuth
```

---

## Comparison: Google OAuth vs Email/Password

| Aspect | Google OAuth | Email/Password |
|--------|--------------|----------------|
| **Setup Time** | 10 min (one-time) | 30-60 min (implementation) |
| **User Experience** | Click button → done | Enter email/password |
| **Password Management** | None (Google handles) | You handle (hashing, reset) |
| **Email Verification** | Automatic | You implement |
| **Password Reset** | Not needed | You implement |
| **Security** | Google's security | Your responsibility |
| **External Dependencies** | Google Cloud | None (except email service) |
| **Cost** | Free | Free (but need email service) |

---

## Recommended Approach: Support Both

**Best of both worlds:**

1. **Keep Google OAuth** for users who prefer it
2. **Add Email/Password** for users who don't have/want Google accounts
3. **Same user can use either** (same email = same account)

**Implementation:**
- Use Option B above (both providers)
- Update UI to show both options
- Users choose their preferred method

---

## Additional Features to Consider

### 1. Email Verification (Recommended)

```typescript
// Add emailVerified field (already in schema)
// Send verification email on sign-up
// Check emailVerified before allowing login
```

**Email Service Options:**
- **Resend** (recommended): Simple, good free tier
- **SendGrid**: More features, $10/month after free tier
- **AWS SES**: Cheapest, more complex setup

### 2. Password Reset Flow

```typescript
// app/api/auth/reset-password/route.ts
// Generate reset token
// Send reset email
// Verify token and update password
```

### 3. Password Requirements

```typescript
// Enforce minimum length, complexity
// Show password strength indicator
```

---

## Migration Path

### Phase 1: Add Email/Password (Keep Google)
1. Add password field to schema
2. Add CredentialsProvider alongside Google
3. Create sign-up API route
4. Create sign-up UI
5. Test both methods work

### Phase 2: Enhance (Optional)
1. Add email verification
2. Add password reset
3. Add password strength requirements

### Phase 3: Remove Google (If Desired)
1. Remove GoogleProvider
2. Remove GOOGLE_CLIENT_ID/SECRET from env
3. Update UI to remove Google sign-in option

---

## Code Changes Summary

**Files to Create:**
- `app/api/auth/signup/route.ts` - Sign-up endpoint
- `app/components/signup-form.tsx` - Sign-up UI

**Files to Modify:**
- `app/lib/auth.ts` - Add CredentialsProvider
- `prisma/schema.prisma` - Add password field
- `app/components/auth-button.tsx` - Add sign-up option

**Dependencies to Add:**
- `bcryptjs` - Password hashing
- `@types/bcryptjs` - TypeScript types

---

## Is It Worth It?

**Choose Email/Password if:**
- ✅ You want full control over user accounts
- ✅ Users don't have/want Google accounts
- ✅ You want to avoid external OAuth setup
- ✅ You're willing to implement password management

**Stick with Google OAuth if:**
- ✅ You want fastest setup (10 min vs 1 hour)
- ✅ You want zero password management
- ✅ Your users likely have Google accounts
- ✅ You want simplest user experience

**Best Option: Support Both!**
- ✅ Maximum flexibility
- ✅ Users choose their preference
- ✅ Best user experience

---

## Quick Start: Add Email/Password

1. **Install**: `npm install bcryptjs @types/bcryptjs`
2. **Schema**: Add `password String?` to User model
3. **Auth**: Add CredentialsProvider to `app/lib/auth.ts`
4. **API**: Create `/api/auth/signup/route.ts`
5. **UI**: Create sign-up form component
6. **Test**: Sign up and sign in with email/password

**Time estimate**: 1-2 hours for basic implementation

---

**Last Updated**: November 2025  
**Related**: See `docs/Production-Auth-Options.md` for comparison

