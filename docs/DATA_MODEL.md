# Leinen los! — Data Model & Pipeline

## Database Schema

### `questions` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | int | Question number (1–300) |
| `topic` | text | Official section: "basis" (1–72), "binnen" (73–253), "segeln" (254–300) |
| `topic_name_de` | text | Topic name in German |
| `topic_name_en` | text | Topic name in English |
| `topic_name_ru` | text | Topic name in Russian |
| `question_de` | text | Question text — German |
| `question_en` | text | Question text — English |
| `question_ru` | text | Question text — Russian |
| `image_url` | text? | Path in Supabase Storage (null if no image) |
| `options` | jsonb | Array of 4 options (see structure below) |
| `correct_option` | int | Index of correct answer (0–3) |
| `explanations` | jsonb | Per-wrong-option explanations (see structure below) |

#### Options JSONB Structure

```json
[
  {
    "de": "Etwa 1 Sekunde.",
    "en": "About 1 second.",
    "ru": "Примерно 1 секунда.",
    "highlights_de": ["1 Sekunde"],
    "highlights_en": ["1 second"],
    "highlights_ru": ["1 секунда"]
  },
  { "de": "...", "en": "...", "ru": "...", "highlights_de": [], "highlights_en": [], "highlights_ru": [] },
  { "de": "...", "en": "...", "ru": "...", "highlights_de": [], "highlights_en": [], "highlights_ru": [] },
  { "de": "...", "en": "...", "ru": "...", "highlights_de": [], "highlights_en": [], "highlights_ru": [] }
]
```

`highlights_*` fields store the blue-highlighted trigger phrases as string arrays. Only the correct answer typically has highlights, but the structure supports highlights on any option. The frontend renders `<mark>` tags by matching these phrases against option text.

#### Explanations JSONB Structure

Per-wrong-option: when a user picks option B, they see the explanation for option B specifically — not a generic "the correct answer is A" message. Only wrong options have explanations; the correct option is omitted.

```json
[
  {
    "option": 1,
    "de": "2 Sekunden wäre zu lang für einen kurzen Ton...",
    "en": "2 seconds would be too long for a short blast...",
    "ru": "2 секунды — это слишком долго для короткого сигнала..."
  },
  {
    "option": 2,
    "de": "Weniger als 1 Sekunde ist die richtige Dauer...",
    "en": "Less than 1 second is actually the correct duration...",
    "ru": "Менее 1 секунды — это на самом деле правильная длительность..."
  },
  {
    "option": 3,
    "de": "4 Sekunden entspricht eher einem langen Ton...",
    "en": "4 seconds corresponds more to a long blast...",
    "ru": "4 секунды больше соответствует длинному сигналу..."
  }
]
```

Each explanation tells the learner: (1) why the answer they picked is wrong, and (2) what the correct answer is and why. `option` is the index into the shuffled options array.

**Answer shuffle strategy:** In the official ELWIS catalog, answer "a" is always correct. During seeding, options are shuffled to a random order. `correct_option` stores the shuffled index (0–3). The shuffle is deterministic per question (seeded RNG) so that the app is consistent across sessions but answers aren't always in position "a".

### `profiles` table

Created automatically on user registration via Supabase Auth trigger.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK, FK to `auth.users` |
| `display_name` | text? | Optional display name |
| `preferences` | jsonb | User settings (see structure below) |
| `created_at` | timestamp | Auto-set on creation |
| `updated_at` | timestamp | Auto-updated on change |

#### Preferences JSONB Structure

```json
{
  "language_pair": "de-en",
  "session_size": 10,
  "exam_date": "2026-04-15",
  "streak_count": 5,
  "last_study_date": "2026-03-01"
}
```

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `language_pair` | string | `"de-en"` | `"de-en"` or `"de-ru"` |
| `session_size` | int | `10` | Questions per study session (5–30) |
| `exam_date` | string? | `null` | ISO date of real exam, enables countdown on Home |
| `streak_count` | int | `0` | Consecutive days meeting daily goal |
| `last_study_date` | string? | `null` | ISO date of last day the daily goal was met |

Streak logic: on each question answered, check if today's answered count >= `session_size`. If yes and `last_study_date` is yesterday, increment `streak_count`. If `last_study_date` is before yesterday, reset `streak_count` to 1. If `last_study_date` is today, no change.

### `user_progress` table

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | FK to `profiles.id` |
| `question_id` | int | FK to `questions.id` |
| `mastery` | text | `"unseen"`, `"learning"`, or `"familiar"` (default: `"unseen"`) |
| `consecutive_correct` | int | Correct answers in a row (resets to 0 on wrong answer) |
| `attempts` | int | Total attempts |
| `correct_count` | int | Times answered correctly |
| `bookmarked` | boolean | Manual "watch list" flag |
| `created_at` | timestamp | First interaction with this question |
| `updated_at` | timestamp | Most recent attempt |

**Primary key:** composite `(user_id, question_id)` — one row per user per question.

**Mastery transition logic:**

```
Wrong answer  → mastery = "learning", consecutive_correct = 0
Correct answer → consecutive_correct += 1
                 if consecutive_correct >= 2 → mastery = "familiar"
```

A question can regress: if a "familiar" question is answered wrong, it returns to "learning" and re-enters the Mistakes tab. The Mistakes sub-tab in Review shows all questions where `mastery = "learning"`.

### `exam_attempts` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | PK |
| `user_id` | uuid | FK to `profiles.id` |
| `exam_type` | text | `"motor_segel"` (default), `"motor"`, or `"segel"` |
| `paper_id` | int | Which Prüfungsbogen was drawn (1–15) |
| `started_at` | timestamp | Auto-set on creation |
| `finished_at` | timestamp? | Set on completion |
| `basis_correct` | int | Correct answers in Basis category |
| `binnen_correct` | int | Correct answers in Binnen category |
| `segel_correct` | int? | Correct answers in Segel category (null for motor-only) |
| `passed` | boolean | Meets split threshold for the chosen exam type |
| `answers` | jsonb | Array of `{ question_id, selected_option, correct }` |

### Exam Configuration (Prüfungsbögen)

The official SBF Binnen exam uses **15 predefined exam papers** (Prüfungsbögen), each composed of a fixed set of questions from the 300-question catalog. This mirrors the real exam format.

#### Exam Types

| License | Questions | Composition | Time | Pass Threshold |
|---------|-----------|-------------|------|----------------|
| Motor | 30 | 7 Basis + 23 Binnen | 45 min | ≥5/7 Basis AND ≥18/23 Binnen |
| Motor + Segel | 37 | 7 Basis + 23 Binnen + 7 Segel | 60 min | ≥5/7 Basis AND ≥18/23 Binnen AND ≥5/7 Segel |
| Segel only | 25 | 4 Basis + 14 Binnen + 7 Segel | 35 min | ≥20/25 total |

**MVP scope:** Motor + Segel (37 questions, 60 min). Motor-only and Segel-only variants are secondary options for users who already hold one license part.

#### Data File: `src/data/exam-papers.json`

Stored as a static JSON file (not in the database) — the papers are defined by regulation, never change at runtime, and are the same for all users.

```json
{
  "exam_types": {
    "motor_segel": {
      "label": "Motor + Segel",
      "time_minutes": 60,
      "pass_rules": { "basis_min": 5, "binnen_min": 18, "segel_min": 5 }
    },
    "motor": {
      "label": "Motor",
      "time_minutes": 45,
      "pass_rules": { "basis_min": 5, "binnen_min": 18 }
    },
    "segel": {
      "label": "Segel (ohne Motor)",
      "time_minutes": 35,
      "pass_rules": { "total_min": 20 }
    }
  },
  "papers": [
    {
      "id": 1,
      "basis_questions": [8, 16, 17, 32, 47, 60, 63],
      "binnen_questions": [77, 84, 86, 88, 92, 99, 102, 115, 118, 129, 137, 139, 147, 162, 168, 183, 191, 207, 214, 222, 237, 244, 251],
      "segel_questions": [254, 261, 268, 275, 282, 289, 296]
    }
  ]
}
```

Question IDs in each paper (all three category arrays) are scraped from the official ELWIS / third-party exam paper pages by `scrape-elwis.py`. Motor-only papers use `basis_questions` + `binnen_questions`; Motor+Segel papers use all three arrays; Segel-only papers use a subset of Basis + Binnen + all Segel (different composition per paper).

#### Impact on `exam_attempts` Table

The `exam_attempts` table stores `paper_id` (1–15) and `exam_type` to record what was drawn. Per-category correct counts enable accurate pass/fail evaluation against the split threshold for the chosen exam type.

### Schema Decision: Single Table vs. Normalized

Chose **single table with column-per-language** over normalized translations table because:
- Fixed set of 3 languages (no realistic path to a 4th)
- 300 rows, written once at seed time, read-only at runtime
- Language toggle must be instant — all data already in component state
- Normalized approach adds join overhead solving a problem we won't have

---

## Data Pipeline

All scripts live in `scripts/` and run once during project setup. No real-time LLM calls in the app.

### API & Models

All LLM calls go through **OpenRouter** (single API, single billing dashboard).

| Role | Model | Via OpenRouter |
|------|-------|---------------|
| Generator | GPT-4o | `openai/gpt-4o` |
| Dry-run generator | GPT-4o-mini | `openai/gpt-4o-mini` |
| Judge | Claude Sonnet 4.6 | `anthropic/claude-sonnet-4.6` |

API key: `OPENROUTER_API_KEY` environment variable. All scripts use the `openai` Python library with `base_url="https://openrouter.ai/api/v1"`.

### Data Source Strategy

**Primary source: ELWIS** (official government catalog) — public domain, no dependencies.
**PDF role: validation only** — the third-party PDF with verified English translations is used to cross-check our LLM-generated English, not as input. Requires permission from the PDF owner for this validation use.

### Pipeline Order

```
1. scrape-elwis.py            ELWIS HTML → questions-de.json + images
        ↓
2. translate-english.py       DE → EN via GPT-4o → questions-en.json
        ↓
3. generate-highlights.py     Analyze options via GPT-4o → trigger phrases
        ↓
4. translate-russian.py       DE + EN → RU via GPT-4o → questions-ru.json
        ↓
5. generate-explanations.py   GPT-4o → per-wrong-option explanations × 3 langs
        ↓
6. judge-quality.py           Claude Sonnet 4.6 judges 1,800 items → flagged items
        ↓
7. validate-against-pdf.py    (optional) Cross-check vs. PDF → discrepancy report
        ↓
8. ── HUMAN REVIEWS FLAGGED ITEMS ONLY (~45 min) ──
        ↓
9. upload-images.py           Upload images to Supabase Storage → URLs
        ↓
10. seed-database.py          Merge all JSON → questions-final.json → INSERT into Supabase
```

### Step Details

**1. scrape-elwis.py** — Scrape the 3 ELWIS pages (Basisfragen 1–72, Spezifische Binnen 73–253, Spezifische Segeln 254–300). Extract: question number, question text, 4 options, images. Correct answer is always option "a" in the official catalog. Output: `data/questions-de.json`, downloaded images. Also saves raw HTML to `data/elwis-cache/` as a fallback — if ELWIS changes their page structure, re-scrape from cached HTML while fixing the parser.

**2. translate-english.py** — GPT-4o translates each German question + 4 options into English. System prompt includes a nautical glossary (~30 key terms, e.g., "Fahrt über Grund" → "speed over ground") for domain accuracy. Output: `data/questions-en.json`.

**3. generate-highlights.py** — GPT-4o analyzes all 4 options per question and identifies the key trigger phrases that differentiate the correct answer from wrong ones. Produces highlight arrays for DE and EN. Output: merged into question JSON files.

**4. translate-russian.py** — GPT-4o triangulates from both DE and EN into Russian. Preserves highlighted trigger phrases. System prompt includes Russian maritime terminology references. Output: `data/questions-ru.json`.

**5. generate-explanations.py** — For each question, GPT-4o generates a targeted explanation for each of the 3 wrong options: why that specific option is wrong and why the correct one is right. All 3 languages. This means 3 explanations × 3 languages × 300 questions = 2,700 explanations. Output: `data/explanations.json`.

**6. judge-quality.py** — Claude Sonnet 4.6 evaluates ALL 300 questions across 4 dimensions using structured rubrics:

- **English translations**: Meaning preserved? Nautical terms correct? Wrong answers stay clearly wrong?
- **Trigger highlights**: Phrase actually differentiates correct from wrong? Minimal but sufficient?
- **Russian translations**: Matches both DE and EN? Standard maritime vocabulary?
- **Explanations**: Each per-wrong-option explanation correctly identifies why that option is wrong? States the correct answer? No factual errors?

Each item scored as **Pass** or **Flag** (with specific issue noted). Total: ~1,800 judge calls. Output: `data/judge-report.json` listing only flagged items for human review.

**7. validate-against-pdf.py** *(optional, requires PDF owner permission)* — Cross-checks LLM English and highlights against the human-verified PDF. Adds any new discrepancies to the flagged items list.

**8. Human review** — Review only the flagged items from steps 6–7. Expected: 20–40 items, ~45 minutes.

**9. upload-images.py** — Upload scraped ELWIS images to Supabase Storage, record public URLs.

**10. seed-database.py** — Merge all JSON files into `questions-final.json`, validate completeness, INSERT into the `questions` table.

### Nautical Glossary

Before running the pipeline, build `data/nautical-glossary.json` with ~30 key DE→EN→RU term mappings. Fed to both GPT-4o (generator) and Claude Sonnet 4.6 (judge). This eliminates the biggest error category upfront. Example entries:

| German | English | Russian |
|--------|---------|---------|
| Fahrt über Grund | speed over ground | скорость относительно грунта |
| Fahrt durchs Wasser | speed through water | скорость относительно воды |
| Schallsignal | sound signal | звуковой сигнал |
| Tafelzeichen | sign / board sign | навигационный знак |
| Kleinfahrzeug | small craft | малое судно |

### Pipeline Orchestrator

`run-pipeline.py` — single entry point that runs all steps in order. Supports:
- `--from <step>` to resume from a specific step (e.g., `--from 4` skips scraping and English translation)
- `--dry-run` to preview what each step would do without executing
- `--cost-only` to run `cost-estimator.py` and exit

```bash
python scripts/run-pipeline.py              # full run
python scripts/run-pipeline.py --from 5     # resume from Russian translation
python scripts/run-pipeline.py --cost-only  # preview LLM costs
```

### Idempotency

Each script checks for existing output before processing:
- If `data/questions-de.json` exists and has 300 entries, `scrape-elwis.py` skips.
- LLM scripts (`translate-english.py`, etc.) process per-question and write incrementally. If the script fails at question 237, re-running picks up at 238.
- `judge-quality.py` checks for existing judgments and only judges new/modified items.
- Force re-run with `--force` flag on any script.

### Cost Estimator

Run `python scripts/run-pipeline.py --cost-only` to preview LLM API costs before committing.

---

## LLM Cost Estimates

Based on 300 questions × 4 options each = 1,200 option texts.

### Actual Pipeline Cost (measured)

The original estimates significantly underestimated costs due to: (1) nautical glossary overhead (~500 tokens per call, not accounted for), and (2) judge using standard API pricing, not batch API (2x difference).

| Step | Model | Calls | Actual cost |
|------|-------|-------|-------------|
| English translation (300q) | GPT-4o | 300 | ~$0.32 |
| Trigger highlights (300q, DE+EN+RU) | GPT-4o | 300 | ~$0.21 |
| Russian translation (300q) | GPT-4o | 300 | ~$0.36 |
| Explanations (3 per q × 300q) | GPT-4o | 900 | ~$2.50 |
| **Generator subtotal** | GPT-4o | **1,800** | **~$3.39** |
| Quality judge (6 dimensions × 300q) | Claude Sonnet 4.6 | 1,800 | ~$6.50 |
| **Pipeline total** | | **3,600** | **~$9.89** |
| Validation batches (30q GPT-4o + 60q mini, discarded) | mixed | ~750 | ~$2.50 |
| **Grand total spent** | | | **~$12.39** |

**Quality results:**
- 1,793 items judged across 4 dimensions
- 191 flagged (10.7% flag rate)
- Breakdown: EN translation 7.7%, highlights 10.0%, RU translation 10.0%, explanations 12.1%
- 128 of 300 questions have at least one flag

**Lessons learned:**
- GPT-4o-mini was tested on 60 questions and showed 16.8% flag rate (3x worse than GPT-4o) — not viable as generator
- Glossary adds ~500 input tokens per call; must be included in cost estimates
- Claude Sonnet 4.6 standard API pricing ($3/$15 per 1M) is 2x the batch rate ($1.50/$7.50)
- The judge step is 66% of total cost; consider selective judging (explanations only) for future runs
