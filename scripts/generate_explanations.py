"""
Step 5: Generate per-wrong-option explanations in 3 languages.
For each question, generates 3 explanations (one per wrong option).

Usage:
    python scripts/generate_explanations.py [--force] [--dry-run] [--limit N]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    DATA_DIR, GENERATOR_MODEL,
    console, get_openrouter_client, glossary_to_prompt,
    llm_call, load_glossary, load_json, make_progress, save_json,
)

DE_PATH = DATA_DIR / "questions-de.json"
EN_PATH = DATA_DIR / "questions-en.json"
RU_PATH = DATA_DIR / "questions-ru.json"
OUTPUT_PATH = DATA_DIR / "explanations.json"

SYSTEM_PROMPT_TEMPLATE = """You are an expert boating instructor explaining exam answers to students.

For a boating exam question, generate explanations for each WRONG answer option.
Each explanation should:
1. Tell the student why the option they chose is wrong
2. Briefly state what the correct answer is and why
3. Be concise (1-2 sentences)
4. Be in all three languages: German, English, Russian

{glossary}

Return JSON:
{{
  "explanations": [
    {{
      "option": 1,
      "de": "German explanation for why option b is wrong...",
      "en": "English explanation...",
      "ru": "Russian explanation..."
    }},
    {{
      "option": 2,
      "de": "German explanation for why option c is wrong...",
      "en": "English explanation...",
      "ru": "Russian explanation..."
    }},
    {{
      "option": 3,
      "de": "German explanation for why option d is wrong...",
      "en": "English explanation...",
      "ru": "Russian explanation..."
    }}
  ]
}}"""


def generate_for_question(client, model: str, system_prompt: str,
                          q_de: dict, q_en: dict, q_ru: dict) -> dict:
    user_prompt = f"""Question {q_de['id']}:

GERMAN:
  {q_de['question_de']}
  a) {q_de['options_de'][0]}  ← CORRECT
  b) {q_de['options_de'][1]}
  c) {q_de['options_de'][2]}
  d) {q_de['options_de'][3]}

ENGLISH:
  {q_en['question_en']}
  a) {q_en['options_en'][0]}  ← CORRECT
  b) {q_en['options_en'][1]}
  c) {q_en['options_en'][2]}
  d) {q_en['options_en'][3]}

RUSSIAN:
  {q_ru['question_ru']}
  a) {q_ru['options_ru'][0]}  ← CORRECT
  b) {q_ru['options_ru'][1]}
  c) {q_ru['options_ru'][2]}
  d) {q_ru['options_ru'][3]}

Generate explanations for each wrong option (b, c, d) in all three languages."""

    raw = llm_call(client, model, system_prompt, user_prompt, temperature=0.3)
    result = json.loads(raw)

    explanations = result.get("explanations", [])
    if len(explanations) != 3:
        raise ValueError(f"Q{q_de['id']}: Expected 3 explanations, got {len(explanations)}")

    for exp in explanations:
        for key in ("option", "de", "en", "ru"):
            if key not in exp:
                raise ValueError(f"Q{q_de['id']}: Missing key '{key}' in explanation")

    return {
        "id": q_de["id"],
        "explanations": explanations,
    }


def main():
    parser = argparse.ArgumentParser(description="Generate per-wrong-option explanations")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    for path, name in [(DE_PATH, "questions-de"), (EN_PATH, "questions-en"), (RU_PATH, "questions-ru")]:
        if not path.exists():
            console.print(f"[red]{name}.json not found. Run previous steps first.[/red]")
            sys.exit(1)

    questions_de = {q["id"]: q for q in load_json(DE_PATH)}
    questions_en = {q["id"]: q for q in load_json(EN_PATH)}
    questions_ru = {q["id"]: q for q in load_json(RU_PATH)}
    model = GENERATOR_MODEL

    glossary = load_glossary()
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(glossary=glossary_to_prompt(glossary))

    existing = {}
    if OUTPUT_PATH.exists() and not args.force:
        existing = {e["id"]: e for e in load_json(OUTPUT_PATH)}

    client = get_openrouter_client()
    results = list(existing.values())
    done_ids = set(existing.keys())

    all_ids = sorted(set(questions_de.keys()) & set(questions_en.keys()) & set(questions_ru.keys()))
    to_process = [qid for qid in all_ids if qid not in done_ids]
    if args.limit:
        to_process = to_process[:args.limit]

    if not to_process:
        console.print("[green]All explanations already generated.[/green]")
        return

    console.print(f"Generating explanations for {len(to_process)} questions (model: {model})")
    console.print(f"This is the most expensive step (~$2.50 for GPT-4o)")

    with make_progress() as progress:
        task = progress.add_task("Generating explanations", total=len(to_process))
        for qid in to_process:
            try:
                result = generate_for_question(
                    client, model, system_prompt,
                    questions_de[qid], questions_en[qid], questions_ru[qid],
                )
                results.append(result)
            except Exception as e:
                console.print(f"[red]Q{qid}: {e}[/red]")
            progress.advance(task)

            if len(results) % 10 == 0:
                results.sort(key=lambda x: x["id"])
                save_json(results, OUTPUT_PATH)

    results.sort(key=lambda x: x["id"])
    save_json(results, OUTPUT_PATH)
    console.print(f"\n[bold green]Generated explanations for {len(results)} questions[/bold green]")


if __name__ == "__main__":
    main()
