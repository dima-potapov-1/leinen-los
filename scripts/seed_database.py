"""
Step 10: Merge all JSON files into final format and seed the database.
Produces questions-final.json and src/data/questions.json (bundled fallback).
Optionally INSERTs into Supabase.

Usage:
    python scripts/seed_database.py [--no-supabase] [--force]
"""
from __future__ import annotations

import argparse
import hashlib
import random
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    DATA_DIR, SRC_DATA_DIR,
    console, load_json, save_json,
)

DE_PATH = DATA_DIR / "questions-de.json"
EN_PATH = DATA_DIR / "questions-en.json"
RU_PATH = DATA_DIR / "questions-ru.json"
HIGHLIGHTS_PATH = DATA_DIR / "highlights.json"
EXPLANATIONS_PATH = DATA_DIR / "explanations.json"
FINAL_PATH = DATA_DIR / "questions-final.json"
BUNDLED_PATH = SRC_DATA_DIR / "questions.json"


def deterministic_shuffle(options: list, correct_idx: int, seed: int) -> tuple:
    """Shuffle options deterministically. Returns (shuffled_options, new_correct_idx)."""
    rng = random.Random(seed)
    indices = list(range(len(options)))
    rng.shuffle(indices)
    shuffled = [options[i] for i in indices]
    new_correct = indices.index(correct_idx)
    return shuffled, new_correct


def merge_question(q_de: dict, q_en: dict, q_ru: dict, highlights: dict, explanations: dict) -> dict:
    """Merge all data for one question into the final schema."""
    qid = q_de["id"]
    seed = int(hashlib.md5(f"leinen-los-{qid}".encode()).hexdigest()[:8], 16)

    # Build options array in original ELWIS order (a=correct, b, c, d)
    options_original = []
    for i in range(4):
        opt = {
            "de": q_de["options_de"][i],
            "en": q_en["options_en"][i] if q_en else "",
            "ru": q_ru["options_ru"][i] if q_ru else "",
            "highlights_de": highlights.get("highlights_de", []) if i == 0 else [],
            "highlights_en": highlights.get("highlights_en", []) if i == 0 else [],
            "highlights_ru": highlights.get("highlights_ru", []) if i == 0 else [],
        }
        options_original.append(opt)

    # Shuffle options deterministically
    shuffled_options, correct_option = deterministic_shuffle(options_original, 0, seed)

    # Map explanations to shuffled indices
    exps = []
    if explanations and "explanations" in explanations:
        for exp in explanations["explanations"]:
            # exp["option"] is 1-based index of wrong option in ORIGINAL order (1=b, 2=c, 3=d)
            original_idx = exp["option"]  # 1, 2, or 3 → maps to original indices 1, 2, 3
            # Find where this option ended up after shuffling
            for new_idx, opt in enumerate(shuffled_options):
                if opt["de"] == options_original[original_idx]["de"]:
                    exps.append({
                        "option": new_idx,
                        "de": exp["de"],
                        "en": exp["en"],
                        "ru": exp["ru"],
                    })
                    break

    topic_names = {
        "basis": {"de": "Basisfragen", "en": "Basic questions", "ru": "Базовые вопросы"},
        "binnen": {"de": "Spezifische Fragen Binnen", "en": "Inland-specific questions", "ru": "Вопросы по внутренним водным путям"},
        "segeln": {"de": "Spezifische Fragen Segeln", "en": "Sailing-specific questions", "ru": "Вопросы по парусному спорту"},
    }
    tn = topic_names.get(q_de["topic"], {"de": "", "en": "", "ru": ""})

    return {
        "id": qid,
        "topic": q_de["topic"],
        "topic_name_de": tn["de"],
        "topic_name_en": tn["en"],
        "topic_name_ru": tn["ru"],
        "question_de": q_de["question_de"],
        "question_en": q_en["question_en"] if q_en else "",
        "question_ru": q_ru["question_ru"] if q_ru else "",
        "image_url": f"/images/{q_de['image_file']}" if q_de.get("image_file") else None,
        "options": shuffled_options,
        "correct_option": correct_option,
        "explanations": exps,
    }


def main():
    parser = argparse.ArgumentParser(description="Merge all data and seed database")
    parser.add_argument("--no-supabase", action="store_true", help="Skip Supabase INSERT, just generate JSON")
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()

    if not DE_PATH.exists():
        console.print("[red]questions-de.json not found.[/red]")
        sys.exit(1)

    questions_de = {q["id"]: q for q in load_json(DE_PATH)}
    questions_en = {q["id"]: q for q in load_json(EN_PATH)} if EN_PATH.exists() else {}
    questions_ru = {q["id"]: q for q in load_json(RU_PATH)} if RU_PATH.exists() else {}
    highlights_map = {h["id"]: h for h in load_json(HIGHLIGHTS_PATH)} if HIGHLIGHTS_PATH.exists() else {}
    explanations_map = {e["id"]: e for e in load_json(EXPLANATIONS_PATH)} if EXPLANATIONS_PATH.exists() else {}

    console.print(f"Merging: {len(questions_de)} DE, {len(questions_en)} EN, "
                  f"{len(questions_ru)} RU, {len(highlights_map)} highlights, "
                  f"{len(explanations_map)} explanations")

    merged = []
    for qid in sorted(questions_de.keys()):
        q = merge_question(
            questions_de[qid],
            questions_en.get(qid, None),
            questions_ru.get(qid, None),
            highlights_map.get(qid, {}),
            explanations_map.get(qid, None),
        )
        merged.append(q)

    # Validate
    errors = 0
    for q in merged:
        if len(q["options"]) != 4:
            console.print(f"[red]Q{q['id']}: has {len(q['options'])} options[/red]")
            errors += 1
        if not q["question_de"]:
            console.print(f"[red]Q{q['id']}: missing DE question text[/red]")
            errors += 1

    if errors:
        console.print(f"[red]{errors} validation errors[/red]")
        sys.exit(1)

    save_json(merged, FINAL_PATH)
    save_json(merged, BUNDLED_PATH)
    console.print(f"[bold green]Merged {len(merged)} questions[/bold green]")
    console.print(f"  → {FINAL_PATH}")
    console.print(f"  → {BUNDLED_PATH} (bundled fallback)")

    # Supabase seeding
    if not args.no_supabase:
        try:
            import os
            from supabase import create_client
            url = os.getenv("SUPABASE_URL")
            key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
            if url and key:
                console.print("\nSeeding Supabase...")
                client = create_client(url, key)
                # Upsert in batches
                batch_size = 50
                for i in range(0, len(merged), batch_size):
                    batch = merged[i:i + batch_size]
                    client.table("questions").upsert(batch).execute()
                    console.print(f"  Inserted {min(i + batch_size, len(merged))}/{len(merged)}")
                console.print("[bold green]Supabase seeding complete[/bold green]")
            else:
                console.print("[yellow]Supabase credentials not found, skipping INSERT.[/yellow]")
        except Exception as e:
            console.print(f"[yellow]Supabase seeding failed: {e}[/yellow]")
            console.print("JSON files were generated successfully. Seed manually later.")


if __name__ == "__main__":
    main()
