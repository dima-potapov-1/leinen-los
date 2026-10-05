# Authentication Setup Guide

Lessons learned from setting up Supabase Auth + Google OAuth on a Next.js 15 (App Router) app deployed to Vercel. Use this as a checklist for future projects.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Supabase** (Auth + PostgreSQL + RLS)
- **Vercel** (hosting)
- **Zustand** (client state, hydrated from server)

---

## Part 1: Supabase Auth — Email + Magic Link

### Supabase Dashboard Setup

1. Create a Supabase project
2. Go to **Authentication → Providers** and enable Email (enabled by default)
3. Note your **Project URL** and **Anon Key** from Settings → API

### Vercel Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-side only, never expose to client
```

### Code Files Needed

| File | Purpose |
|---|---|
| `src/lib/supabase-client.ts` | Browser client via `createBrowserClient` from `@supabase/ssr` |
| `src/lib/supabase-server.ts` | Server client via `createServerClient` with cookie handling |
| `middleware.ts` | Refreshes session on every request, protects routes |
| `app/login/page.tsx` | Login UI (email+password, magic link, Google) |
| `app/auth/callback/route.ts` | Handles magic link / email confirmation redirects |
| `app/auth/confirm/route.ts` | Handles email verification OTP |
| `src/hooks/useAuth.ts` | Client-side hook for auth state + signOut |
| `src/components/AuthProvider.tsx` | Wraps app, hydrates stores from server on login |

### Middleware Pattern

```typescript
const PUBLIC_ROUTES = ["/login", "/auth/callback", "/auth/confirm", "/about", "/api"];

// In middleware:
// 1. Create Supabase server client with cookie handling
// 2. Call supabase.auth.getUser() to refresh session
// 3. If no user + protected route → redirect to /login
// 4. If user + on /login → redirect to /
```

**Important:** Always include `/api` in public routes if you have public API endpoints (analytics, webhooks).

### Login Page — Wrap in Suspense

The login page uses `useSearchParams()` for error handling. Next.js requires this to be wrapped in `<Suspense>`:

```tsx
export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
```

### signOut Must Redirect

Supabase's `signOut()` clears the session but doesn't redirect. Add an explicit redirect:

```typescript
const signOut = async () => {
  await supabase.auth.signOut();
  window.location.href = "/login";  // hard redirect, not router.push
};
```

---

## Part 2: Google OAuth — Direct Flow (No Supabase Middleman)

### Why Direct?

If you let Supabase handle the Google OAuth redirect, users see "Sign in to `<random>.supabase.co`" on Google's consent screen. Direct flow shows your own domain.

### Google Cloud Console Setup

**Step 1: Create OAuth consent screen**
1. Go to **APIs & Services → OAuth consent screen**
2. Choose **External** user type
3. Fill in: App name, User support email, Developer contact email
4. Add authorized domain: `your-app.vercel.app`
5. **CRITICAL: Publish the app.** Click "Publish App" to move from Testing → Production. In Testing mode, only explicitly listed test users can sign in. Everyone else gets a misleading "OAuth client was not found" error.

**Step 2: Create OAuth client**
1. Go to **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Application type: **Web application**
3. Authorized JavaScript origins: `https://your-app.vercel.app` (and `http://localhost:3000` for dev)
4. Authorized redirect URIs: `https://your-app.vercel.app/api/auth/google/callback`
5. Copy the **Client ID** and **Client Secret**

### Vercel Environment Variables

```
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

**Gotcha:** When adding via CLI, use `printf '%s'` not `echo` to avoid trailing newlines:
```bash
printf '%s' 'your-client-id' | vercel env add GOOGLE_CLIENT_ID production
```

### Code Files for Direct Google OAuth

**`app/api/auth/google/route.ts`** — Initiates OAuth by redirecting to Google:
```typescript
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${origin}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
  });
  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  );
}
```

**`app/api/auth/google/callback/route.ts`** — Receives code from Google, exchanges for tokens, creates Supabase session:
```typescript
import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=google_auth_cancelled`);
  }

  // Exchange code for tokens with Google
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${origin}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  const tokens = await tokenRes.json();

  if (!tokens.id_token) {
    return NextResponse.redirect(`${origin}/login?error=token_exchange_failed`);
  }

  // Create Supabase session from Google ID token
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: tokens.id_token,
    access_token: tokens.access_token,
  });

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  return NextResponse.redirect(`${origin}/`);
}
```

**Login page button** — just a redirect, no Supabase SDK needed:
```typescript
const handleGoogle = () => {
  window.location.href = "/api/auth/google";
};
```

---

## Part 3: Cross-Device Progress Sync

### Pattern: Zustand + Write-Through to Supabase

1. Remove Zustand `persist` middleware (no more localStorage)
2. Add `hydrateFromServer(userId)` — fetches data from Supabase on login
3. Every state mutation fires an async Supabase upsert (fire-and-forget)
4. Add `clearForLogout()` to reset state on sign-out

### First-Login Migration

On first login, check if server has data. If not, read from localStorage, batch-upsert to Supabase, then clear localStorage. Show a toast to the user explaining what happened.

### Daily Counter (todayAnswered) Gotchas

- **Timezone:** Query `updated_at >= ?` using UTC midnight from the client's local timezone, not `new Date().toISOString().slice(0, 10)` (which gives the date string without timezone awareness)
- **Semantics:** Hydration counts unique records; runtime increments per answer. Use `Math.max(dbCount, serverCounter)` to prevent the counter from going backwards on reload.

---

## Part 4: Supabase Database

### Tables

| Table | RLS | Purpose |
|---|---|---|
| `profiles` | `auth.uid() = id` | User preferences (JSON column) |
| `user_progress` | `auth.uid() = user_id` | Per-question mastery, attempts, bookmarks |
| `exam_attempts` | `auth.uid() = user_id` | Exam history |
| `analytics_events` | Insert: allow all; Select: service role only | Anonymous + authenticated telemetry |

### Common Issues

- **Foreign key on question_id:** If `user_progress.question_id` has a FK to a `questions` table that's empty, all upserts silently fail. Either populate the questions table or drop the FK constraint.
- **Analytics user_id column:** Add after implementing auth: `ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS user_id uuid;`

---

## Debugging Checklist

When Google OAuth fails:

| Symptom | Cause | Fix |
|---|---|---|
| "OAuth client was not found" (401) | Consent screen in Testing mode | Publish app in Google Cloud Console |
| "redirect_uri_mismatch" (400) | Redirect URI doesn't match registered URI exactly | Check for trailing slashes, http vs https |
| "invalid_client" at token endpoint | Wrong client_id or client_secret | Verify env vars, check for trailing newlines |
| Silent failure (no error, no session) | Cookie not being set | Check `createSupabaseServer` cookie handling in Route Handler |
| User sees Supabase URL on consent | Using Supabase OAuth proxy | Switch to direct Google OAuth flow |
| Data loss after login | FK constraint blocking upserts | Check Supabase logs, drop problematic FK |

### Quick Credential Test

Test if Google recognizes your credentials without needing a real auth code:
```bash
curl -s -X POST "https://oauth2.googleapis.com/token" \
  -d "code=dummy&client_id=YOUR_ID&client_secret=YOUR_SECRET&redirect_uri=YOUR_URI&grant_type=authorization_code"
```
- `invalid_grant` (bad code) = credentials are valid
- `invalid_client` = credentials are wrong or client doesn't exist

---

## Full Setup Checklist for New Projects

- [ ] Create Supabase project, note URL + keys
- [ ] Add Supabase env vars to Vercel
- [ ] Install `@supabase/ssr` and `@supabase/supabase-js`
- [ ] Create browser + server Supabase clients
- [ ] Create middleware with session refresh + route protection
- [ ] Create login page with Suspense wrapper
- [ ] Create `/auth/callback` and `/auth/confirm` routes
- [ ] Create `useAuth` hook with explicit signOut redirect
- [ ] Create `AuthProvider` for store hydration
- [ ] Set up Google Cloud Console: consent screen → **publish** → OAuth client
- [ ] Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Vercel (use `printf`, not `echo`)
- [ ] Create `/api/auth/google` and `/api/auth/google/callback` routes
- [ ] Add redirect URI to Google Cloud Console (must match exactly)
- [ ] Set up RLS policies on all Supabase tables
- [ ] Test: email sign-up, email sign-in, magic link, Google OAuth, sign-out, cross-device sync
