# Restarting Leinen los! After Dormancy

Use this when the app has not been used or deployed for weeks or months and something stops working (504s, endless “Loading…”, login failures, or blank auth).

The hosted stack is **Vercel** (frontend) + **Supabase** (auth, progress sync, analytics) + **Google Cloud** (Google sign-in). The study app itself runs from **bundled JSON** in the repo, so Learn/Exam can work without Supabase—but **login, sync, and analytics need a live Supabase project**.

---

## What typically breaks after inactivity

| Symptom | Likely cause | Layer |
|--------|----------------|--------|
| **504 — Middleware invocation timeout** | Edge middleware called Supabase on every request; paused/slow backend exceeded Vercel’s limit | Vercel + Supabase |
| **Home / Explore / Learn stuck on “Loading…”** | Client waited forever on `supabase.auth.getUser()` or server hydration; `hydrated` never became `true` | Supabase + app |
| **Magic link — “NetworkError when attempting to fetch resource”** | Browser cannot reach Supabase (project paused, deleted, or wrong URL) | Supabase |
| **Google — “Could not create a session…”** | Google OAuth succeeded but Supabase rejected session, or cookies not set on redirect; or Supabase down | Supabase + Google + app |
| **Google — redirect_uri_mismatch** | Redirect URI in Google Console ≠ actual callback URL | Google Cloud |
| **Login page exists but no way to open it** | Optional-auth UX (guest mode) without visible “Sign in” (since fixed in nav/settings/home) | App (historical) |
| **DNS / host not found for `*.supabase.co`** | Free project **paused** long enough or **removed**; old URL still in Vercel env | Supabase + Vercel |

---

## Quick diagnosis (5 minutes)

### 1. Production loads at all?

Open: **https://leinen-los.vercel.app**

- **504 on every page** → see [Middleware / Supabase slowness](#middleware--supabase-slowness) below.
- **Pages load but dashboard stuck on Loading** → see [Client hydration](#client-hydration--loading-state).
- **Guest study works, login fails** → see [Supabase auth](#supabase-auth-restore--verify).

### 2. Is Supabase reachable?

From the project root (uses `.env.local` or env vars):

```bash
node scripts/check-supabase.mjs
```

- **DNS NOT FOUND** → project gone or wrong `NEXT_PUBLIC_SUPABASE_URL`. Restore or create project in [Supabase Dashboard](https://supabase.com/dashboard), then update Vercel env (below).
- **DNS OK, auth health responds** → backend is up; focus on [Auth URL config](#supabase-auth-urls) and [Google](#google-oauth).

### 3. Does Google OAuth start?

In a browser or:

```bash
# Expect HTTP 307 to accounts.google.com
curl -sI "https://leinen-los.vercel.app/api/auth/google" | head -5
```

If that works but login still fails after choosing an account → Supabase session step or [Google provider](#google-oauth) in Supabase.

### 4. Local build still healthy?

```bash
npm ci
npm run build
npm run lint
```

---

## Restart procedure (ordered checklist)

### A. Supabase — restore or wake

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard).
2. Open project **`bicadbjleqvhxoyliiod`** (or your current ref).
3. If status is **Paused**: click **Restore project** / **Unpause** and wait until the dashboard shows **Active** (can take a few minutes).
4. If the project was **deleted**: create a **new** project, then:
   - Run SQL from `supabase/migrations/001_initial_schema.sql` in **SQL Editor**.
   - Optionally seed questions: `python scripts/seed_database.py` (requires `scripts/.env` with service role key).
   - Update all Supabase-related env vars on Vercel (step C).

**Prevent future pauses (free tier):** see `docs/BACKLOG.md` **BL-001** — GitHub Actions cron, Vercel cron `/api/keep-alive`, or external ping every 3–5 days.

### B. Supabase auth — restore & verify

1. **Authentication → Providers**
   - **Email**: enabled (password + magic link).
   - **Google**: enabled. For the direct Google flow (this app), ensure your Google **Client ID** is allowed in Supabase Google settings if prompted.

2. **Authentication → URL configuration**
   - **Site URL:** `https://leinen-los.vercel.app`
   - **Redirect URLs:** `https://leinen-los.vercel.app/**`  
   (Add `http://localhost:3000/**` for local dev.)

3. Confirm keys in **Project Settings → API** still match Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server/admin only)

### C. Vercel — env vars and redeploy

1. [Vercel → leinen-los → Settings → Environment Variables](https://vercel.com/dbpotapov-9362s-projects/leinen-los/settings/environment-variables) (Production).

   Required:

   | Variable | Purpose |
   |----------|---------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Auth + sync |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client auth |
   | `SUPABASE_SERVICE_ROLE_KEY` | Admin analytics API |
   | `ADMIN_PASSWORD` | `/admin` dashboard |
   | `GOOGLE_CLIENT_ID` | Google sign-in |
   | `GOOGLE_CLIENT_SECRET` | Google token exchange |
   | `NEXT_PUBLIC_SITE_URL` | Stable OAuth redirect base (`https://leinen-los.vercel.app`) |

   Template: `.env.example` in repo root.

2. **Redeploy** (env changes need a new deployment):

   ```bash
   cd "/path/to/Leinen los"
   npx vercel login   # if needed
   npx vercel deploy --prod --yes
   ```

   Or: Vercel → Deployments → **Redeploy** latest production.

3. **Git auto-deploy (optional):** connect repo `dima-potapov-1/leinen-los` under Settings → Git (requires Vercel GitHub app access to the repo).

### D. Google OAuth

In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials** → your OAuth client:

1. **Authorized redirect URI (exact):**  
   `https://leinen-los.vercel.app/api/auth/google/callback`

2. **OAuth consent screen:** **Published** (not Testing-only), or add test users while in Testing.

3. If the client secret was ever exposed, **rotate** secret and update `GOOGLE_CLIENT_SECRET` on Vercel (see **BL-010** in backlog).

### E. Smoke test after restart

| Test | Expected |
|------|----------|
| Open `/` without login | 200, dashboard visible (not endless Loading) |
| Open `/learn` | 200, questions load |
| `/login` → Magic link | No network error; email arrives |
| `/login` → Continue with Google | Google consent → redirect home, signed in |
| Settings → Account | Shows email when signed in |

---

## Middleware & Supabase slowness

Production middleware **refreshes Supabase sessions** only when an `sb-*` auth cookie is present; **guests skip Supabase** to avoid 504 timeouts when the backend is slow.

If you still see middleware timeouts after Supabase is healthy, check Vercel deployment logs for the deployment that includes `middleware.ts` guest fast-path and auth timeout (see git history: “Fix middleware timeout for guests and slow Supabase”).

---

## Client hydration & loading state

Study pages and home stats wait until progress/preferences stores are **`hydrated`**. After dormancy, slow or hanging Supabase auth could leave `hydrated === false` forever.

The app mitigates this with:

- Time-bounded `getUser()` in `useAuth`
- Time-bounded server hydration in stores
- Fail-open to localStorage after a few seconds
- Home dashboard renders without blocking on sync (shows “Syncing progress…” when relevant)

If Loading persists after Supabase is restored, redeploy latest `main` from GitHub.

---

## Local development restart

```bash
cd "/path/to/Leinen los"
cp .env.example .env.local   # fill from Vercel or Supabase dashboard
npm ci
node scripts/check-supabase.mjs
npm run dev
```

Open http://localhost:3000 — guest mode should work; login needs the same Supabase project as production (or a separate dev project with matching redirect URLs).

---

## Repo and deployment references

| Resource | Location |
|----------|----------|
| GitHub | https://github.com/dima-potapov-1/leinen-los |
| Production | https://leinen-los.vercel.app |
| Auth setup (first-time) | `docs/AUTH_SETUP_GUIDE.md` |
| Env template | `.env.example` |
| Supabase connectivity check | `scripts/check-supabase.mjs` |
| Backlog (keep-alive, secret rotation) | `docs/BACKLOG.md` |

---

## Thread summary (2026-04 — dormancy incident)

What we did in one incident response pass:

1. Verified build/lint and question data; fixed **optional guest auth** (middleware no longer forces login).
2. Restored **localStorage progress** for guests; fixed **hydrated** gating and home **Loading** stall.
3. Linked **Sign in** in UI; deployed to Vercel via CLI (Git connect blocked on GitHub app permissions).
4. Fixed **middleware 504** by skipping Supabase for guests and timing out auth refresh.
5. Fixed **Google OAuth** session cookies on callback redirect; set **`NEXT_PUBLIC_SITE_URL`** on Vercel.
6. Diagnosed **Supabase NXDOMAIN** after months idle → user **restored project** in dashboard; auth worked again after DNS/API recovery.

**Root lesson:** Vercel and Google credentials can remain valid for months, but **Supabase Free tier pauses or removes inactive projects**. Always run `node scripts/check-supabase.mjs` first when auth or sync breaks after a gap.
