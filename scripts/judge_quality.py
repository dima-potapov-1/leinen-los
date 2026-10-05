"""
Step 6: Quality judge — Claude Sonnet 4.6 evaluates all generated content.
Scores each item as Pass or Flag across 4 dimensions.

Usage:
    python scripts/judge_quality.py [--force] [--limit N]
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    DATA_DIR, MODEL_CLAUDE_SONNET,
    console, extract_json, get_openrouter_client, glossary_to_prompt,
    llm_call, load_glossary, load_json, make_progress, save_json,
    strip_option_prefix,
)

DE_PATH = DATA_DIR / "questions-de.json"
EN_PATH = DATA_DIR / "questions-en.json"
RU_PATH = DATA_DIR / "questions-ru.json"
HIGHLIGHTS_PATH = DATA_DIR / "highlights.json"
EXPLANATIONS_PATH = DATA_DIR / "explanations.json"
OUTPUT_PATH = DATA_DIR / "judge-report.json"


def build_judge_prompt(dimension: str, glossary_text: str) -> str:
    prompts = {
        "en_translation": f"""You are a quality judge for German-to-English maritime translations.

{glossary_text}

Evaluate if the English translation accurately preserves the meaning of the German original.
Check: nautical terms, answer correctness preserved, no meaning shifts in wrong answers.

Return JSON:
{{"verdict": "pass" or "flag", "issue": "description if flagged, empty string if pass"}}""",

        "highlights": f"""You are a quality judge for exam answer highlights.

{glossary_text}

Evaluate if the highlighted trigger phrases are:
1. Exact substrings of the correct answer text
2. Minimal but sufficient to differentiate from wrong answers
3. Consistent between German and English

Return JSON:
{{"verdict": "pass" or "flag", "issue": "description if flagged, empty string if pass"}}""",

        "ru_translation": f"""You are a quality judge for Russian maritime translations.
You judge translations that were triangulated from German and English.

{glossary_text}

Check: meaning matches both DE and EN, standard Russian maritime vocabulary used, wrong answers remain wrong.

Return JSON:
{{"verdict": "pass" or "flag", "issue": "description if flagged, empty string if pass"}}""",

        "explanation": f"""You are a quality judge for exam answer explanations.

{glossary_text}

Evaluate if the explanation:
1. Correctly identifies why the wrong option is wrong
2. Correctly states the right answer
3. Has no factual errors about boating regulations
4. Is consistent across DE/EN/RU versions

Return JSON:
{{"verdict": "pass" or "flag", "issue": "description if flagged, empty string if pass"}}""",
    }
    return prompts[dimension]


def judge_en_translation(client, system_prompt: str, q_de: dict, q_en: dict) -> dict:
    opts_en = [strip_option_prefix(o) for o in q_en['options_en']]
    user_prompt = f"""Judge this EN translation of Q{q_de['id']}:

GERMAN (original):
  {q_de['question_de']}
  a) {q_de['options_de'][0]}
  b) {q_de['options_de'][1]}
  c) {q_de['options_de'][2]}
  d) {q_de['options_de'][3]}

ENGLISH (to judge):
  {q_en['question_en']}
  a) {opts_en[0]}
  b) {opts_en[1]}
  c) {opts_en[2]}
  d) {opts_en[3]}"""

    raw = llm_call(client, MODEL_CLAUDE_SONNET, system_prompt, user_prompt, temperature=0.1, json_mode=False)
    return extract_json(raw)


def judge_highlights(client, system_prompt: str, q_de: dict, q_en: dict, h: dict) -> dict:
    user_prompt = f"""Judge the highlights for Q{q_de['id']}:

Correct answer (DE): {q_de['options_de'][0]}
Correct answer (EN): {strip_option_prefix(q_en['options_en'][0])}
Wrong answers (DE): {q_de['options_de'][1:]!r}

Highlights DE: {h['highlights_de']!r}
Highlights EN: {h['highlights_en']!r}"""

    raw = llm_call(client, MODEL_CLAUDE_SONNET, system_prompt, user_prompt, temperature=0.1, json_mode=False)
    return extract_json(raw)


def judge_ru_translation(client, system_prompt: str, q_de: dict, q_en: dict, q_ru: dict) -> dict:
    user_prompt = f"""Judge this RU translation of Q{q_de['id']}:

GERMAN: {q_de['question_de']}
  Options: {q_de['options_de']!r}

ENGLISH: {q_en['question_en']}
  Options: {[strip_option_prefix(o) for o in q_en['options_en']]!r}

RUSSIAN (to judge): {q_ru['question_ru']}
  Options: {[strip_option_prefix(o) for o in q_ru['options_ru']]!r}"""

    raw = llm_call(client, MODEL_CLAUDE_SONNET, system_prompt, user_prompt, temperature=0.1, json_mode=False)
    return extract_json(raw)


def judge_explanation(client, system_prompt: str, q_de: dict, exp: dict, wrong_idx: int) -> dict:
    user_prompt = f"""Judge this explanation for Q{q_de['id']}, wrong option {chr(98 + wrong_idx)}:

Question: {q_de['question_de']}
Correct answer (a): {q_de['options_de'][0]}
Wrong answer ({chr(98 + wrong_idx)}): {q_de['options_de'][wrong_idx + 1]}

Explanation DE: {exp['de']}
Explanation EN: {exp['en']}
Explanation RU: {exp['ru']}"""

    raw = llm_call(client, MODEL_CLAUDE_SONNET, system_prompt, user_prompt, temperature=0.1, json_mode=False)
    return extract_json(raw)


def main():
    parser = argparse.ArgumentParser(description="Quality judge all generated content")
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--limit", type=int, default=0, help="Only judge first N questions")
    args = parser.parse_args()

    required = [
        (DE_PATH, "questions-de"), (EN_PATH, "questions-en"),
        (RU_PATH, "questions-ru"), (HIGHLIGHTS_PATH, "highlights"),
        (EXPLANATIONS_PATH, "explanations"),
    ]
    for path, name in required:
        if not path.exists():
            console.print(f"[red]{name}.json not found. Run previous steps first.[/red]")
            sys.exit(1)

    questions_de = {q["id"]: q for q in load_json(DE_PATH)}
    questions_en = {q["id"]: q for q in load_json(EN_PATH)}
    questions_ru = {q["id"]: q for q in load_json(RU_PATH)}
    highlights = {h["id"]: h for h in load_json(HIGHLIGHTS_PATH)}
    explanations = {e["id"]: e for e in load_json(EXPLANATIONS_PATH)}

    glossary = load_glossary()
    glossary_text = glossary_to_prompt(glossary)

    existing_report = []
    existing_keys = set()
    if OUTPUT_PATH.exists() and not args.force:
        existing_report = load_json(OUTPUT_PATH)
        existing_keys = {(r["question_id"], r["dimension"], r.get("option_idx", -1)) for r in existing_report}

    client = get_openrouter_client()
    report = list(existing_report)
    flagged = 0
    total = 0

    all_ids = sorted(set(questions_de.keys()) & set(questions_en.keys()) & set(questions_ru.keys()))
    if args.limit:
        all_ids = all_ids[:args.limit]

    # Count total tasks
    total_tasks = 0
    for qid in all_ids:
        for dim in ["en_translation", "highlights", "ru_translation"]:
            if (qid, dim, -1) not in existing_keys:
                total_tasks += 1
        if qid in explanations:
            for exp in explanations[qid]["explanations"]:
                if (qid, "explanation", exp["option"]) not in existing_keys:
                    total_tasks += 1

    if total_tasks == 0:
        console.print("[green]All items already judged.[/green]")
        return

    console.print(f"Judging {total_tasks} items across {len(all_ids)} questions")
    console.print(f"Model: {MODEL_CLAUDE_SONNET}")

    prompts = {dim: build_judge_prompt(dim, glossary_text) for dim in
               ["en_translation", "highlights", "ru_translation", "explanation"]}

    with make_progress() as progress:
        task = progress.add_task("Judging quality", total=total_tasks)

        for qid in all_ids:
            q_de = questions_de[qid]
            q_en = questions_en.get(qid)
            q_ru = questions_ru.get(qid)
            h = highlights.get(qid)
            exps = explanations.get(qid)

            # Judge EN translation
            if q_en and (qid, "en_translation", -1) not in existing_keys:
                try:
                    result = judge_en_translation(client, prompts["en_translation"], q_de, q_en)
                    entry = {"question_id": qid, "dimension": "en_translation", "option_idx": -1, **result}
                    report.append(entry)
                    total += 1
                    if result.get("verdict") == "flag":
                        flagged += 1
                except Exception as e:
                    console.print(f"[red]Q{qid} EN: {e}[/red]")
                progress.advance(task)

            # Judge highlights
            if h and (qid, "highlights", -1) not in existing_keys:
                try:
                    result = judge_highlights(client, prompts["highlights"], q_de, q_en, h)
                    entry = {"question_id": qid, "dimension": "highlights", "option_idx": -1, **result}
                    report.append(entry)
                    total += 1
                    if result.get("verdict") == "flag":
                        flagged += 1
                except Exception as e:
                    console.print(f"[red]Q{qid} HL: {e}[/red]")
                progress.advance(task)

            # Judge RU translation
            if q_ru and (qid, "ru_translation", -1) not in existing_keys:
                try:
                    result = judge_ru_translation(client, prompts["ru_translation"], q_de, q_en, q_ru)
                    entry = {"question_id": qid, "dimension": "ru_translation", "option_idx": -1, **result}
                    report.append(entry)
                    total += 1
                    if result.get("verdict") == "flag":
                        flagged += 1
                except Exception as e:
                    console.print(f"[red]Q{qid} RU: {e}[/red]")
                progress.advance(task)

            # Judge explanations
            if exps:
                for exp in exps["explanations"]:
                    if (qid, "explanation", exp["option"]) not in existing_keys:
                        try:
                            result = judge_explanation(client, prompts["explanation"], q_de, exp, exp["option"] - 1)
                            entry = {"question_id": qid, "dimension": "explanation",
                                     "option_idx": exp["option"], **result}
                            report.append(entry)
                            total += 1
                            if result.get("verdict") == "flag":
                                flagged += 1
                        except Exception as e:
                            console.print(f"[red]Q{qid} EXP{exp['option']}: {e}[/red]")
                        progress.advance(task)

            # Save periodically
            if total % 50 == 0 and total > 0:
                save_json(report, OUTPUT_PATH)

    save_json(report, OUTPUT_PATH)

    flag_rate = (flagged / total * 100) if total > 0 else 0
    console.print(f"\n[bold]Judge Results:[/bold]")
    console.print(f"  Total judged: {total}")
    console.print(f"  Flagged: {flagged} ({flag_rate:.1f}%)")
    console.print(f"  Passed: {total - flagged}")

    if flag_rate > 25:
        console.print(f"\n[bold red]WARNING: Flag rate {flag_rate:.1f}% > 25%. "
                       f"Review generation prompts before proceeding.[/bold red]")
    elif flag_rate > 15:
        console.print(f"\n[yellow]Note: Flag rate {flag_rate:.1f}% — moderate. Review flagged items.[/yellow]")
    else:
        console.print(f"\n[green]Flag rate {flag_rate:.1f}% — looking good![/green]")

    # Print flagged items summary
    flags = [r for r in report if r.get("verdict") == "flag"]
    if flags:
        console.print(f"\n[bold]Flagged items ({len(flags)}):[/bold]")
        for f in flags[:20]:
            console.print(f"  Q{f['question_id']} [{f['dimension']}] — {f.get('issue', 'no detail')}")
        if len(flags) > 20:
            console.print(f"  ... and {len(flags) - 20} more (see judge-report.json)")


if __name__ == "__main__":
    main()
