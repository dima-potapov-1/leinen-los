# Leinen los! — Backlog

Actionable tasks and decisions that arise during development. Each item links back to the phased delivery in [PROJECT_PLAN.md](../PROJECT_PLAN.md) where relevant.

**Format:** Tasks are grouped by status. Each task has an ID, short description, context, and optional link to a delivery phase or user story.

---

## To Do

### BL-003 · Re-generate 108 flagged explanations with targeted prompts

**Phase:** Data Pipeline (post-judge)
**Context:** 108 out of 191 flags are explanation logic errors — the LLM fabricated reasoning about regulations, physics, or safety in the "why option X is wrong" text. These affect 82 questions across all three languages. The judge's critique for each is in `data/review-all-300-questions.md` (search for `[explanation]` tags).

**Plan:**
1. Extract flagged questions + critiques into a batch JSON (~5 min, automated)
2. Re-generate each broken explanation with a constrained prompt that includes the judge's specific critique (~30 min, automated via `scripts/fix_explanations.py`)
3. Human spot-check the ~20 most critical flags (navigation rules, safety, propeller physics) (~30-45 min manual)
4. Apply, re-seed, redeploy (~5 min)

**Alternative:** Remove explanations for the 108 flagged questions entirely — users still see correct/wrong feedback, just no "why" text. A wrong explanation is worse than no explanation.

### BL-001 · Add cron ping to prevent Supabase Free tier pausing

**Phase:** MVP-1 (Supabase setup)
**Context:** Supabase Free plan pauses projects after 7 days of inactivity. A scheduled ping every 3–5 days keeps the project alive at zero cost. **Now critical — real users depend on this.** Three implementation options (pick one):

1. **GitHub Actions cron** — a workflow in `.github/workflows/keep-alive.yml` that runs every 3 days and makes a lightweight Supabase query. Free for public repos.
2. **Vercel Cron** — a cron entry in `vercel.json` calling a `/api/keep-alive` route. Free on Vercel Hobby (one cron job).
3. **External cron service** (cron-job.org) — pings a health-check URL on schedule. No repo changes needed.

### BL-010 · Rotate Google OAuth client secret

**Priority:** Low
**Context:** The Google Client Secret was shared in a Cursor chat session during setup debugging. Should be rotated in Google Cloud Console (add new secret → update Vercel env var → delete old secret).

---

## In Progress

_None._

---

## Done

### BL-020 · Exam mistake review and bookmark during exam

**Completed:** 2026-04-21
**Context:** Two exam mode improvements: (1) After submitting an exam, the result screen shows a "Review N Mistakes" button that displays each wrong/unanswered question with the user's answer (red) and correct answer (green) in the same shuffled order seen during the exam. New `ExamMistakeReview` component. (2) Bookmark button added to `ExamQuestionCard` header so users can flag questions during timed exams. Implements US-6.2 and US-9.8.

### BL-019 · Weakest First question order mode

**Completed:** 2026-04-21
**Context:** Third option for question order in Settings. In review phase (all questions seen), Weakest First fills 100% of the session from unmastered questions (struggling + onTrack), skipping familiar entirely. In coverage phase, behaves like Random. Maximizes learning throughput for users preparing close to exam day. Updates US-9.7.

### BL-018 · Mistakes definition fix — only struggling questions

**Completed:** 2026-04-21
**Context:** `getMistakes()` and the Review page's inline filter returned all questions with `mastery === "learning"`, which included both struggling (last answer wrong, cc=0) and on-track (last answer right, cc>0). This inflated the Mistakes count (125 shown vs 28 actual). Fixed both locations to filter on `mastery === "learning" && consecutiveCorrect === 0`. Updates US-4.1.

### BL-017 · Sequential review resume position

**Completed:** 2026-04-21
**Context:** In sequential mode during the review phase (all questions seen), the selection algorithm always started from the lowest question ID, causing the same questions (e.g., Q.73 for Binnen) to appear first in every session. Added per-topic resume position tracking (`learnResumePositions` in preferences store, synced to Supabase). After each session, saves `maxId + 1` as the next resume position. The `rotateToId` helper rotates sorted arrays so they start from the resume point, with wrap-around when the end is reached. Struggling questions always get priority within the learning quota; familiar questions are shuffled for variety.

### BL-016 · Answer option shuffling

**Completed:** 2026-04-19
**Context:** New "Answer order" toggle in Settings (Fixed/Shuffled). When enabled, answer option positions are randomized in Learn, Review, and Exam modes using a seeded PRNG (`mulberry32` + Fisher-Yates shuffle) for deterministic per-session ordering. The `useShuffledOptions` hook provides bidirectional index mapping (`toOriginalIndex`, `toDisplayIndex`) so correctness checks and exam answer storage work in original-index space. Session seed is `Date.now()` for Learn/Review, `startedAt` for Exam. Explore mode always uses fixed order.

### BL-015 · Back to Home navigation fix

**Completed:** 2026-04-19
**Context:** "Back to Home" buttons in Learn, Review, and Exam session summaries were resetting internal phase state instead of navigating to the root route. Fixed to use `router.push("/")` from `next/navigation`.

### BL-014 · Question order setting — Random vs Sequential

**Completed:** 2026-04-11
**Context:** New setting in Settings page allowing users to switch Learn mode between Random (default) and Sequential question order. Sequential mode presents questions in ascending ticket number starting from the lowest unmastered question, while preserving the smart selection logic (skip familiar, prioritize struggling/unseen). Setting persists to Supabase.

### BL-013 · Home page CTA buttons — add Explore, rename Learn

**Completed:** 2026-04-11
**Context:** Home page now has three action buttons: "Start Explore Session" (outlined), "Start Learn Session" (filled primary), and "Practice Exam" (outlined). Previously only had "Start Study Session" and "Take Practice Exam".

### BL-012 · Explore mode UX fixes — bookmark, images, ExamTimer crash

**Completed:** 2026-04-11
**Context:** Multiple fixes: (1) Top bar bookmark icon in Explore was display-only `div`, now a clickable toggle button with visual feedback. (2) Images in Explore cards constrained to `max-h-28` and centered for compact layout. (3) Fixed `ExamTimer` temporal dead zone crash — when a stale exam was persisted in localStorage and time had expired, `clearInterval(interval)` was called before `interval` was assigned, causing a `ReferenceError` that crashed the app on mobile.

### BL-011 · Explore mode — bilingual side-by-side reading

**Completed:** 2026-04-11
**Context:** New "Explore" tab for reading questions side-by-side in two languages before answering. Full card duplicated on each side (primary language left, secondary right) with correct answer pre-highlighted and keyword highlights visible. Free navigation through all questions per topic, with per-topic resume position persisted to Supabase. Bookmark support and question counter in the header. Bottom nav auto-hides on mobile landscape to maximize reading space. Added between Home and Learn in navigation.

### BL-009 · Fix question selection — onTrack questions never resurfacing

**Completed:** 2026-04-05
**Context:** Questions answered correctly once ("onTrack", consecutiveCorrect=1) were deprioritized to 0% of sessions during Phase 1 (coverage mode). They could never get a second correct answer to become "familiar." Fixed by allocating ~20% of Phase 1 sessions to onTrack questions. Session split is now: 30% struggling + 20% onTrack + 50% unseen.

### BL-008 · Direct Google OAuth flow

**Completed:** 2026-04-05
**Context:** Google OAuth previously went through Supabase as a proxy, showing "Sign in to bicadbjleqvhxoyliiod.supabase.co" on the consent screen. Implemented direct OAuth flow: app redirects to Google → Google redirects to `/api/auth/google/callback` → server exchanges code for ID token → Supabase session created via `signInWithIdToken`. Consent screen now shows "leinen-los.vercel.app." Root cause of initial "invalid_client" error was OAuth consent screen in Testing mode (not published).

### BL-007 · Analytics — user_id tracking and auth events

**Completed:** 2026-04-05
**Context:** Analytics events used anonymous_id from localStorage, making multi-device users appear as separate users. Added `user_id` to event payloads (linked to Supabase auth user), new events (`sign_in`, `sign_up`, `progress_migrated`), and updated admin dashboard with User column.

### BL-006 · todayAnswered timezone and semantic bugs

**Completed:** 2026-04-05
**Context:** Two bugs in daily goal tracking: (1) Supabase query used client's local date string instead of UTC midnight timestamp, causing timezone mismatch. (2) Hydration counted unique questions while runtime incremented total answers, causing counter to drop on reload. Fixed with local-midnight-to-UTC conversion and `Math.max(dbCount, serverCounter)`.

### BL-005 · UI updates for auth awareness

**Completed:** 2026-04-05
**Context:** About page still said "No account needed" and Home page had no logged-in indicator on mobile. Updated About page messaging to reference sign-in and cross-device sync. Added user initial circle to Home page header.

### BL-004 · User authentication and cross-device progress sync

**Completed:** 2026-04-05
**Context:** Implemented Supabase Auth (email+password, magic link, Google OAuth) with cross-device progress sync. Architecture: Zustand stores hydrate from Supabase on login, write-through on every state change. First login migrates localStorage progress to server with user notification. Includes middleware for session refresh and route protection, AuthProvider for hydration orchestration. See `docs/AUTH_SETUP_GUIDE.md` for reusable setup checklist.

### BL-002 · Auto-fix 83 flagged items (highlights, translations, grammar)

**Phase:** Data Pipeline (step 8)
**Completed:** 2026-03-06
**Context:** Of the original 191 flags from `judge_quality.py`, 83 were mechanically fixable: 30 Russian translation errors (wrong nautical terms, gender agreement, grammar), 23 English translation errors (mistranslated maneuvers, vessel types, sailing terms), and 30 highlight precision issues (highlights matching wrong answers, originating from question stems). Applied via `scripts/fix_flagged_items.py`, re-seeded, and redeployed. Remaining 108 explanation logic errors moved to BL-003.
