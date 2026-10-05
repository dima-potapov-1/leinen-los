"""
Step 3: Generate trigger phrase highlights for each question.
Identifies the minimal differentiating phrases in the correct answer.

Usage:
    python scripts/generate_highlights.py [--force] [--dry-run] [--limit N]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    DATA_DIR, GENERATOR_MODEL,
    console, get_openrouter_client, llm_call, load_json, make_progress, save_json,
)

DE_PATH = DATA_DIR / "questions-de.json"
EN_PATH = DATA_DIR / "questions-en.json"
RU_PATH = DATA_DIR / "questions-ru.json"
OUTPUT_PATH = DATA_DIR / "highlights.json"

SYSTEM_PROMPT = """You are an exam preparation expert analyzing German boating license questions.

For each question, identify the KEY TRIGGER PHRASE(S) in the CORRECT answer (option a) that
differentiate it from ALL wrong answers. These are the words a student must memorize.

Rules:
- Highlights must be EXACT substrings of the answer text
- If the correct answer is unique because of a COMBINATION of conditions (e.g., three listed items
  where different wrong answers swap different items), highlight ALL the key conditions — not just one
- Each highlight should be a short phrase (1-5 words), but use MULTIPLE highlights when needed
- A highlight is valid only if it helps distinguish the correct answer from at least one wrong answer
- Provide highlights for ALL THREE languages: German, English, and Russian
- The number of highlights should be the same across all three languages

Return JSON:
{
  "highlights_de": ["phrase1", "phrase2"],
  "highlights_en": ["phrase1", "phrase2"],
  "highlights_ru": ["phrase1", "phrase2"]
}"""


def generate_highlights(client, model: str, q_de: dict, q_en: dict, q_ru: dict) -> dict:
    opts_ru = q_ru.get('options_ru', [])
    ru_section = ""
    if len(opts_ru) == 4:
        ru_section = f"""
Russian: {q_ru.get('question_ru', '')}
  a) {opts_ru[0]}  ← CORRECT
  b) {opts_ru[1]}
  c) {opts_ru[2]}
  d) {opts_ru[3]}
"""

    user_prompt = f"""Question {q_de['id']}:

German: {q_de['question_de']}
  a) {q_de['options_de'][0]}  ← CORRECT
  b) {q_de['options_de'][1]}
  c) {q_de['options_de'][2]}
  d) {q_de['options_de'][3]}

English: {q_en['question_en']}
  a) {q_en['options_en'][0]}  ← CORRECT
  b) {q_en['options_en'][1]}
  c) {q_en['options_en'][2]}
  d) {q_en['options_en'][3]}
{ru_section}
What are the trigger phrases in the correct answer (a) across all three languages?"""

    raw = llm_call(client, model, SYSTEM_PROMPT, user_prompt, temperature=0.2)
    result = json.loads(raw)

    for key in ("highlights_de", "highlights_en", "highlights_ru"):
        if key not in result or not isinstance(result[key], list):
            raise ValueError(f"Q{q_de['id']}: Missing or invalid {key}")

    return {
        "id": q_de["id"],
        "highlights_de": result["highlights_de"],
        "highlights_en": result["highlights_en"],
        "highlights_ru": result["highlights_ru"],
    }


def main():
    parser = argparse.ArgumentParser(description="Generate highlight trigger phrases")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    for path, name in [(DE_PATH, "questions-de.json"), (EN_PATH, "questions-en.json")]:
        if not path.exists():
            console.print(f"[red]{name} not found. Run previous steps first.[/red]")
            sys.exit(1)

    questions_de = {q["id"]: q for q in load_json(DE_PATH)}
    questions_en = {q["id"]: q for q in load_json(EN_PATH)}
    questions_ru = {}
    if RU_PATH.exists():
        questions_ru = {q["id"]: q for q in load_json(RU_PATH)}
    else:
        console.print("[yellow]questions-ru.json not found — highlights will be generated without Russian[/yellow]")
    model = GENERATOR_MODEL

    existing = {}
    if OUTPUT_PATH.exists() and not args.force:
        existing = {h["id"]: h for h in load_json(OUTPUT_PATH)}

    client = get_openrouter_client()
    results = list(existing.values())
    done_ids = set(existing.keys())

    to_process = [qid for qid in sorted(questions_de.keys())
                   if qid not in done_ids and qid in questions_en]
    if args.limit:
        to_process = to_process[:args.limit]

    if not to_process:
        console.print("[green]All highlights already generated.[/green]")
        return

    console.print(f"Generating highlights for {len(to_process)} questions (model: {model})")

    with make_progress() as progress:
        task = progress.add_task("Generating highlights", total=len(to_process))
        for qid in to_process:
            try:
                q_ru = questions_ru.get(qid, {"options_ru": []})
                result = generate_highlights(client, model, questions_de[qid], questions_en[qid], q_ru)
                results.append(result)
            except Exception as e:
                console.print(f"[red]Q{qid}: {e}[/red]")
            progress.advance(task)

            if len(results) % 25 == 0:
                results.sort(key=lambda x: x["id"])
                save_json(results, OUTPUT_PATH)

    results.sort(key=lambda x: x["id"])
    save_json(results, OUTPUT_PATH)
    console.print(f"\n[bold green]Generated highlights for {len(results)} questions[/bold green]")


if __name__ == "__main__":
    main()
