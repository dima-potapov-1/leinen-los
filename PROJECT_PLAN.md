# Leinen los! — Project Plan

**"Cast off!"** — a responsive web app for studying the Sportbootführerschein Binnen Motor + Segel (German inland waterways boating license, motor and sail) exam. Trilingual (German, English, Russian), mobile-first, inspired by the Führerschein GOLD app.

**Open-source, non-commercial.** Two deliverables from one codebase:

1. **Public GitHub repo** — open-source code under a non-commercial license. Anyone can fork, self-host, and study for free. Works without a backend (bundled JSON + localStorage fallback).
2. **Hosted app** — a fully functional free instance (e.g., `leinenlos.app`) with registration, server-side progress, cross-device sync. Powered by Supabase. Free to use, no charges.

All question data derived from the official ELWIS public domain catalog.

## Documents

| Document | Contents |
|----------|----------|
| [USER_STORIES.md](docs/USER_STORIES.md) | All user stories (US-1.x through US-15.x), MVP vs v2 labeled |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Color palette, typography, layout, component specs |
| [DATA_MODEL.md](docs/DATA_MODEL.md) | Database schema, data pipeline, LLM cost estimates |
| [BACKLOG.md](docs/BACKLOG.md) | Actionable tasks and decisions that arise during development |

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 15 + React 19 + TypeScript | SSG for static content, RSC, SEO for discoverability |
| UI | shadcn/ui + Tailwind CSS | Same as Opera Concierge; polished components |
| Routing | Next.js App Router | File-based routing, middleware for auth protection |
| State/Data | TanStack React Query + Zustand | Server cache + lightweight client state |
| Database | Supabase (PostgreSQL) | Auth, progress, settings, row-level security |
| Data fallback | Bundled JSON (`src/data/`) | Self-hosters can run without Supabase |
| Image Storage | Supabase Storage + `/public/images/` fallback | CDN-served on hosted app; static for self-host |
| Auth | Supabase Auth | Email/password, per-user data isolation |
| Hosting (app) | Vercel (frontend) + Supabase (backend) | Hosted instance at `leinenlos.app` |
| Hosting (self-host) | Any static host | Fork → build → deploy, no backend required |

---

## Project Structure

```
Leinen los!/
├── app/                           # Next.js App Router — file-based routing
│   ├── layout.tsx                 # Root layout: nav shell, auth provider, fonts
│   ├── page.tsx                   # Home / dashboard + progress stats + readiness
│   ├── login/page.tsx             # Registration + login
│   ├── explore/
│   │   └── page.tsx               # Explore mode: bilingual side-by-side reading
│   ├── learn/
│   │   └── page.tsx               # Learning mode: all questions or by topic
│   ├── review/
│   │   └── page.tsx               # Review tab: mistakes + bookmarks (sub-tabs)
│   ├── exam/
│   │   └── page.tsx               # Exam: selection, active session, result + mistake review
│   ├── settings/page.tsx          # Language pair, session size, question order, answer shuffle, exam date
│   └── admin/page.tsx             # (v2) User metrics
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn/ui components
│   │   ├── ExploreCard.tsx        # Bilingual side-by-side question card (Client)
│   │   ├── QuestionCard.tsx       # Core: question + options + highlights (Client)
│   │   ├── ExamQuestionCard.tsx   # Exam mode question card with bookmark (Client)
│   │   ├── ExamMistakeReview.tsx  # Post-exam mistake review with answer comparison (Client)
│   │   ├── ExamQuestionGrid.tsx   # Grid navigation for exam questions (Client)
│   │   ├── LanguageToggle.tsx     # Quick-switch DE/EN/RU (Client)
│   │   ├── OptionButton.tsx       # Answer option with highlight support (Client)
│   │   ├── SessionSummary.tsx     # Post-session results card (Client)
│   │   ├── ExplanationPanel.tsx   # Post-wrong-answer explanation (Client)
│   │   ├── ImageViewer.tsx        # Zoomable question image (Client)
│   │   └── ExamTimer.tsx          # Countdown timer for exam mode (Client)
│   ├── hooks/
│   │   ├── usePreferencesStore.ts # Zustand: language, session size, order, shuffle, resume positions
│   │   ├── useProgressStore.ts   # Zustand: per-question mastery, bookmarks, celebrations
│   │   ├── useExamStore.ts       # Zustand (persisted): exam session state machine
│   │   ├── useShuffledOptions.ts # Hook: deterministic answer option shuffling with index mapping
│   │   └── useAuth.ts            # Supabase auth state + sign-in/sign-out
│   ├── lib/
│   │   ├── supabase-server.ts     # Supabase client for Server Components
│   │   ├── supabase-client.ts     # Supabase client for Client Components
│   │   ├── data-layer.ts          # Dual data layer: Supabase → JSON fallback
│   │   ├── question-selection.ts   # Smart question selection: coverage/review phases, random/sequential/weakest-first
│   │   ├── shuffle.ts             # Seeded PRNG (mulberry32) + Fisher-Yates for deterministic answer shuffling
│   │   ├── highlights.ts          # Render highlighted text from phrase arrays
│   │   ├── exam.ts                # Exam papers, scoring, pass/fail logic
│   │   └── analytics.ts           # Anonymous event tracking to Supabase
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── data/
│       ├── questions.json         # Bundled fallback (committed) — final 300 questions
│       └── exam-papers.json       # 15 Prüfungsbögen: question ID sets per paper
├── public/
│   └── images/                    # Question images (signs, diagrams) — static fallback
├── scripts/                       # One-time data preparation (NOT part of the app)
│   ├── run-pipeline.py            # Orchestrator: --from/--force/--cost-only
│   ├── scrape-elwis.py            # Scrape ELWIS official catalog → DE JSON + images
│   ├── translate-english.py       # GPT-4o: DE → EN translation
│   ├── generate-highlights.py     # GPT-4o: analyze options → trigger phrases
│   ├── translate-russian.py       # GPT-4o: DE+EN → RU triangulation
│   ├── generate-explanations.py   # GPT-4o: per-wrong-option explanations × 3 langs
│   ├── judge-quality.py           # Claude Sonnet 4.6: judge 1,800 items → flags
│   ├── validate-against-pdf.py    # (optional) Cross-check vs. PDF
│   ├── upload-images.py           # Upload images to Supabase Storage
│   ├── seed-database.py           # Load final JSON into Supabase
│   └── cost-estimator.py          # Preview LLM API costs
├── data/                          # Pipeline working files (not committed)
│   ├── questions-de.json          # Extracted German questions
│   ├── questions-en.json          # LLM English translations
│   ├── questions-ru.json          # LLM Russian translations
│   ├── explanations.json          # LLM per-wrong-option explanations (all 3 langs)
│   ├── judge-report.json          # Claude Sonnet quality flags
│   ├── nautical-glossary.json     # DE/EN/RU nautical terms reference
│   ├── elwis-cache/               # Cached ELWIS HTML (scraper fallback)
│   └── questions-final.json       # Merged, validated, ready to bundle
├── supabase/
│   └── migrations/                # SQL migrations
├── middleware.ts                   # Next.js middleware: auth route protection
├── docs/
│   ├── USER_STORIES.md
│   ├── DESIGN_SYSTEM.md
│   └── DATA_MODEL.md
├── .env.example                   # Placeholder env vars (never commit .env)
├── .gitignore
├── LICENSE                        # AGPL-3.0 (code) + CC BY-NC-SA 4.0 (content)
├── README.md                      # Setup, deploy, contribute instructions
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── PROJECT_PLAN.md
```

---

## Phased Delivery

### MVP — Full App (Supabase from day one)

Supabase backend from the start: database schema, storage, RLS policies. The hosted app at `leinenlos.app` is functional from day one with localStorage-based progress. Auth, server-side progress, and cross-device sync move to v2. Self-hosters get a bundled JSON fallback (no backend required).

| # | Feature | User Stories |
|---|---------|-------------|
| 0 | Data pipeline: scrape ELWIS, generate (GPT-4o), judge (Claude Sonnet 4.6), human review flags, seed | US-2.1–2.5 |
| 1 | **Supabase setup**: database schema, storage, RLS policies | — |
| 2 | Question card with image support | US-1.1, US-1.4 |
| 3 | Language toggle + per-user primary/secondary language pair | US-1.2, US-1.5 |
| 4 | Highlights (blue triggers in learning mode only) | US-1.3 |
| 5 | Mastery levels per question: Unseen → Learning → Familiar | US-9.1 |
| 6 | Study sessions: packaged N-question blocks with session summary card | US-9.3 |
| 7 | Learning mode: practice by category (All / Basis / Binnen / Segel / Mistakes / Bookmarks) | US-3.1 |
| 8 | Mistake explanations (per-wrong-option) | US-3.2 |
| 9 | Mistakes list (auto-clears when question reaches Familiar) | US-4.1, US-4.3 |
| 10 | Bookmarks + practice | US-4.2, US-4.3 |
| 11 | Home dashboard: mastery bar, readiness traffic lights × 3, daily goal, streak, exam countdown | US-5.1, US-5.2, US-9.2, US-9.4, US-9.5 |
| 12 | Celebration moments (category complete, green light, exam passed, streak) | US-5.3 |
| 13 | Settings: language pair, session size (5–30), question order (random/sequential/weakest-first), answer shuffle, exam date | US-1.5, US-9.5, US-9.6, US-9.7 |
| 14 | Explore mode: bilingual side-by-side reading with per-topic resume | US-14.1–14.4 |
| 15 | Exam simulation (Motor+Segel: 37 questions, 60 min, triple threshold) with post-exam mistake review + bookmark during exam | US-6.1, US-6.2, US-9.8 |
| 16 | Responsive design (mobile + desktop) | US-7.1 |
| 17 | Static fallback: bundled JSON + localStorage for self-hosters | — |

### v2 — Production Hardening, Growth & Analytics

| # | Feature | User Stories |
|---|---------|-------------|
| | **Multi-User & Auth** *(shipped)* | |
| 18 | ~~Authentication: registration, login, protected routes~~ | ~~US-8.1, US-8.3~~ |
| 19 | ~~Cross-device sync~~ | ~~US-8.2~~ |
| | **User Experience** | |
| 20 | Onboarding: first-time guidance + diagnostic exam | US-10.1, US-10.2 |
| 21 | ~~Smart question scheduling (wrong answers resurface sooner)~~ *(shipped)* | ~~US-3.3~~ |
| 22 | Public landing page + SEO for organic discovery | US-11.1, US-11.2 |
| 23 | Hard Mode toggle (no labels, timer, German-only) | — |
| | **Security & Compliance** | |
| 24 | RLS policies for all tables (questions: public read; user data: owner-only) | — |
| 25 | Email verification (prevent spam accounts) | — |
| 26 | GDPR compliance: privacy policy, right-to-deletion, cookie notice | — |
| | **Observability & Reliability** | |
| 27 | Error tracking (Sentry, free tier) | — |
| 28 | Error boundaries at route level | — |
| 29 | CI/CD pipeline: GitHub Actions → lint → build → deploy to Vercel | — |
| 30 | Loading states: skeleton screens for mobile on slow connections | — |
| | **Testing** | |
| 31 | Exam logic tests: scoring, timer, pass/fail state machine | — |
| 32 | Highlight rendering tests: `QuestionCard` states, language toggle | — |
| 33 | Pipeline tests: ELWIS scraper (mock HTML), prompt format validation | — |
| | **Admin & Analytics** | |
| 34 | Admin stats dashboard: active users, question difficulty heatmap, avg readiness | US-12.1 |
| 35 | Hardest questions report: most frequently wrong answers across all users | US-12.2 |

---

## Server vs Client Component Strategy

Next.js App Router defaults to Server Components. The split for this app:

| Server Components (default) | Client Components (`"use client"`) |
|----|----|
| `app/layout.tsx` — nav shell, auth provider | `QuestionCard` — interactive answer selection |
| `app/page.tsx` — dashboard + stats + readiness | `LanguageToggle` — instant language switching |
| `ReadinessIndicator` — computed from DB | `OptionButton` — tap/click handler, highlight render |
| Route pages that fetch data | `ExamTimer` — real-time countdown |
| | `ExplanationPanel` — post-answer animation |
| | `ImageViewer` — pinch-to-zoom |
| | `TopicFilter` — client-side filtering |
| | `ProgressBar` — animated transitions |

**Rule of thumb:** If the component handles user interaction, local state, or browser APIs → Client. If it only reads data and renders → Server.

`supabase-server.ts` uses `createServerClient` (cookie-based auth for Server Components). `supabase-client.ts` uses `createBrowserClient` (for Client Components and hooks).

---

## Key Design Decisions

1. **Open-source, non-commercial** — Public repo under a non-commercial license (code: AGPL-3.0 or similar; content/data: CC BY-NC-SA 4.0). Anyone can fork, deploy, and study for free.
2. **Supabase from day one** — Full backend (auth, database, storage) in MVP. No deferred learning. The hosted app is fully functional from launch. Self-hosters get a static fallback (bundled JSON + localStorage) — a few lines in the data layer detect whether Supabase is configured.
3. **No real-time LLM** — All AI content pre-computed and stored. Pipeline uses OpenRouter (GPT-4o for generation, Claude Sonnet 4.6 for judging). Total pipeline cost: ~$6.57 + 45 min human review.
4. **ELWIS as primary source** — German questions scraped from the official federal catalog (public domain). No third-party dependencies. English, Russian translations and highlights all LLM-generated. PDF used only as optional validation reference.
5. **Highlights as structured data** — Trigger phrases stored as string arrays, rendered as `<mark>` tags. Clean, language-switchable.
6. **Dual data layer** — App tries Supabase first; if not configured, falls back to bundled JSON + localStorage. Hosted app uses Supabase; self-hosted forks work without it.
7. **Official Prüfungsbögen** — Exam simulation uses the 15 real Motor+Segel test papers (37 questions each), not random selection. Motor-only and Segel-only modes available as secondary options.
8. **Single table, column-per-language** — 300 rows × 3 fixed languages = no need for normalized translations table.
9. **Secrets never in repo** — `.env.example` with placeholders, `.gitignore` for `.env`. Pipeline scripts (ELWIS scraper, LLM calls) require API keys; the app itself does not.
