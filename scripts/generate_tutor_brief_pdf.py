#!/usr/bin/env python3
"""Generate a styled PDF of the tutor brief from the vocabulary JSON data."""

import json
from pathlib import Path

DATA_PATH = Path(__file__).resolve().parent.parent / "print" / "sbf-binnen-vocabulary-full.json"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "print"

WEEK_PLAN = [
    (1, ["Block 1 — Судно и его части / Fahrzeug und seine Teile",
         "Block 2 — Водные пути / Wasserstraßen"],
     "Судно и водные пути", "Fahrzeug und Wasserstraßen"),
    (2, ["Block 3 — Движение и маневры / Fahrt und Manöver"],
     "Движение и маневры", "Fahrt und Manöver"),
    (3, ["Block 4 — Парусный спорт / Segeln"],
     "Парусный спорт", "Segeln"),
    (4, ["Block 5 — Правила и регулирование / Regeln und Vorschriften",
         "Block 6 — Знаки и сигналы / Zeichen und Signale"],
     "Правила, знаки и сигналы", "Regeln, Zeichen und Signale"),
    (5, ["Block 7 — Цвета и визуальные описания / Farben und Sichtbarkeit",
         "Block 8 — Безопасность и спасение / Sicherheit und Rettung"],
     "Цвета, видимость и безопасность", "Farben, Sichtbarkeit und Sicherheit"),
    (6, ["Block 9 — Погода и вода / Wetter und Wasser",
         "Block 10 — Ключевые глаголы / Wichtige Verben"],
     "Погода и ключевые глаголы", "Wetter und Verben"),
    (7, ["Block 11 — Направления и позиции / Richtungen und Positionen",
         "Block 12 — Прилагательные из экзамена / Prüfungsadjektive"],
     "Направления и прилагательные", "Richtungen und Adjektive"),
    (8, ["Block 13 — Существительные из правил / Regelwerk-Substantive"],
     "Повторение + экзамен", "Wiederholung + Prüfungssimulation"),
]


def escape(text):
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def build_html(entries):
    blocks = {}
    for e in entries:
        b = e["block"]
        if b not in blocks:
            blocks[b] = []
        blocks[b].append(e)

    html_parts = []

    # ── Title page ──
    html_parts.append("""
    <div class="title-page">
      <div class="title-content">
        <div class="title-icon">⚓</div>
        <h1>SBF Binnen</h1>
        <h2>Учебный план для подготовки<br>к теоретическому экзамену</h2>
        <h3>Lernplan für die theoretische Prüfung</h3>
        <div class="title-meta">
          <div>261 слов · 13 блоков · 8 недель</div>
          <div>261 Wörter · 13 Blöcke · 8 Wochen</div>
        </div>
      </div>
    </div>
    """)

    # ── Context page ──
    html_parts.append("""
    <div class="page">
      <h2 class="section-title">Контекст / Kontext</h2>
      <div class="context-box">
        <p>Дима готовится к теоретическому экзамену на <strong>Sportbootführerschein Binnen</strong> (SBF Binnen) —
        удостоверение на управление прогулочным судном на внутренних водных путях Германии.</p>
        <p>Экзамен: <strong>30 вопросов</strong> из 300 возможных, на немецком языке, множественный выбор.</p>
        <p>Текущий уровень: <strong>A1 → A2</strong>. Экзамен: <strong>~ середина мая 2026</strong>.</p>
      </div>
      <div class="context-box de">
        <p>Dima bereitet sich auf die theoretische Prüfung für den <strong>Sportbootführerschein Binnen</strong> vor.</p>
        <p>Prüfung: <strong>30 Fragen</strong> aus 300 möglichen, auf Deutsch, Multiple-Choice.</p>
        <p>Aktuelles Niveau: <strong>A1 → A2</strong>. Prüfung: <strong>ca. Mitte Mai 2026</strong>.</p>
      </div>

      <h2 class="section-title" style="margin-top: 10mm;">Рекомендации / Empfehlungen</h2>

      <div class="two-col">
        <div class="col-half">
          <h4>Как использовать</h4>
          <ol>
            <li>Каждую неделю — 1-2 блока (~15-50 слов)</li>
            <li>На уроке: слова в контексте экзаменационных предложений</li>
            <li>Дома: Quizlet-карточки + упражнения</li>
            <li>Ключевой навык: различать похожие ответы</li>
          </ol>
        </div>
        <div class="col-half">
          <h4>Типы упражнений / Übungstypen</h4>
          <ul>
            <li><strong>Lückentext</strong> — заполни пропуски</li>
            <li><strong>Zuordnung</strong> — соотнесение термин ↔ значение</li>
            <li><strong>Richtig/Falsch</strong> — верно/неверно</li>
            <li><strong>Mündliche Beschreibung</strong> — описание ситуации</li>
            <li><strong>Prüfungssimulation</strong> — разбор реальных вопросов</li>
          </ul>
        </div>
      </div>

      <h4 style="margin-top: 6mm;">Вопросы для преподавателя / Input von der Lehrerin</h4>
      <ul class="questions-list">
        <li>Какие грамматические конструкции Дима уже усвоил? (падежи, времена, модальные глаголы)</li>
        <li>С какими типами предложений возникают трудности? (придаточные, пассив)</li>
        <li>Рекомендуемый темп — реалистично ли 1 блок в неделю?</li>
        <li>Есть ли предпочтения по формату домашних заданий?</li>
      </ul>
    </div>
    """)

    # ── 8-Week Plan page ──
    html_parts.append("""<div class="page"><h2 class="section-title">План на 8 недель / 8-Wochen-Plan</h2>""")
    html_parts.append('<div class="week-grid">')

    for week_num, block_names, desc_ru, desc_de in WEEK_PLAN:
        word_count = sum(len(blocks.get(b, [])) for b in block_names)
        blocks_html = "".join(f'<div class="week-block">{escape(b.split(" — ")[1] if " — " in b else b)}</div>' for b in block_names)
        html_parts.append(f"""
        <div class="week-card">
          <div class="week-num">Неделя {week_num}<br><span class="week-de">Woche {week_num}</span></div>
          <div class="week-body">
            <div class="week-title">{escape(desc_ru)}<br><span class="week-de">{escape(desc_de)}</span></div>
            {blocks_html}
            <div class="week-count">{word_count} слов</div>
          </div>
        </div>
        """)

    html_parts.append('</div></div>')

    # ── Vocabulary blocks ──
    for block_name, block_entries in blocks.items():
        short_name = block_name.split(" — ")[1] if " — " in block_name else block_name
        block_num = block_name.split(" ")[1] if block_name.startswith("Block") else ""

        html_parts.append(f"""
        <div class="page vocab-page">
          <div class="block-header">
            <span class="block-num">{escape(block_num)}</span>
            <span class="block-title">{escape(short_name)}</span>
            <span class="block-count">{len(block_entries)} слов</span>
          </div>
          <table class="vocab-table">
            <thead>
              <tr>
                <th class="col-de">Deutsch</th>
                <th class="col-ru">Русский</th>
                <th class="col-ex">Пример из экзамена</th>
              </tr>
            </thead>
            <tbody>
        """)

        for entry in block_entries:
            ex = ""
            if entry["example_de"]:
                ex_text = entry["example_de"]
                if len(ex_text) > 80:
                    ex_text = ex_text[:77] + "..."
                ex = f'<span class="example">{escape(ex_text)}</span>'

            html_parts.append(f"""
              <tr>
                <td class="col-de"><strong>{escape(entry["de"])}</strong></td>
                <td class="col-ru">{escape(entry["ru"])}</td>
                <td class="col-ex">{ex}</td>
              </tr>
            """)

        html_parts.append("</tbody></table></div>")

    return "\n".join(html_parts)


CSS = """
@page {
  size: A4 portrait;
  margin: 12mm 12mm 15mm 12mm;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.5;
  font-size: 9.5pt;
}

.title-page {
  width: 100%;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0f2b46 0%, #1a4a6e 100%);
  page-break-after: always;
  margin: -12mm -12mm -15mm -12mm;
  padding: 12mm;
  width: calc(100% + 24mm);
  height: calc(100vh + 27mm);
}

.title-content {
  text-align: center;
  color: white;
}

.title-icon {
  font-size: 48pt;
  margin-bottom: 8mm;
}

.title-content h1 {
  font-size: 32pt;
  font-weight: 800;
  letter-spacing: 2px;
  margin-bottom: 4mm;
}

.title-content h2 {
  font-size: 14pt;
  font-weight: 400;
  opacity: 0.9;
  margin-bottom: 3mm;
  line-height: 1.4;
}

.title-content h3 {
  font-size: 12pt;
  font-weight: 300;
  opacity: 0.7;
  font-style: italic;
  margin-bottom: 10mm;
}

.title-meta {
  font-size: 10pt;
  opacity: 0.6;
  line-height: 1.6;
}

.page {
  page-break-after: always;
}

.section-title {
  font-size: 14pt;
  color: #0f2b46;
  border-bottom: 2pt solid #0f2b46;
  padding-bottom: 2mm;
  margin-bottom: 5mm;
}

.context-box {
  background: #f0f4f8;
  border-left: 3pt solid #0f2b46;
  padding: 4mm 5mm;
  margin-bottom: 4mm;
  border-radius: 0 4px 4px 0;
}

.context-box.de {
  background: #f8f5f0;
  border-left-color: #8b6914;
}

.context-box p {
  margin-bottom: 2mm;
}
.context-box p:last-child { margin-bottom: 0; }

.two-col {
  display: flex;
  gap: 5mm;
  margin-top: 4mm;
}

.col-half {
  flex: 1;
  background: #fafafa;
  padding: 4mm;
  border-radius: 4px;
  border: 0.5pt solid #e0e0e0;
}

.col-half h4 {
  font-size: 10pt;
  color: #0f2b46;
  margin-bottom: 3mm;
}

.col-half ol, .col-half ul {
  padding-left: 5mm;
  font-size: 9pt;
}

.col-half li {
  margin-bottom: 1.5mm;
}

.questions-list {
  padding-left: 5mm;
  font-size: 9pt;
  color: #555;
}
.questions-list li {
  margin-bottom: 1.5mm;
}

/* Week plan */
.week-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4mm;
  margin-top: 4mm;
}

.week-card {
  display: flex;
  border: 0.5pt solid #d0d0d0;
  border-radius: 4px;
  overflow: hidden;
  break-inside: avoid;
}

.week-num {
  background: #0f2b46;
  color: white;
  padding: 3mm;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 20mm;
  font-weight: 700;
  font-size: 9pt;
  text-align: center;
}

.week-de {
  font-weight: 300;
  font-size: 7.5pt;
  opacity: 0.7;
}

.week-body {
  padding: 3mm 4mm;
  flex: 1;
}

.week-title {
  font-weight: 600;
  font-size: 9pt;
  margin-bottom: 2mm;
  color: #0f2b46;
}

.week-block {
  font-size: 7.5pt;
  color: #666;
  padding-left: 3mm;
  border-left: 1.5pt solid #ddd;
  margin-bottom: 1mm;
}

.week-count {
  font-size: 7.5pt;
  color: #999;
  margin-top: 1.5mm;
  font-style: italic;
}

/* Vocabulary tables */
.vocab-page {
  page-break-before: auto;
}

.block-header {
  background: #0f2b46;
  color: white;
  padding: 3mm 5mm;
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: center;
  gap: 3mm;
  margin-bottom: 0;
}

.block-num {
  font-size: 16pt;
  font-weight: 800;
  opacity: 0.5;
}

.block-title {
  font-size: 11pt;
  font-weight: 600;
  flex: 1;
}

.block-count {
  font-size: 8pt;
  opacity: 0.6;
}

.vocab-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 8.5pt;
  margin-bottom: 6mm;
}

.vocab-table thead th {
  background: #e8edf2;
  padding: 2mm 3mm;
  text-align: left;
  font-weight: 600;
  color: #0f2b46;
  font-size: 7.5pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1pt solid #c0c8d0;
}

.vocab-table tbody tr {
  border-bottom: 0.5pt solid #eee;
}

.vocab-table tbody tr:nth-child(even) {
  background: #fafbfc;
}

.vocab-table td {
  padding: 1.5mm 3mm;
  vertical-align: top;
}

.col-de {
  width: 28%;
}

.col-ru {
  width: 30%;
}

.col-ex {
  width: 42%;
}

.example {
  color: #666;
  font-style: italic;
  font-size: 7.5pt;
}
"""


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        entries = json.load(f)

    body_html = build_html(entries)

    html = f"""<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><style>{CSS}</style></head>
<body>
{body_html}
</body>
</html>"""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    html_path = OUTPUT_DIR / "sbf-binnen-tutor-brief.html"
    html_path.write_text(html, encoding="utf-8")

    from playwright.sync_api import sync_playwright

    pdf_path = OUTPUT_DIR / "sbf-binnen-tutor-brief.pdf"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="networkidle")
        page.pdf(
            path=str(pdf_path),
            format="A4",
            margin={"top": "12mm", "bottom": "15mm", "left": "12mm", "right": "12mm"},
            print_background=True,
        )
        browser.close()

    print(f"HTML saved → {html_path}")
    print(f"PDF saved  → {pdf_path}")


if __name__ == "__main__":
    main()
