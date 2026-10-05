#!/usr/bin/env python3
"""Generate a printable DE-RU PDF vocabulary for the practical exam (Motor + Sailing)."""

from __future__ import annotations

from pathlib import Path

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "print"

BLOCKS = [
    {
        "title": "Block 1 — Роли на борту / Rollen an Bord",
        "words": [
            ("der Rudergänger", "рулевой", "Rudergänger: Klar zum Ablegen?"),
            ("die Mannschaft", "экипаж, команда", "Mannschaft: Fender & Leinen klar!"),
            ("der Prüfer", "экзаменатор", "Prüfer: Nehmen Sie Kurs auf!"),
            ("der Vorschoter", "шкотовый (передний матрос)", "Vorschoter: Ist klar!"),
            ("das Crewmitglied", "член экипажа", "Crewmitglieder direkt ansprechen."),
        ],
    },
    {
        "title": "Block 2 — Части судна / Teile des Bootes",
        "words": [
            ("der Bug", "нос судна", "Bug abfendern!"),
            ("das Heck", "корма", "Heck dreht sich vom Steg weg."),
            ("Steuerbord", "правый борт", "Bereitmachen zum Bergen an Steuerbord."),
            ("Backbord", "левый борт", "Boje über Bord an Backbord!"),
            ("der Steg", "причал, пирс", "Klar zum Anlegen am Steg?"),
            ("das Ufer", "берег", "Klar zum Anlegen am Ufer?"),
            ("die Maschine", "двигатель, мотор", "Maschine neutral."),
            ("das Ruder", "руль", "Ruder gerade, sobald Vorsegel back steht."),
            ("das Vorsegel", "стаксель (передний парус)", "Vorsegel über!"),
            ("das Großsegel", "грот (главный парус)", "Wenn Großsegel umschlägt."),
            ("der Großbaum", "гик (перекладина грота)", "Großbaum herüberziehen."),
            ("die Mastspitze", "топ мачты", "Zweifarbenlaterne an der Mastspitze."),
        ],
    },
    {
        "title": "Block 3 — Такелаж и швартовка / Leinen und Festmacher",
        "words": [
            ("die Leine", "конец, линь, швартов", "Alle anderen Leinen los!"),
            ("die Vorspring", "носовой шпринг", "Vorspring auf Slip!"),
            ("auf Slip", "на слип (быстрая отдача)", "Vorspring auf Slip, alle anderen Leinen los!"),
            ("der Fender", "кранец", "Fender & Leinen klar!"),
            ("abfendern", "защитить кранцами", "Bug abfendern!"),
            ("die Schot", "шкот", "Schoten los!"),
            ("die Großschot", "грота-шкот", "Großschot dichtholen."),
            ("das Großschotbündel", "пучок грота-шкота", "In das Großschotbündel greifen."),
        ],
    },
    {
        "title": "Block 4 — Двигатель и передачи / Motor und Getriebe",
        "words": [
            ("der Vorwärtsgang", "передний ход", "Vorwärtsgang einlegen."),
            ("der Rückwärtsgang", "задний ход", "Rückwärtsgang zum Aufstoppen."),
            ("der Leerlauf", "нейтраль, холостой ход", "Leerlauf; Gegenlenken."),
            ("auskuppeln", "выключить передачу", "Maschine sofort auskuppeln."),
            ("einlegen", "включить (передачу)", "Rückwärtsgang einlegen."),
            ("neutral", "нейтраль", "Maschine neutral."),
            ("die Drehzahl", "обороты двигателя", "Eine geringe Drehzahl."),
            ("Vollgas", "полный газ", "Keine Vollgasmanöver am Steg."),
        ],
    },
    {
        "title": "Block 5 — Управление рулём / Steuern und Lenken",
        "words": [
            ("lenken", "рулить, управлять рулём", "Komplett zum Steg lenken."),
            ("einlenken", "поворачивать (руль) к", "Zum Steg einlenken."),
            ("gegenlenken", "контр-руление", "Leerlauf; Gegenlenken."),
            ("steuern", "управлять курсом", "Das Ufer ansteuern."),
            ("Ruder gerade", "руль прямо", "Ruder gerade, sobald Vorsegel back steht."),
            ("komplett", "полностью", "Komplett zur anderen Seite einlenken."),
        ],
    },
    {
        "title": "Block 6 — Моторные манёвры / Motor-Manöver",
        "words": [
            ("ablegen", "отходить от причала", "Klar zum Ablegen?"),
            ("anlegen", "швартоваться", "Klar zum Anlegen am Steg?"),
            ("festmachen", "закрепить, пришвартовать", "Das Boot festmachen!"),
            ("aufstoppen", "остановить(ся)", "Rückwärtsgang zum Aufstoppen."),
            ("das Manöver", "манёвр", "Manöver beendet."),
            ("der Rundumblick", "круговой обзор", "Achtern Rundumblick ob Freiraum."),
            ("der Freiraum", "свободное пространство", "Rundumblick ob Freiraum."),
            ("der spitze Winkel", "острый угол", "Im spitzen Winkel auf den Steg zufahren."),
            ("Wende auf engem Raum", "разворот в огр. пространстве", "Wende auf engem Raum über Steuerbord."),
            ("der Gegenkurs", "обратный курс", "Bis der Gegenkurs anliegt."),
        ],
    },
    {
        "title": "Block 7 — Парусные манёвры / Segel-Manöver",
        "words": [
            ("die Wende", "поворот оверштаг", "Klar zur Wende?"),
            ("die Halse", "поворот фордевинд", "Klar zur Halse?"),
            ("das Schiften", "перекладка парусов", "Klar zum Schiften?"),
            ("die Q-Wende", "Q-поворот (спасательный)", "Klar zur Q-Wende?"),
            ("der Aufschießer", "приведение в ветер", "Klarmachen zum Aufschießer!"),
            ("anluven", "приводиться (к ветру)", "Anluven; Bug geht durch den Wind."),
            ("abfallen", "увалиться (от ветра)", "Abfallen; Heck geht durch den Wind."),
            ("durch den Wind gehen", "проходить через ветер", "Bug geht durch den Wind."),
            ("back stehen", "заполаскивать (парус)", "Sobald Vorsegel back steht."),
            ("dichtholen", "выбрать (шкот)", "Großschot dichtholen."),
            ("fieren", "потравить (ослабить шкот)", "Die Großschot zügig fieren."),
            ("überholen (Segel)", "перебросить парус", "Vorsegel wird vom Vorschoter übergeholt."),
            ("rund achtern", "через корму", "Rund achtern!"),
            ("in den Wind schießen", "привестись в ветер", "In den Wind schießen."),
        ],
    },
    {
        "title": "Block 8 — Курсы и ветер / Kurse und Wind",
        "words": [
            ("der Halbwindkurs", "галфвинд (полветра)", "Neuer Kurs Halbwindkurs!"),
            ("der Raumwindkurs", "бакштаг", "Aus einem stabilen Raumwindkurs."),
            ("der Vorwindkurs", "фордевинд (по ветру)", "Vorwindkurs halten."),
            ("Luv", "наветренная сторона", "Luve an!"),
            ("Lee", "подветренная сторона", "(Gegenüber von Luv)"),
            ("der Wind / die Welle", "ветер / волна", "Gegen Wind und Welle."),
        ],
    },
    {
        "title": "Block 9 — MOB: спасение / MOB: Rettung",
        "words": [
            ("Mann über Bord", "человек за бортом", "Mann über Bord an Steuerbord!"),
            ("Boje über Bord", "буй за бортом (тренировка)", "Boje über Bord an Backbord!"),
            ("im Blick behalten", "не терять из виду", "Mann im Blick behalten!"),
            ("das Markierungsmittel", "маркировочное средство", "Markierungsmittel ausbringen!"),
            ("das Rettungsmittel", "спасательное средство", "Rettungsmittel bereithalten!"),
            ("ausbringen", "выбросить, развернуть", "Markierungsmittel ausbringen!"),
            ("bereithalten", "держать наготове", "Rettungsmittel bereithalten!"),
            ("bergen", "подобрать из воды", "Bereitmachen zum Bergen."),
            ("an Bord nehmen", "принять на борт", "Mann an Bord nehmen!"),
            ("die Bootslänge", "длина судна", "Ca. 4 Bootslängen wegfahren."),
            ("geborgen", "поднят, спасён", "Mann ist geborgen."),
            ("der Ernstfall", "реальная / экстренная ситуация", 'Im Ernstfall gilt „Mann über Bord".'),
        ],
    },
    {
        "title": "Block 10 — Стандартные команды / Standard-Kommandos",
        "words": [
            ("klar", "готов; свободно", "Klar zum Ablegen?"),
            ("klarmachen", "приготовить", "Leinen und Fender klarmachen!"),
            ("los", "отдать (конец)", "Vorspring los! / Schoten los!"),
            ("frei", "свободно, чисто", "Achtern frei!"),
            ("über", "через / на другой борт", "Leinen über! / Vorsegel über!"),
            ("fest", "закреплён", "Leinen sind fest."),
            ("beendet", "завершён", "Manöver beendet."),
            ("Ree!", "команда: поворот оверштаг", "Ree!"),
            ("Nehme Kurs auf", "беру курс на", "Nehme Kurs auf in Richtung Fernsehturm."),
            ("Kurs liegt an", "курс установлен", "Kurs 3-0-0 Grad liegt an."),
            ("achtern", "позади (по корме)", "Achtern Rundumblick."),
            ("mittschiffs", "на миделе (посередине)", "Mittschiffs neben dem MOB aufzustoppen."),
            ("ansprechen", "обращаться (к кому-л.)", "Crewmitglieder direkt ansprechen."),
            ("Fahrt aufnehmen", "набирать ход", "Nehme Fahrt gegen Wind und Welle auf."),
        ],
    },
    {
        "title": "Block 11 — Звуковые сигналы / Schallsignale",
        "words": [
            ("der Ton", "гудок, звук", "Ein kurzer Ton."),
            ("kurz", "короткий", "Drei kurze Töne."),
            ("das Schallsignal", "звуковой сигнал", "Schallsignale zur Kursänderungen."),
            ("die Kursänderung", "изменение курса", "Schallsignale zur Kursänderungen."),
        ],
    },
]


def escape(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


CSS = """
@page { size: A4 portrait; margin: 10mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.4;
  font-size: 9pt;
}
h1 {
  text-align: center;
  font-size: 14pt;
  color: #0f2b46;
  margin-bottom: 2mm;
}
.subtitle {
  text-align: center;
  font-size: 9pt;
  color: #666;
  margin-bottom: 5mm;
}
.block {
  margin-bottom: 4mm;
  page-break-inside: avoid;
}
.block-title {
  background: #0f2b46;
  color: white;
  padding: 2mm 4mm;
  font-size: 10pt;
  font-weight: 700;
  border-radius: 3px 3px 0 0;
}
table {
  width: 100%;
  border-collapse: collapse;
  border: 1pt solid #ddd;
  border-top: none;
}
th {
  background: #e3f2fd;
  font-size: 8pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #0f2b46;
  padding: 1.5mm 3mm;
  text-align: left;
  border-bottom: 1pt solid #bbdefb;
}
td {
  padding: 1.5mm 3mm;
  border-bottom: 0.5pt solid #eee;
  vertical-align: top;
  font-size: 9pt;
}
tr:nth-child(even) td { background: #fafafa; }
.col-de { width: 28%; font-weight: 600; color: #0f2b46; }
.col-ru { width: 32%; }
.col-ex { width: 40%; font-style: italic; color: #616161; font-size: 8.5pt; }
.summary { margin-top: 4mm; }
.summary table { font-size: 8.5pt; }
.summary td, .summary th { padding: 1mm 3mm; }
.footer {
  text-align: center;
  color: #999;
  font-size: 7pt;
  margin-top: 4mm;
  padding-top: 2mm;
  border-top: 0.5pt solid #eee;
}
"""


def main():
    parts = []
    total = 0

    for block in BLOCKS:
        n = len(block["words"])
        total += n
        rows = ""
        for de, ru, ex in block["words"]:
            rows += f"<tr><td class='col-de'>{escape(de)}</td><td class='col-ru'>{escape(ru)}</td><td class='col-ex'>{escape(ex)}</td></tr>\n"

        parts.append(f"""
        <div class="block">
          <div class="block-title">{escape(block['title'])} ({n})</div>
          <table>
            <tr><th class="col-de">Deutsch</th><th class="col-ru">Русский</th><th class="col-ex">Пример из команд</th></tr>
            {rows}
          </table>
        </div>
        """)

    summary_rows = ""
    for block in BLOCKS:
        n = len(block["words"])
        title = block["title"]
        summary_rows += f"<tr><td>{escape(title)}</td><td style='text-align:center'>{n}</td></tr>\n"
    summary_rows += f"<tr style='font-weight:700'><td>Итого / Gesamt</td><td style='text-align:center'>{total}</td></tr>"

    body = "\n".join(parts)

    html = f"""<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><style>{CSS}</style></head>
<body>
<h1>SBF Binnen — Wortschatz f\u00fcr die praktische Pr\u00fcfung</h1>
<div class="subtitle">Словарь для практического экзамена (Motor + Segeln) — {total} слов / W\u00f6rter</div>

{body}

<div class="block summary">
  <div class="block-title">Сводка / Zusammenfassung</div>
  <table>
    <tr><th>Блок / Block</th><th style="text-align:center">Кол-во</th></tr>
    {summary_rows}
  </table>
</div>

<div class="footer">SBF Binnen — Wortschatz praktische Pr\u00fcfung (Motor + Segeln) — DE / RU</div>
</body>
</html>"""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    html_path = OUTPUT_DIR / "practice-vocabulary.html"
    html_path.write_text(html, encoding="utf-8")

    pdf_path = OUTPUT_DIR / "practice-vocabulary.pdf"

    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="networkidle")
        page.pdf(
            path=str(pdf_path),
            format="A4",
            landscape=False,
            margin={"top": "10mm", "bottom": "10mm", "left": "10mm", "right": "10mm"},
            print_background=True,
        )
        browser.close()

    print(f"HTML \u2192 {html_path}")
    print(f"PDF  \u2192 {pdf_path}")


if __name__ == "__main__":
    main()
