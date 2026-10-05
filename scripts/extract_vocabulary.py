#!/usr/bin/env python3
"""
Extract exam-relevant German vocabulary from all 300 SBF Binnen questions.

Produces:
  1. A frequency-ranked word list with Russian translations and example sentences
  2. A JSON output for downstream processing (Quizlet, tutor brief)
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

QUESTIONS_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "questions.json"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "print"

A1_STOPWORDS = {
    "der", "die", "das", "ein", "eine", "einer", "eines", "einem", "einen",
    "und", "oder", "aber", "wenn", "dass", "weil", "ob", "als", "wie",
    "ist", "sind", "war", "hat", "haben", "wird", "werden", "wurde",
    "sein", "bin", "bist", "kann", "können", "muss", "müssen", "soll",
    "sollen", "darf", "dürfen", "will", "wollen", "möchte", "mag",
    "ich", "du", "er", "sie", "es", "wir", "ihr", "man",
    "mein", "dein", "sein", "ihr", "unser", "euer",
    "sich", "mir", "dir", "ihm", "uns", "euch", "ihnen",
    "in", "an", "auf", "aus", "bei", "mit", "nach", "von", "zu", "für",
    "über", "unter", "vor", "hinter", "neben", "zwischen", "um", "durch",
    "gegen", "ohne", "bis", "seit", "während",
    "nicht", "kein", "keine", "keinen", "keinem", "keiner",
    "ja", "nein", "auch", "noch", "schon", "nur", "sehr", "mehr",
    "so", "dann", "dort", "hier", "jetzt", "immer", "nie", "oft",
    "was", "wer", "wo", "wann", "warum", "welche", "welcher", "welches", "welchem",
    "alle", "viele", "einige", "jede", "jeder", "jedes", "jedem",
    "andere", "anderen", "anderer", "anderem",
    "diese", "dieser", "dieses", "diesem", "diesen",
    "den", "dem", "des",
    "zum", "zur", "vom", "im", "am", "ins", "ans",
    "denn", "also", "doch", "mal", "wohl", "eben", "halt",
    "gut", "groß", "große", "großen", "großer", "großes",
    "klein", "kleine", "kleinen", "kleiner", "kleines",
    "neu", "neue", "neuen", "neuer", "neues",
    "alt", "alte", "alten", "alter", "altes",
    "lang", "lange", "langen", "kurz", "kurze", "kurzen",
    "hoch", "hohe", "hohen", "hoher",
    "gehen", "kommen", "machen", "geben", "nehmen", "stehen",
    "sehen", "wissen", "finden", "sagen", "lassen",
    "müsste", "könnte", "sollte", "würde",
    "da", "gar", "etwa", "weder", "noch", "sondern", "zwar",
    "selbst", "selbstständig",
    "es", "gibt", "bzw",
    "cm", "mm", "km", "kg",
    "ab", "hin", "her",
    "zwei", "drei", "vier", "fünf",
    "erste", "ersten", "erster", "zweite", "zweiten",
    "bereits", "mindestens", "höchstens", "jedoch", "sofort",
    "je", "pro", "ca", "bzw",
    "ii", "iii", "iv",
    "b", "c", "d", "e",
    "worden", "dessen", "deren", "denen",
    "infolge", "welchen",
}

EXTRA_FILTER = {
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10",
    "12", "15", "20", "25", "30", "50", "100", "150", "300",
}


def tokenize(text: str) -> list[str]:
    text = text.lower()
    text = re.sub(r'[0-9.,;:!?()\"\'‰°/–—\-\[\]§€%&#+*]', ' ', text)
    tokens = text.split()
    return [t for t in tokens if len(t) > 1 and t not in EXTRA_FILTER]


def extract_all_german_text(questions: list[dict]) -> list[dict]:
    """Extract all German text segments with their Russian counterparts and source question IDs."""
    segments = []
    for q in questions:
        segments.append({
            "de": q["question_de"],
            "ru": q["question_ru"],
            "q_id": q["id"],
            "source": "question",
            "topic": q["topic_name_de"],
        })
        for i, opt in enumerate(q["options"]):
            segments.append({
                "de": opt["de"],
                "ru": opt["ru"],
                "q_id": q["id"],
                "source": f"option_{i}",
                "topic": q["topic_name_de"],
            })
    return segments


def build_word_index(segments: list[dict]) -> dict:
    """Build a word -> {count, question_ids, example_segments} index."""
    word_data = defaultdict(lambda: {
        "count": 0,
        "question_ids": set(),
        "topics": set(),
        "examples": [],
    })

    for seg in segments:
        tokens = tokenize(seg["de"])
        seen_in_seg = set()
        for token in tokens:
            if token in A1_STOPWORDS:
                continue
            word_data[token]["count"] += 1
            word_data[token]["question_ids"].add(seg["q_id"])
            word_data[token]["topics"].add(seg["topic"])
            if token not in seen_in_seg and len(word_data[token]["examples"]) < 3:
                word_data[token]["examples"].append({
                    "de": seg["de"],
                    "ru": seg["ru"],
                    "q_id": seg["q_id"],
                })
            seen_in_seg.add(token)

    return word_data


NAUTICAL_MARKERS = {
    "fahrzeug", "fahrzeugs", "fahrzeuge", "fahrzeugen",
    "fahrwasser", "fahrwassers",
    "schiff", "schiffe", "schiffen", "schiffs",
    "schiffsführer", "schiffsführers",
    "sportboot", "sportboote", "sportbooten", "sportboots",
    "boot", "boote", "booten",
    "segel", "segeln", "segelboot",
    "motor", "motoren", "motorboot",
    "anker", "ankern",
    "ruder", "steuer", "steuerrad",
    "mast", "masten",
    "bug", "heck",
    "backbord", "steuerbord",
    "luv", "lee",
    "kiel", "kielen",
    "seil", "seile", "tau", "taue", "leine", "leinen",
    "knoten",
    "hafen", "häfen",
    "schleuse", "schleusen",
    "kanal", "kanäle",
    "fluss", "fluß", "strom", "ströme",
    "see", "seen", "meer",
    "ufer", "küste",
    "boje", "bojen", "tonne", "tonnen",
    "bake", "baken",
    "leuchtfeuer",
    "fahrrinne",
    "strömung",
    "welle", "wellen", "wellenschlag",
    "wind", "winde", "winden",
    "kurs", "kurse",
    "geschwindigkeit",
    "wasserstraße", "wasserstraßen",
    "binnenschifffahrt", "binnenschifffahrtsstraße",
    "verkehr", "verkehrs",
    "schallsignal", "schallsignale",
    "lichterführung",
    "flagge", "flaggen",
    "rettungsweste", "rettungsmittel", "rettungsring",
    "schwimmweste",
    "feuerlöscher",
    "signalkörper",
    "navigation",
    "peilung",
    "kompass",
    "tiefgang",
    "freibord",
    "verdrängung",
    "tragfähigkeit",
    "ps", "kw",
    "bergfahrt", "talfahrt",
    "schleppverband",
    "kleinfahrzeug", "kleinfahrzeuge",
    "großfahrzeug",
    "vorrang", "vorfahrt",
    "ausweichen",
    "überholen",
    "begegnen",
    "kreuzen",
    "anlegen", "ablegen",
    "festmachen",
    "manöver", "manövern",
    "kennzeichnung",
    "zulassung",
    "führerschein",
    "sportbootführerschein",
}


def classify_word(word: str, data: dict) -> str:
    """Classify word as 'nautical' or 'general-exam'."""
    if word in NAUTICAL_MARKERS:
        return "nautical"
    for marker in NAUTICAL_MARKERS:
        if marker in word or word in marker:
            return "nautical"
    return "general-exam"


def compute_priority_score(data: dict, category: str) -> float:
    """Higher = more important to learn. Combines frequency, spread across questions, and topic coverage."""
    q_spread = len(data["question_ids"])
    topic_spread = len(data["topics"])
    freq = data["count"]
    nautical_bonus = 1.5 if category == "nautical" else 1.0
    return (q_spread * 2 + freq * 0.5 + topic_spread * 3) * nautical_bonus


def main():
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        questions = json.load(f)

    segments = extract_all_german_text(questions)
    word_data = build_word_index(segments)

    vocab_list = []
    for word, data in word_data.items():
        category = classify_word(word, data)
        score = compute_priority_score(data, category)
        vocab_list.append({
            "word": word,
            "category": category,
            "frequency": data["count"],
            "question_count": len(data["question_ids"]),
            "topic_count": len(data["topics"]),
            "topics": sorted(data["topics"]),
            "priority_score": round(score, 1),
            "examples": data["examples"],
        })

    vocab_list.sort(key=lambda x: -x["priority_score"])

    OUTPUT_PATH.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_PATH / "vocabulary_analysis.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(vocab_list, f, ensure_ascii=False, indent=2)

    print(f"Total unique words (after A1 filter): {len(vocab_list)}")
    nautical = [v for v in vocab_list if v['category'] == 'nautical']
    general = [v for v in vocab_list if v['category'] == 'general-exam']
    print(f"  Nautical terms: {len(nautical)}")
    print(f"  General exam words: {len(general)}")
    print(f"\nTop 30 by priority:")
    for i, v in enumerate(vocab_list[:30], 1):
        print(f"  {i:2}. {v['word']:30s}  score={v['priority_score']:6.1f}  freq={v['frequency']:3d}  questions={v['question_count']:3d}  [{v['category']}]")

    print(f"\nSaved to {out_file}")


if __name__ == "__main__":
    main()
