#!/usr/bin/env python3
"""Generate a printable PDF with SBF Binnen exam questions — German | Russian side by side."""

from __future__ import annotations

import base64
import json
import mimetypes
import sys
from pathlib import Path
from typing import Optional

QUESTIONS_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "questions.json"
IMAGES_DIR = Path(__file__).resolve().parent.parent / "public"
OUTPUT_PATH = Path(__file__).resolve().parent.parent / "print" / "leinen-los-tickets.pdf"


def image_to_data_uri(image_url: str) -> Optional[str]:
    """Convert a local image path to a base64 data URI for embedding in HTML."""
    image_path = IMAGES_DIR / image_url.lstrip("/")
    if not image_path.exists():
        print(f"  WARNING: image not found: {image_path}", file=sys.stderr)
        return None
    mime, _ = mimetypes.guess_type(str(image_path))
    if not mime:
        mime = "image/gif"
    data = base64.b64encode(image_path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"


def highlight_text(text: str, highlights: list[str]) -> str:
    """Wrap highlight phrases in <mark> tags."""
    for phrase in highlights:
        if phrase in text:
            text = text.replace(phrase, f'<mark>{phrase}</mark>')
    return text


def build_option_html(option: dict, idx: int, is_correct: bool, lang: str) -> str:
    letter = chr(ord("A") + idx)
    text_key = "de" if lang == "de" else "ru"
    hl_key = f"highlights_{text_key}"

    text = option[text_key]
    highlights = option.get(hl_key, [])

    if is_correct and highlights:
        text = highlight_text(text, highlights)
    elif is_correct and not highlights:
        text = f'<mark>{text}</mark>'

    cls = "option correct" if is_correct else "option"
    return f'<div class="{cls}"><span class="letter">{letter}.</span> {text}</div>'


def build_ticket_html(q: dict, num: int) -> str:
    correct = q["correct_option"]
    topic_de = q["topic_name_de"]
    topic_ru = q["topic_name_ru"]

    de_options = "\n".join(
        build_option_html(opt, i, i == correct, "de")
        for i, opt in enumerate(q["options"])
    )
    ru_options = "\n".join(
        build_option_html(opt, i, i == correct, "ru")
        for i, opt in enumerate(q["options"])
    )

    image_html = ""
    if q.get("image_url"):
        data_uri = image_to_data_uri(q["image_url"])
        if data_uri:
            image_html = f'<div class="question-image"><img src="{data_uri}" alt="Frage {q["id"]}"></div>'

    return f"""
    <div class="ticket">
      <div class="ticket-header">
        <span class="q-number">Frage {q['id']} — Leinen los!</span>
        <span class="topic">{topic_de} / {topic_ru}</span>
      </div>
      {image_html}
      <div class="columns">
        <div class="col col-de">
          <div class="lang-label">Deutsch</div>
          <div class="question">{q['question_de']}</div>
          <div class="options">{de_options}</div>
        </div>
        <div class="divider"></div>
        <div class="col col-ru">
          <div class="lang-label">Русский</div>
          <div class="question">{q['question_ru']}</div>
          <div class="options">{ru_options}</div>
        </div>
      </div>
      <div class="footer">
        <span><span class="legend-correct"></span> Richtige Antwort / Правильный ответ</span>
        <span><span class="legend-highlight">abc</span> Schlüsselwörter / Ключевые слова</span>
      </div>
    </div>
    """


CSS = """
@page {
  size: A4 landscape;
  margin: 0;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.5;
}

.ticket {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  page-break-after: always;
  overflow: hidden;
}

.ticket:last-child {
  page-break-after: avoid;
}

.ticket-header {
  background: #0f2b46;
  color: white;
  padding: 5mm 8mm;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.q-number {
  font-weight: 700;
  font-size: 15pt;
}

.topic {
  font-style: italic;
  opacity: 0.85;
  font-size: 10pt;
}

.columns {
  display: flex;
  flex: 1;
}

.col {
  flex: 1;
  padding: 6mm 8mm 8mm;
  display: flex;
  flex-direction: column;
}

.divider {
  width: 1.5pt;
  background: #c0c0c0;
}

.lang-label {
  font-size: 9pt;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 2px;
  color: #0f2b46;
  margin-bottom: 4mm;
  opacity: 0.5;
}

.question {
  font-weight: 600;
  margin-bottom: 5mm;
  font-size: 13pt;
  color: #0f2b46;
  line-height: 1.4;
}

.options {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: 2.5mm;
}

.option {
  padding: 3mm 4mm;
  border-radius: 4px;
  font-size: 11.5pt;
  border-left: 3pt solid transparent;
  line-height: 1.4;
}

.option .letter {
  font-weight: 700;
  margin-right: 2mm;
}

.option.correct {
  background: #e8f5e9;
  border-left: 3pt solid #2e7d32;
  font-weight: 500;
}

mark {
  background: #fff176;
  color: #1a1a1a;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 700;
}

.question-image {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4mm 8mm;
  background: #fafafa;
  border-bottom: 1pt solid #e0e0e0;
}

.question-image img {
  max-height: 80px;
  max-width: 90%;
  object-fit: contain;
}

.footer {
  background: #f5f5f5;
  padding: 2.5mm 8mm;
  display: flex;
  justify-content: center;
  gap: 8mm;
  font-size: 8pt;
  color: #999;
  border-top: 1pt solid #e0e0e0;
}

.legend-correct {
  display: inline-block;
  width: 10pt;
  height: 10pt;
  background: #e8f5e9;
  border-left: 2pt solid #2e7d32;
  vertical-align: middle;
  margin-right: 2mm;
}

.legend-highlight {
  display: inline-block;
  background: #fff176;
  padding: 0 3px;
  font-weight: 700;
  vertical-align: middle;
  margin-right: 2mm;
  border-radius: 2px;
}
"""


def main():
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        questions = json.load(f)

    tickets_html = "\n".join(build_ticket_html(q, i + 1) for i, q in enumerate(questions))

    html = f"""<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><style>{CSS}</style></head>
<body>
{tickets_html}
</body>
</html>"""

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    html_path = OUTPUT_PATH.with_suffix(".html")
    html_path.write_text(html, encoding="utf-8")

    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="networkidle")
        page.pdf(
            path=str(OUTPUT_PATH),
            format="A4",
            landscape=True,
            margin={"top": "0mm", "bottom": "0mm", "left": "0mm", "right": "0mm"},
            print_background=True,
        )
        browser.close()

    print(f"PDF saved → {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
