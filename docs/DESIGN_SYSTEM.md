# Leinen los! — Design System

## Design Philosophy

Clean and minimal as the foundation — white space, clear typography, content-first. Nautical accents (color palette, subtle motifs) set the mood without competing with the questions.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--navy` | `#1B3A4B` | Primary text, headers, sidebar/tab bar |
| `--ocean` | `#2E86AB` | Primary actions, links, active states |
| `--sky` | `#E8F4F8` | Card backgrounds, subtle section fills |
| `--white` | `#FFFFFF` | Page background |
| `--sand` | `#F5F1EB` | Secondary background, muted areas |
| `--correct` | `#22C55E` | Correct answer highlight (green) |
| `--correct-bg` | `#F0FDF4` | Correct answer row background |
| `--wrong` | `#EF4444` | Wrong answer indicator |
| `--wrong-bg` | `#FEF2F2` | Wrong answer row background |
| `--trigger` | `#2E86AB` | Blue trigger phrase highlight (matches `--ocean`) |
| `--trigger-bg` | `#E8F4F8` | Blue highlight background (matches `--sky`) |
| `--learning` | `#F97316` | Learning mastery state (orange) |
| `--muted` | `#94A3B8` | Secondary text, disabled states, Unseen mastery |

---

## Typography

- **Font**: Inter (clean, excellent multilingual support including Cyrillic)
- **Question text**: 18px / semi-bold
- **Option text**: 16px / regular
- **Explanations**: 14px / regular, muted color
- **Navigation**: 12px / medium (tab labels)

---

## Layout Pattern

### Mobile (< 768px)

- Bottom tab bar: 5 tabs — Home, Learn, Review, Exam, Settings
- **Review tab** has two sub-tabs: Mistakes | Bookmarks (pill toggle at top of page)
- One question per screen, full viewport card
- Language toggle: floating pill in top-right corner of the question card
- Swipe or button to advance between questions
- Images: tap to zoom (full-screen overlay)

### Desktop (>= 768px)

- Left sidebar navigation (collapsible)
- Question card centered, max-width 720px
- Language toggle inline, top-right of card
- Images: click to zoom (lightbox)
- Home page IS the stats dashboard — progress by category + readiness indicators, no separate Stats route

---

## Question Card Anatomy

```
┌─────────────────────────────────────────┐
│  ● Q.42 / 300        [Topic: A1]   [🇬🇧] │  ← mastery dot, number, topic, language
│─────────────────────────────────────────│
│                                         │
│  ┌─────────────────────────────────┐    │
│  │          [image]                │    │  ← image always on top (if present)
│  └─────────────────────────────────┘    │
│                                         │
│  What is the duration of a              │  ← question text below image
│  short blast (•)?                       │
│                                         │
│  ┌─ a. About 1 second. ──────────────┐  │  ← option buttons
│  ├─ b. About 2 seconds. ─────────────┤  │
│  ├─ c. Less than 1 second. ──────────┤  │
│  └─ d. Less than 4 seconds. ─────────┘  │
│                                         │
│  [Explanation panel — slides in         │
│   after answering wrong]                │
│                                         │
│         ← prev    [7/10]      next →    │  ← session progress (7 of 10)
└─────────────────────────────────────────┘
```

---

## States After Answering

- **Correct**: Selected option gets green left border + `--correct-bg`. Brief "Correct!" flash.
- **Wrong**: Selected option gets red left border + `--wrong-bg`. Correct option revealed with green border. Explanation panel slides in from below.
- **Learning mode only**: Blue `<mark>` highlights appear on trigger phrases in the correct answer after revealing.
- **Exam mode**: No highlights, no explanations. Just record the answer and move to next.

---

## Home Dashboard Layout

The Home page is the stats dashboard — no separate Stats route. It displays (top to bottom):

```
┌─────────────────────────────────────────┐
│  🔥 Day 5                 23 days left  │  ← streak + exam countdown
│─────────────────────────────────────────│
│                                         │
│  ██████████░░░░░░░░░░  42 / 300         │  ← mastery progress bar (stacked)
│  ● 42 Familiar  ● 130 Learning  ○ 128  │     green / orange / gray segments
│                                         │
│  Readiness                              │
│  ● Basis: Ready   ● Binnen: Close      │  ← traffic lights (see below)
│  ● Segel: Keep practicing               │
│                                         │
│  Today: 7 / 10 questions               │  ← daily goal progress
│                                         │
│  [ Start Study Session ]                │  ← primary CTA
│  [ Take Exam ]                          │
└─────────────────────────────────────────┘
```

- **Streak** (top-left): flame icon + "Day N". Muted if streak is 0.
- **Exam countdown** (top-right): "N days left". Hidden if no exam date set.
- **Mastery bar**: stacked horizontal bar — green (Familiar), orange (Learning), gray (Unseen). Numbers below.
- **Daily goal**: "7 / 10 questions today" — simple progress text. Checkmark when complete.
- **Primary CTA**: "Start Study Session" button. Tapping opens mode selection (All / Basis / Binnen / Segel / Mistakes / Bookmarks).

---

## Mastery Level Indicators

Each question displays a small dot indicating its mastery state:

| Level | Color | Token | Dot |
|-------|-------|-------|-----|
| Unseen | Gray | `--muted` (`#94A3B8`) | ○ (outline) |
| Learning | Orange | `--learning` (`#F97316`) | ● (filled orange) |
| Familiar | Green | `--correct` (`#22C55E`) | ● (filled green) |

The dot appears next to the question number in the question card header: `● Q.42 / 300`. In question list views (e.g., topic filter), dots appear inline for quick scanning.

---

## Study Session Flow

```
Mode Selection → Question 1 → ... → Question N → Session Summary
```

**Mode selection** (shown when tapping "Start Study Session" or the Learn tab):
- Pill buttons: All / Basis / Binnen / Segel / Mistakes / Bookmarks
- Below: "10 questions" (from settings)
- "Start" button

**Session Summary Card** (shown after the last question):

```
┌─────────────────────────────────────────┐
│           Session Complete!              │
│                                         │
│           8 / 10 correct                │
│                                         │
│   +3 moved to Familiar                  │
│   Weakest: Segel (1/3)                  │
│                                         │
│   [ Start Another ]   [ Back to Home ]  │
└─────────────────────────────────────────┘
```

---

## Readiness Indicator (Traffic Light × 3 Categories)

Displayed on the Home page — one traffic light per exam category, since Motor+Segel has independent pass thresholds for each:

| Category | Questions | Pass threshold | Light logic |
|----------|-----------|----------------|-------------|
| Basis | 1–72 | ≥5/7 (~71%) | Red < 70%, Amber 70–89%, Green ≥ 90% |
| Binnen | 73–253 | ≥18/23 (~78%) | Red < 75%, Amber 75–89%, Green ≥ 90% |
| Segel | 254–300 | ≥5/7 (~71%) | Red < 70%, Amber 70–89%, Green ≥ 90% |

Each category shows a colored dot + label (e.g., "Basis: Ready" / "Segel: Keep practicing"). An overall summary line appears below: **"Ready for the exam!"** only when all three categories are green.

This prevents the false confidence of 85% overall while failing the Segel section specifically.

---

## Celebration Moments

Key milestones deserve feedback that makes the learner feel their progress:

| Trigger | Celebration | Intensity |
|---------|-------------|-----------|
| Category completed (all Basis / Binnen / Segel questions answered at least once) | Full-screen overlay: "All Basis questions completed!" + category icon + continue button | Medium |
| Readiness light turns green (first time per category) | Traffic light animation: dot pulses green + "Basis: Ready!" confetti burst | High |
| Mock exam passed | "Bestanden!" banner + score breakdown by category + share prompt | High |
| 10-question correct streak | Subtle toast: "10 in a row!" with a small wave animation | Low |
| First question answered (ever) | Friendly nudge: "You're on your way!" | Low |

**Design principle:** celebrations should feel earned and brief. No blocking modals for low-intensity moments — toasts that auto-dismiss. High-intensity moments (exam passed, green light) can use a full-screen overlay because they're rare and meaningful.

---

## Nautical Accents (subtle, not distracting)

- Thin wave divider line between page sections (CSS-only, decorative)
- Anchor icon (⚓) as the app logo / favicon
- Compass icon for the readiness indicator
- Tab bar icons: helm wheel (Home), book (Learn), rotate-ccw (Review), clipboard-check (Exam), gear (Settings)

---

## Component Library

Built on **shadcn/ui** + **Tailwind CSS**. Key custom components:

| Component | Description |
|-----------|-------------|
| `QuestionCard` | Core card: question text, options, image, language toggle |
| `LanguageToggle` | Pill button to switch DE/EN/RU |
| `OptionButton` | Single answer option with highlight support |
| `ExplanationPanel` | Slides in after wrong answer with pre-written explanation |
| `ImageViewer` | Zoomable question image (tap on mobile, click on desktop) |
| `ProgressBar` | Visual progress indicator |
| `ReadinessIndicator` | Traffic-light exam readiness |
| `TopicFilter` | Filter questions by topic/category |
| `ExamTimer` | Countdown timer for exam mode |
| `MasteryDot` | Small colored dot indicating Unseen/Learning/Familiar state |
| `MasteryBar` | Stacked horizontal progress bar (green/orange/gray segments) |
| `StreakBadge` | Flame icon + day count on Home dashboard |
| `ExamCountdown` | "N days left" display on Home dashboard |
| `SessionSummary` | End-of-session card with score, mastery transitions, weakest category |
| `DailyGoal` | "7 / 10 questions today" progress indicator |
