# Leinen los! — User Stories

> **MVP** = shipped in v1. **v2** = next iteration.

---

## 1. Question Database & Multilingual Core (MVP)

**US-1.1** As a learner, I want every question stored in German, English, and Russian so I can study in any language.

**US-1.2** As a learner, I want to see questions in my **primary language** by default, with a quick-toggle button to instantly switch to my **secondary language** — without leaving the question screen. The primary/secondary pair is configured in Settings (see US-1.5).

**US-1.3** As a learner, I want the key trigger phrases highlighted in **blue** in learning mode, so I know what to memorize. In exam mode, no highlights — just plain options.

**US-1.4** As a learner, I want questions that include images (navigation signs, diagrams) to display the **image at the top** of the question card with the question text below it. Images should be zoomable on mobile.

**US-1.5** As a learner, I want to configure my language pair in Settings by choosing a **primary language** (displayed by default) and a **secondary language** (accessible via quick toggle). Any combination of German, English, and Russian is valid — German→Russian, German→English, Russian→German, English→German, etc. — so I can study in whichever direction suits me.

---

## 2. Data Preparation Pipeline — offline/build-time (MVP)

**US-2.1** As a builder, I need to scrape all 300 German questions from the official ELWIS catalog (public domain) as the primary data source — no third-party PDF dependency. This includes question text, 4 options (answer "a" is always correct), and images.

**US-2.2** As a builder, I need LLM-generated English translations of all questions and options, validated by the LLM-as-judge pipeline (Claude Sonnet 4.6). Human review only for flagged items (~45 min total across all pipeline steps).

**US-2.3** As a builder, I need LLM-generated trigger phrase highlights — analyzing all 4 options per question to identify the key differentiating words, validated by the LLM-as-judge pipeline.

**US-2.4** As a builder, I need an LLM translation step that triangulates from German + English into a high-quality Russian translation, preserving trigger phrases.

**US-2.5** *(Optional)* As a builder, I want to cross-check my LLM-generated English and highlights against the third-party PDF (with owner permission) to catch errors I might miss in manual review.

---

## 3. Learning Mode (MVP)

**US-3.1** As a learner, I want to practice all questions sequentially or by category (Basis / Binnen / Segel), answering each one and getting instant feedback (correct/wrong + showing the right answer with highlights). Since Segel has its own pass threshold on the exam, I need to be able to drill it separately.

**US-3.2** As a learner, when I answer incorrectly, I want to see a pre-written explanation that tells me why my answer was wrong and why the correct answer is right — helping me understand, not just memorize.

**US-3.3** ~~*(v2)*~~ **Shipped** — As a learner, I want smart question scheduling — questions I got wrong resurface sooner, questions I consistently get right appear less often — so my study time is spent where it matters most.

> *Implementation: Two-phase selection in `src/lib/question-selection.ts`. Coverage phase (~90% unseen, ~10% struggling) until all questions seen; then review phase (70% learning, 30% familiar). In sequential mode, a per-topic resume position tracks where the user left off so sessions advance through the full question set. Struggling questions (consecutiveCorrect=0) always get priority within the learning quota. Shipped April 2026.*

---

## 4. Targeted Review — Wrong Answers & Bookmarks (MVP)

**US-4.1** As a learner, I want the Review tab to clearly organize questions by their three mastery categories (defined in US-9.1):

- **Unseen** — never attempted
- **Learning** — attempted but not yet mastered (fewer than 2 consecutive correct answers)
- **Familiar** — answered correctly at least 2 times in a row

These three states are MECE: every question is in exactly one category at any time. Only **struggling** questions (Learning with 0 consecutive correct — i.e., last answer was wrong) appear in the Mistakes sub-tab. When a question gets one correct answer, it leaves Mistakes (becomes "on track"). When it reaches "Familiar" (2 consecutive correct), it leaves Learning entirely. A wrong answer on a Familiar question resets it to Learning (struggling) and it reappears in Mistakes.

**US-4.2** As a learner, I want to manually bookmark difficult questions into a "Bookmarks" sub-tab, independent of whether I answered them correctly or not.

**US-4.3** As a learner, I want a unified "Review" tab that combines Mistakes and Bookmarks as sub-tabs, so I have one place for all the questions I need to revisit. A question can appear in both sub-tabs (e.g., wrong AND bookmarked). I can **practice questions directly from the Review tab** — when I train on Mistakes and answer a question correctly, it reaches "Familiar" and automatically leaves the Mistakes list. Questions I get wrong stay in "Learning" and remain in Mistakes — so the Review tab is a working list that shrinks as I improve.

---

## 5. Progress Tracking & Readiness (MVP)

**US-5.1** As a learner, I want the Home page to serve as my dashboard: how many questions I've answered, how many correct, percentage by category (Basis / Binnen / Segel), and my readiness indicators — all in one place.

**US-5.2** As a learner, I want a "readiness indicator" (traffic light per category: Basis / Binnen / Segel) that tells me when I'm consistently scoring high enough to pass each section of the real exam. Since the exam has independent pass thresholds per category, I need to see where I'm weak.

**US-5.3** As a learner, I want celebration moments at key milestones — completing all questions in a category, a readiness light turning green for the first time, passing a mock exam — so I feel my progress and stay motivated.

---

## 6. Exam Simulation (MVP)

**US-6.1** As a learner, I want an exam simulation mode that mimics the real SBF Binnen (Motor + Segel) exam: one of the 15 official Prüfungsbögen is drawn, giving me 37 questions (7 Basis + 23 Binnen + 7 Segel) with a 60-minute time limit. Pass requires ≥5/7 Basis AND ≥18/23 Binnen AND ≥5/7 Segel — matching the real triple split threshold. No highlights in this mode.

**US-6.2** **Shipped** — As a learner, I want to review my exam simulation answers afterward, seeing which ones I got wrong and the correct answers with explanations.

> *Implementation: After submitting an exam, the result screen shows a "Review N Mistakes" button. Tapping it shows each wrong/unanswered question with the user's answer highlighted red and the correct answer highlighted green, in the same shuffled order seen during the exam. Bookmarking is available from the review. Shipped April 2026.*

---

## 7. Responsive Design (MVP)

**US-7.1** As a learner, I want the app to work smoothly on both desktop browser and mobile browser, with touch-friendly controls and readable text at all screen sizes.

---

## 8. Multi-User (v2)

**US-8.1** As the app owner, I want users to authenticate (email/password) so each person has their own progress, bookmarks, and settings.

**US-8.2** As a learner, I want my progress to sync across devices — I can study on my phone and continue on desktop. On first login from any device, local progress is merged with server data (keeping the best result per question), and I'm notified about what was synced.

**US-8.3** *(Revised)* As the app owner, I want authentication to be **optional** — the app is fully functional without an account, but signing in enables cross-device sync. This keeps the barrier to entry zero while rewarding registration with sync.

---

## 9. Learning Engagement (MVP)

**US-9.1** As a learner, I want each question to have a mastery level — Unseen (never attempted), Learning (attempted but not yet answered correctly twice in a row), or Familiar (2 consecutive correct answers). These three states are MECE — every question is in exactly one category at any time. A wrong answer on a Familiar question resets it to Learning.

**US-9.2** As a learner, I want the Home dashboard to show my mastery breakdown: "X Familiar / Y Learning / Z Unseen" with a stacked progress bar, so I can see at a glance how much of the catalog I've internalized.

**US-9.3** As a learner, I want practice organized as study sessions of N questions (default 10, configurable in Settings), with a summary card at the end showing: correct count, questions moved to Familiar, and weakest category — so each practice block has a clear start, end, and reward.

**US-9.4** As a learner, I want a daily goal (tied to session size) and a streak counter on the Home dashboard — "Day 5" — that increments when I complete my daily goal and resets if I miss a day, so I'm motivated to practice consistently.

**US-9.5** As a learner, I want to set my exam date in Settings and see a countdown on the Home dashboard: "23 days until your exam — X questions left to reach Familiar" — so every practice session connects to the real deadline.

**US-9.6** As a learner, I want to configure my study session size (5–30 questions) in Settings, so I can adjust the practice intensity to my available time.

**US-9.7** As a learner, I want to choose between three question order modes in Settings:

- **Random** — mixed from all mastery levels (70% learning, 30% familiar in review phase).
- **Sequential** — progresses through questions by ascending ID, resuming where I left off. Struggling questions always get priority.
- **Weakest First** — only unmastered questions (unseen + struggling + onTrack), skipping familiar entirely. Maximizes learning throughput by spending zero time on already-mastered material.

> *Answer shuffling is a separate toggle (Settings → Answer order → Fixed/Shuffled) that randomizes answer option positions in Learn, Review, and Exam modes using a seeded PRNG for deterministic per-session ordering. Shipped April 2026.*

**US-9.8** **Shipped** — As a learner, I want to bookmark questions during an exam session, so I can flag difficult questions for later review without losing focus during the timed exam.

> *Implementation: Bookmark button added to ExamQuestionCard header. Uses the existing `toggleBookmark` from the progress store. Shipped April 2026.*

---

## 10. Onboarding & First-Time Experience (v2)

**US-10.1** *(included in auth iteration)* As a first-time user who just signed up, I want a welcome message after registration that nudges me toward my first learning session — e.g., "Welcome! Start with Basis questions to build your foundation" — so I'm not staring at an empty dashboard.

**US-10.2** *(v2 — deferred)* As a first-time user, I want the option to take a diagnostic exam immediately after registration, so I can see which categories need the most work before I start studying.

---

## 11. Public Landing Page & SEO (v2)

**US-11.1** As a potential user, I want a public landing page (before auth) that explains what the app does, shows sample questions, and lets me register — so I can discover the app through search engines when looking for "SBF Binnen English" or "Sportbootführerschein Russian."

**US-11.2** As the app owner, I want the landing page optimized for organic search (SSG, structured content, multilingual meta tags) to attract non-German speakers preparing for the SBF Binnen exam — the primary distribution channel for a free niche tool.

---

## 12. Admin & Analytics (v2)

**US-12.1** As the app owner, I want an admin stats page showing high-level metrics: active users, question difficulty heatmap, average readiness scores.

**US-12.2** As the app owner, I want a report of the hardest questions — most frequently answered wrong across all users.

---

## 13. About Page (MVP)

**US-13.1** As a potential user visiting the app for the first time, I want an About page that immediately tells me whether this app solves my problem — studying for SBF Binnen in a language I understand — so I can decide to start without reading documentation or guessing what the app does.

---

## 14. Explore Mode — Bilingual Side-by-Side Reading (MVP)

**US-14.1** As a learner, I want an Explore mode where I can read each question side-by-side in my primary language (left) and secondary language (right), with the correct answer pre-highlighted and key trigger phrases visible — so I can study the material bilingually before I start answering.

**US-14.2** As a learner, I want to select a category (All / Basis / Binnen / Segel) in Explore and navigate freely through all questions in that category one at a time, with my position saved per-topic — so I can resume where I left off.

**US-14.3** As a learner, I want to bookmark questions while exploring — both from the card header and from the top bar bookmark button — and see the bookmark count at the top of the screen, so I can flag questions I want to revisit later in Review mode.

**US-14.4** As a learner, I want Explore to work well in mobile landscape orientation, with the bottom navigation hidden to maximize reading space for the side-by-side layout.

---

## 15. Anonymous Analytics & Admin Dashboard (MVP)

**US-15.1** As the app owner, I want anonymous usage events (page views, learning sessions, review sessions, exam sessions, explore sessions, settings changes) logged to Supabase so I can understand how the app is being used.

**US-15.2** As the app owner, I want a password-protected admin dashboard showing high-level engagement totals and a per-user activity breakdown, so I can monitor usage without accessing the database directly.
