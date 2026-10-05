# Leinen los! — Project Development Log

> This log captures how the project was designed from zero to implementation-ready in a single Cursor session. It documents the methodology, decision points, and process patterns — intended as input for a reusable project setup playbook.

**Chat reference:** [Leinen los! project setup](1c13f76c-70fc-412f-a9a4-3c2f6df2f109)
**Date:** 2026-03-01
**Duration:** ~3 hours, single session
**Deliverables produced:** PROJECT_PLAN.md, USER_STORIES.md (12 sections, 30+ stories), DESIGN_SYSTEM.md, DATA_MODEL.md

---

## Phase 1: Clarify First — Requirement Discovery

**Method:** Used the Clarify First protocol — one question at a time, no implementation until requirements are clear.

**Process:**
1. User stated the goal: "app to learn exam tickets for boating license"
2. First question: platform? → "responsive web app, desktop + mobile"
3. User preemptively shared the core problem before being asked: trilingual support (DE primary, EN verified, RU needs LLM generation)
4. User shared PDF screenshots showing question structure (multiple choice, correct answers, trigger phrases, some with images)
5. User provided a reference app (Führerschein GOLD) as the experience benchmark

**Key pattern:** The user drove the conversation forward with unprompted context. The Clarify First protocol adapted — instead of rigid question sequences, it became a guided conversation where the protocol ensured nothing was assumed and each requirement was explicitly validated.

**Output:** Initial set of 7 user story groups derived from reference app analysis, validated one by one with the user.

---

## Phase 2: Reference App Analysis

**Method:** Studied the Führerschein 2026 GOLD app (iOS) from App Store description and feature list. Extracted feature patterns and translated them into user stories for the boating license context.

**Key features extracted:**
- Learn by topic / learn all questions
- Instant feedback (correct/wrong)
- Automatic mistake tracking
- Manual bookmark ("memory list")
- Progress statistics per topic
- "Exam traffic light" readiness indicator
- Timed exam simulation matching real exam format
- Question explanations

**Decision:** User stories were modeled on this reference but adapted for trilingual support and the SBF Binnen exam structure. The reference app became the "consideration set" benchmark.

---

## Phase 3: Iterative User Story Refinement

**Process:** Presented initial user stories, user refined in a single pass:
- Added US-1.5 (default language pair selection)
- Clarified US-1.3 (blue highlights only in learning mode, not exam mode)
- Extended US-3.2 (pre-written wrong-answer explanations, not real-time LLM)
- Flagged multi-user features (auth, per-user progress) as important but needed help scoping MVP vs. v2

**Key pattern:** User provided feedback as a stream-of-consciousness voice input (STT). Required filtering STT artifacts ("Спасибо за просмотр!", repeated phrases) while preserving genuine decisions.

---

## Phase 4: Naming & Identity

**Method:** Asked the user to choose a name before structuring documents. Generated nautical-themed candidates.

**Decision:** User chose "Leinen los!" ("Cast off!") — aspirational, memorable, German with universal appeal. Folder renamed, all documents updated.

**Pattern:** Naming early creates emotional ownership and a consistent identity across all docs.

---

## Phase 5: Tech Stack Decision

**Method:** Checked what the user's other project (Opera Concierge) uses to align on familiar tooling.

**Initial decision:** React + Vite + TypeScript, shadcn/ui + Tailwind, Supabase (matching Opera Concierge).

**Later revised (Phase 9):** Switched from Vite to Next.js 15 + App Router during CTO holistic review. Rationale: better SEO for a public-facing open-source project, SSG for static question content, App Router for auth middleware, and higher learning value for full-stack development.

**Pattern:** Start with what the user knows, upgrade when a review reveals better alignment with project goals.

---

## Phase 6: Data Source Independence

**Trigger:** User mentioned the PDF with verified English translations came from another person, raising dependency and permission concerns.

**Analysis:** Evaluated the effort to go fully independent: use ELWIS (official government catalog, public domain) as primary source, generate English translations via LLM, use the PDF only for optional validation.

**Decision:** ELWIS as primary source. PDF for validation only (with permission). This removed the third-party dependency and enabled the open-source aspiration.

**Cost optimization:** Initially estimated ~7h human review for LLM-generated content. Introduced an LLM-as-judge step (Claude Sonnet 4.6 evaluating GPT-4o output) to reduce human review to ~45 min for flagged items only. Trade: ~$3.18 API cost saves ~6h human time.

**Pattern:** When a dependency creates strategic risk (licensing, permission), invest in independence early. Use LLM-as-judge to automate quality gates.

---

## Phase 7: Document Architecture

**Trigger:** Single PROJECT_PLAN.md grew too large (~300 lines covering everything).

**Decision:** Split into 4 documents:
- `PROJECT_PLAN.md` — north star, tech stack, phased delivery, key decisions
- `docs/USER_STORIES.md` — all user stories with MVP/v2 labels
- `docs/DESIGN_SYSTEM.md` — color palette, typography, layout, component specs
- `docs/DATA_MODEL.md` — database schema, data pipeline, LLM cost estimates

**Pattern:** Split when a document exceeds ~150 lines or mixes concerns (user needs vs. technical schema vs. visual design). Link documents from the main plan. Each document should be self-contained enough that a specialist (designer, data engineer) could work from it alone.

---

## Phase 8: Open-Source Architecture Decision

**Trigger:** User declared intent to make the project open-source and non-commercial.

**Tension identified:** Open-source favors static site (zero backend = easy self-hosting) but the user's learning goal requires a full-stack deployment with Supabase.

**Resolution:** "Supabase from day one with static fallback" — the data layer tries Supabase first; if not configured, falls back to bundled JSON + localStorage. Hosted app uses Supabase. Self-hosters fork, build, deploy — no backend required.

**Licensing:** AGPL-3.0 for code, CC BY-NC-SA 4.0 for content.

**Pattern:** When two goals conflict (learning full-stack vs. easy self-hosting), design a dual-mode architecture rather than choosing one. A few lines in the data layer handle the branching.

---

## Phase 9: CTO Holistic Review #1

**Method:** Activated the Augmented Technology Leader skill. Performed a systematic architectural review using the Four-Layer Model (data, application, presentation, infrastructure) and Production Readiness Checklist.

**Findings and actions:**
1. Tech stack: Vite → Next.js 15 (accepted, implemented)
2. Data model gaps: missing timestamps, composite PKs, stale column types (fixed)
3. Security (RLS, email verification): agreed, deferred to v2
4. Production readiness (Sentry, error boundaries, CI/CD): agreed, deferred to v2
5. Pipeline reliability: added orchestrator (`run-pipeline.py`), idempotency, ELWIS HTML caching
6. Testing strategy: deferred to v2

**Pattern:** A holistic review by a "specialist persona" catches gaps that incremental building misses. Run it after the initial design is complete but before implementation starts. Accept findings but scope them — not everything is MVP.

---

## Phase 10: CTO Holistic Review #2

**Method:** Second pass review after all fixes from Review #1 were applied.

**Findings and actions:**
1. Project structure still had Vite artifacts → fixed to Next.js App Router
2. Explanation schema: flat `explanation_de/en/ru` columns → per-wrong-option JSONB (more useful for the learner)
3. Missing Prüfungsbögen (exam papers) configuration → added exam-papers.json with 15 official papers
4. Bookmarks + Mistakes as separate pages → consolidated into Review tab with sub-tabs
5. Stale v1/v2 references → cleaned up
6. No Server vs Client Component guidance → added strategy table

**Pattern:** Second review catches what the first review's fixes introduced. Always do a verification pass after major changes.

---

## Phase 11: Scope Expansion — Motor + Segel

**Trigger:** User noticed US-6.1 only covered Motor exam, but they need Motor + Segel.

**Method:** Researched official ELWIS catalog and third-party exam sites to verify the exam structure.

**Finding:** All 300 questions are from one unified catalog (72 Basis + 181 Binnen + 47 Segel). Motor+Segel exam uses 37 questions (7+23+7) with a triple split threshold: ≥5/7 Basis AND ≥18/23 Binnen AND ≥5/7 Segel.

**Impact:** Updated US-6.1, exam_attempts table (added segel_correct), exam-papers.json (added segel_questions array), readiness indicator (per-category traffic lights).

**Pattern:** Always verify scope against the official source. A seemingly small "also Segel" changes the exam simulation, pass/fail logic, readiness indicator, and data model.

---

## Phase 12: Product Leader Review

**Method:** Activated the Augmented Product Leader skill. Applied the Three-Act Model (Demand → Evidence → Craft) with specialists: Jobs & Demand, Design & Craft, Value Creation.

**Key analysis:**
- **Job formula:** Clear — "pass SBF Binnen as a non-German speaker"
- **Consideration set:** All existing tools are German-only. Zero competition for multilingual SBF prep.
- **Primary value mechanic:** #12 (Serve Underserved Jobs) — nobody else does this
- **Secondary:** #2 (Do the Job Better) — per-wrong-option explanations + highlights

**10 findings, user decisions:**
1. First-time UX (empty state) → v2
2. Stale review estimates → fixed immediately
3. Celebration moments → added as MVP user story (US-5.3)
4. Stats page orphaned → merged into Home dashboard
5. Settings tab scope → iterate later
6. Smart scheduling → v2 user story
7. Duplicate in Review sub-tabs → clarified in docs
8. Exam start screen → noted
9. Public landing page + SEO → v2
10. Diagnostic exam → v2

**Pattern:** Product review complements the CTO review — different lens, different findings. CTO catches architectural gaps; Product Leader catches UX gaps, missing emotional design, and distribution blind spots.

---

## Phase 13: Learning Engagement Design

**Method:** Combined learning science (spaced repetition, active recall, interleaving, desirable difficulty) with Atomic Habits (cue, craving, response, reward) to generate engagement features.

**Proposed 7 ideas, user selected 6:**

| Idea | Decision | Rationale |
|------|----------|-----------|
| Daily goal + streak | MVP | Duolingo-proven retention mechanic |
| Question of the Day | Cut | Clutters Home screen |
| Mastery levels (3 tiers) | MVP | Replaces binary right/wrong with Unseen → Learning → Familiar |
| Interleaved practice | Cut | User doesn't need it |
| Study session wrapper | MVP | Packaged 10-question sessions with summary card |
| Exam countdown | MVP | Connects daily practice to real deadline |
| Hard Mode | v2 | For advanced learners on second+ pass |

**Key design decision:** Mastery levels integrate with the Mistakes tab — questions in "Learning" state appear in Mistakes; reaching "Familiar" auto-clears them. Clean lifecycle with regression (Familiar → Learning on wrong answer).

**Pattern:** Don't just list features — ground each one in a specific learning principle AND a specific habit law. This forces you to justify why each feature exists and makes it easy to cut features that don't serve both.

---

## Process Patterns Summary (for Playbook)

| Pattern | When to Apply |
|---------|---------------|
| **Clarify First** | Start of any non-trivial project. One question at a time until requirements are clear. |
| **Reference app analysis** | When the user has a "I want it like X" reference. Extract features, translate to user stories, validate. |
| **Name early** | Before structuring documents. Creates identity and emotional ownership. |
| **Start familiar, upgrade when reviewed** | Initial tech stack matches what the user knows. Upgrade during holistic review if project goals demand it. |
| **Split documents at ~150 lines** | When a single doc mixes concerns. Each doc should serve one specialist role. |
| **Dual-mode architecture** | When two goals conflict. Design a branching point rather than choosing one goal. |
| **LLM-as-judge** | When human review is the bottleneck. Trade API cost for human hours. |
| **CTO review → Product review** | Run both, sequentially. CTO catches architecture gaps, Product catches UX and value gaps. |
| **Verify scope against official source** | When requirements reference an external standard (exam, regulation). Small scope changes cascade. |
| **Ground features in principles** | Learning science + habit design for education apps. Each feature must justify existence via both. |
| **Second review after fixes** | Major changes from Review #1 can introduce new inconsistencies. Always verify. |

---

## Artifacts Produced

| Artifact | Lines | Purpose |
|----------|-------|---------|
| `PROJECT_PLAN.md` | ~216 | North star: tech stack, project structure, phased delivery, key decisions |
| `docs/USER_STORIES.md` | ~126 | 12 sections, 30+ user stories, MVP vs v2 labeled |
| `docs/DESIGN_SYSTEM.md` | ~232 | Color palette, typography, layout patterns, component specs, celebrations |
| `docs/DATA_MODEL.md` | ~396 | Database schema, data pipeline (10 steps), LLM cost estimates (~$6.57) |
| `docs/DEVELOPMENT_LOG.md` | This file | Process documentation for playbook extraction |
