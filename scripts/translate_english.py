"""
Step 2: Translate German questions to English using GPT-4o.
Reads questions-de.json, produces questions-en.json.
Incremental: skips already-translated questions on re-run.

Usage:
    python scripts/translate_english.py [--force] [--dry-run] [--limit N]
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
    strip_options,
)

INPUT_PATH = DATA_DIR / "questions-de.json"
OUTPUT_PATH = DATA_DIR / "questions-en.json"

SYSTEM_PROMPT_TEMPLATE = """You are a professional translator specializing in German maritime and boating regulations.
Translate the given German boating exam question and its answer options into English.

Rules:
- Preserve the exact meaning — wrong answers must remain clearly wrong
- Use standard maritime English terminology
- Keep the same level of formality as the original
- Do NOT include letter prefixes (a, b, c, d) in the translated options — return bare text only
- Return valid JSON only

{glossary}

Return JSON in this exact format:
{{
  "question_en": "translated question text",
  "options_en": ["option a translation", "option b translation", "option c translation", "option d translation"]
}}"""


def translate_question(client, model: str, system_prompt: str, question: dict) -> dict:
    user_prompt = f"""Translate this German boating exam question to English:

Question {question['id']}: {question['question_de']}

Options:
a) {question['options_de'][0]}
b) {question['options_de'][1]}
c) {question['options_de'][2]}
d) {question['options_de'][3]}"""

    raw = llm_call(client, model, system_prompt, user_prompt, temperature=0.2)
    result = json.loads(raw)

    if len(result.get("options_en", [])) != 4:
        raise ValueError(f"Q{question['id']}: Expected 4 options, got {len(result.get('options_en', []))}")

    return {
        "id": question["id"],
        "question_en": result["question_en"],
        "options_en": strip_options(result["options_en"]),
    }


def main():
    parser = argparse.ArgumentParser(description="Translate DE questions to EN via GPT-4o")
    parser.add_argument("--force", action="store_true", help="Re-translate all questions")
    parser.add_argument("--dry-run", action="store_true", help="(deprecated, model now set in common.py)")
    parser.add_argument("--limit", type=int, default=0, help="Only translate first N questions (0 = all)")
    args = parser.parse_args()

    if not INPUT_PATH.exists():
        console.print("[red]questions-de.json not found. Run scrape_elwis.py first.[/red]")
        sys.exit(1)

    questions_de = load_json(INPUT_PATH)
    model = GENERATOR_MODEL
    console.print(f"Model: [bold]{model}[/bold]")

    # Load existing translations for incremental processing
    existing = {}
    if OUTPUT_PATH.exists() and not args.force:
        existing = {q["id"]: q for q in load_json(OUTPUT_PATH)}
        console.print(f"Loaded {len(existing)} existing translations")

    glossary = load_glossary()
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(glossary=glossary_to_prompt(glossary))

    client = get_openrouter_client()
    results = list(existing.values())
    translated_ids = set(existing.keys())

    to_translate = [q for q in questions_de if q["id"] not in translated_ids]
    if args.limit:
        to_translate = to_translate[:args.limit]

    if not to_translate:
        console.print("[green]All questions already translated.[/green]")
        return

    console.print(f"Translating {len(to_translate)} questions...")
    errors = 0

    with make_progress() as progress:
        task = progress.add_task("Translating DE → EN", total=len(to_translate))
        for q in to_translate:
            try:
                result = translate_question(client, model, system_prompt, q)
                results.append(result)
                translated_ids.add(q["id"])
            except Exception as e:
                console.print(f"[red]Q{q['id']}: {e}[/red]")
                errors += 1
            progress.advance(task)

            # Save incrementally every 25 questions
            if len(results) % 25 == 0:
                results.sort(key=lambda x: x["id"])
                save_json(results, OUTPUT_PATH)

    results.sort(key=lambda x: x["id"])
    save_json(results, OUTPUT_PATH)
    console.print(f"\n[bold green]Translated {len(results)} questions ({errors} errors)[/bold green]")


if __name__ == "__main__":
    main()
