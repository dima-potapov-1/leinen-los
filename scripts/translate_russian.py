"""
Step 4: Translate questions to Russian via DE+EN triangulation using GPT-4o.
Reads both questions-de.json and questions-en.json, produces questions-ru.json.

Usage:
    python scripts/translate_russian.py [--force] [--dry-run] [--limit N]
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

DE_PATH = DATA_DIR / "questions-de.json"
EN_PATH = DATA_DIR / "questions-en.json"
OUTPUT_PATH = DATA_DIR / "questions-ru.json"

SYSTEM_PROMPT_TEMPLATE = """You are a professional translator specializing in maritime and boating regulations.
Translate the given boating exam question from German/English into Russian.

You receive BOTH the German original and its English translation. Use both to triangulate
the most accurate Russian translation — preserve the meaning from German, use English to
resolve ambiguity.

Rules:
- Use standard Russian maritime terminology
- Wrong answers must remain clearly wrong in Russian
- Keep formal register matching the original
- Do NOT include letter prefixes (a, b, c, d) in the translated options — return bare text only
- Return valid JSON only

{glossary}

Return JSON:
{{
  "question_ru": "translated question text",
  "options_ru": ["option a", "option b", "option c", "option d"]
}}"""


def translate_question(client, model: str, system_prompt: str, q_de: dict, q_en: dict) -> dict:
    user_prompt = f"""Translate this boating exam question to Russian:

GERMAN (original):
Question {q_de['id']}: {q_de['question_de']}
a) {q_de['options_de'][0]}
b) {q_de['options_de'][1]}
c) {q_de['options_de'][2]}
d) {q_de['options_de'][3]}

ENGLISH (reference):
Question {q_en['id']}: {q_en['question_en']}
a) {q_en['options_en'][0]}
b) {q_en['options_en'][1]}
c) {q_en['options_en'][2]}
d) {q_en['options_en'][3]}"""

    raw = llm_call(client, model, system_prompt, user_prompt, temperature=0.2)
    result = json.loads(raw)

    if len(result.get("options_ru", [])) != 4:
        raise ValueError(f"Q{q_de['id']}: Expected 4 options, got {len(result.get('options_ru', []))}")

    return {
        "id": q_de["id"],
        "question_ru": result["question_ru"],
        "options_ru": strip_options(result["options_ru"]),
    }


def main():
    parser = argparse.ArgumentParser(description="Translate questions to Russian via DE+EN triangulation")
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
    model = GENERATOR_MODEL

    glossary = load_glossary()
    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(glossary=glossary_to_prompt(glossary))

    existing = {}
    if OUTPUT_PATH.exists() and not args.force:
        existing = {q["id"]: q for q in load_json(OUTPUT_PATH)}

    client = get_openrouter_client()
    results = list(existing.values())
    done_ids = set(existing.keys())

    to_translate = [qid for qid in sorted(questions_de.keys()) if qid not in done_ids and qid in questions_en]
    if args.limit:
        to_translate = to_translate[:args.limit]

    if not to_translate:
        console.print("[green]All questions already translated to Russian.[/green]")
        return

    console.print(f"Translating {len(to_translate)} questions to Russian (model: {model})")

    with make_progress() as progress:
        task = progress.add_task("Translating DE+EN → RU", total=len(to_translate))
        for qid in to_translate:
            try:
                result = translate_question(client, model, system_prompt, questions_de[qid], questions_en[qid])
                results.append(result)
            except Exception as e:
                console.print(f"[red]Q{qid}: {e}[/red]")
            progress.advance(task)

            if len(results) % 25 == 0:
                results.sort(key=lambda x: x["id"])
                save_json(results, OUTPUT_PATH)

    results.sort(key=lambda x: x["id"])
    save_json(results, OUTPUT_PATH)
    console.print(f"\n[bold green]Translated {len(results)} questions to Russian[/bold green]")


if __name__ == "__main__":
    main()
