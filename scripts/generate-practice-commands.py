#!/usr/bin/env python3
"""Generate a printable DE-RU PDF with practical exam commands for Motor and Sailing."""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import List, Dict

OUTPUT_DIR = Path(__file__).resolve().parent.parent / "print"

LQ = "\u201e"  # German opening low-9 quote
RQ = "\u201c"  # German closing quote
LAQ = "\u00ab"  # Russian opening guillemet
RAQ = "\u00bb"  # Russian closing guillemet


def motor_commands() -> Dict:
    return {
        "section": "MOTOR \u2014 \u041f\u0440\u0430\u043a\u0442\u0438\u0447\u0435\u0441\u043a\u0438\u0439 \u044d\u043a\u0437\u0430\u043c\u0435\u043d / Praktische Pr\u00fcfung",
        "maneuvers": [
            {
                "title_de": "Hinweise",
                "title_ru": "\u0423\u043a\u0430\u0437\u0430\u043d\u0438\u044f",
                "steps": [
                    {"type": "note", "de": "Keine Vollgasmanöver am Steg.", "ru": "Никаких манёвров на полном газу у причала."},
                    {"type": "note", "de": "Je nach Wind reicht meistens eine geringe Drehzahl.", "ru": "В зависимости от ветра обычно достаточно малых оборотов."},
                    {"type": "note", "de": "Grün = Kommandos vom Rudergänger (auf Deutsch!).", "ru": "Зелёный = команды рулевого (на немецком!)."},
                    {"type": "note", "de": "Rot = Kommandos von Crew oder Prüfer.", "ru": "Красный = команды экипажа или экзаменатора."},
                    {"type": "note", "de": "Grau = Hinweise zur Manöverausführung.", "ru": "Серый = инструкции по выполнению манёвра."},
                ],
            },
            {
                "title_de": "Ablegen",
                "title_ru": "Отход от причала",
                "steps": [
                    {"type": "helmsman",
                     "de": f"Klar zum Ablegen mit dem Manöver {LQ}Eindampfen in die Vorspring{RQ}?\nBug abfendern! Vorspring auf Slip, alle anderen Leinen los!",
                     "ru": f"Готовы к отходу манёвром {LAQ}работа на носовой шпринг{RAQ}?\nОтвести нос! Носовой шпринг на слип, остальные концы отдать!"},
                    {"type": "crew", "de": "Fender & Leinen klar!", "ru": "Кранцы и концы готовы!"},
                    {"type": "instruction",
                     "de": "Zum Steg einlenken; Vorwärtsgang einlegen = Eindampfen in die Vorspring.\nHeck dreht sich vom Steg weg; Leerlauf; Gegenlenken; achtern Rundumblick ob Freiraum.",
                     "ru": "Руль к причалу; включить передний ход = работа на носовой шпринг.\nКорма отходит от причала; нейтраль; контр-руление; осмотр позади — свободно ли."},
                    {"type": "helmsman", "de": "Achtern frei! Vorspring los!", "ru": "Позади свободно! Носовой шпринг отдать!"},
                    {"type": "crew", "de": "Vorspring ist los.", "ru": "Носовой шпринг отдан."},
                    {"type": "instruction", "de": "Rückwärtsfahrt; dabei Rundumblick.", "ru": "Задний ход; круговой обзор."},
                ],
            },
            {
                "title_de": "Anlegen",
                "title_ru": "Швартовка к причалу",
                "steps": [
                    {"type": "helmsman",
                     "de": "Klar zum Anlegen am Steg / Ufer an Steuerbord / Backbord?\nLeinen und Fender klarmachen an Steuerbord / Backbord!",
                     "ru": "Готовы к швартовке к причалу / берегу по правому / левому борту?\nПриготовить концы и кранцы по правому / левому борту!"},
                    {"type": "crew", "de": "Alles klar an Steuerbord / Backbord.", "ru": "Всё готово по правому / левому борту."},
                    {"type": "instruction",
                     "de": "Im spitzen Winkel auf den Steg zufahren, 1\u20131,5 m vor dem Steg auskuppeln, komplett zum Steg lenken: Rückwärtsgang zum Aufstoppen; Heck wird zum Steg gezogen.",
                     "ru": "Подходить к причалу под острым углом, за 1\u20131,5 м выключить передачу, руль полностью к причалу: задний ход для остановки; корму притягивает к причалу."},
                    {"type": "helmsman", "de": "Leinen über, das Boot festmachen!", "ru": "Подать концы, закрепить судно!"},
                    {"type": "crew", "de": "Leinen sind fest.", "ru": "Концы закреплены."},
                ],
            },
            {
                "title_de": "Kursfahren nach Objekten / Kompass",
                "title_ru": "Курс по ориентирам / компасу",
                "steps": [
                    {"type": "examiner", "de": "z.B.: Nehmen Sie Kurs in Richtung Fernsehturm / 3-0-0 Grad auf!", "ru": "Напр.: Возьмите курс на телебашню / 3-0-0 градусов!"},
                    {"type": "helmsman", "de": "Nehme Kurs auf in Richtung Fernsehturm / 3-0-0 Grad.", "ru": "Беру курс на телебашню / 3-0-0 градусов."},
                    {"type": "instruction", "de": "Kurs aufnehmen. Wenn der Kurs anliegt:", "ru": "Взять курс. Когда курс установлен:"},
                    {"type": "helmsman", "de": "Kurs liegt an. / Kurs 3-0-0 Grad liegt an.", "ru": "Курс установлен. / Курс 3-0-0 градусов установлен."},
                ],
            },
            {
                "title_de": "Kursgerechtes Aufstoppen",
                "title_ru": "Остановка с удержанием курса",
                "steps": [
                    {"type": "instruction", "de": "Achtern Rundumblick ob Freiraum.", "ru": "Осмотр позади — свободно ли."},
                    {"type": "helmsman", "de": "Achtern frei!", "ru": "Позади свободно!"},
                    {"type": "instruction",
                     "de": "Auskuppeln; im Rückwärtsgang anhalten, bis das Boot keine Fahrt durch das Wasser macht.\nGgf. Windvertreibung durch Lenken ausgleichen, um kursgerecht stehenzubleiben.",
                     "ru": "Нейтраль; задний ход до полной остановки.\nПри необходимости компенсировать снос ветром рулением, чтобы остаться на курсе."},
                    {"type": "helmsman", "de": "Manöver beendet.", "ru": "Манёвр завершён."},
                ],
            },
            {
                "title_de": "Wende auf engem Raum über Steuerbord / Backbord",
                "title_ru": "Разворот в ограниченном пространстве через правый / левый борт",
                "steps": [
                    {"type": "instruction",
                     "de": "Komplett in Vorwärtsgang nach Steuerbord / Backbord lenken; auskuppeln.\nAchtern Rundumblick ob Freiraum.",
                     "ru": "Полностью вывернуть руль на правый / левый борт, передний ход; нейтраль.\nОсмотр позади — свободно ли."},
                    {"type": "helmsman", "de": "Achtern frei!", "ru": "Позади свободно!"},
                    {"type": "instruction",
                     "de": "Komplett zur anderen Seite einlenken; Blick nach Achtern; Rückwärtsgang.\nAbfolge wiederholen, bis Wende (180°) abgeschlossen ist und der Gegenkurs fahrend anliegt.",
                     "ru": "Руль полностью в другую сторону; смотреть назад; задний ход.\nПовторять, пока разворот (180°) не завершён и не лёг на обратный курс."},
                    {"type": "helmsman", "de": "Manöver beendet.", "ru": "Манёвр завершён."},
                ],
            },
            {
                "title_de": "Mann / Boje über Bord (MOB)",
                "title_ru": "Человек / буй за бортом (MOB)",
                "steps": [
                    {"type": "examiner", "de": "Mann / Boje über Bord an Steuerbord / Backbord!", "ru": "Человек / буй за бортом по правому / левому борту!"},
                    {"type": "instruction", "de": "Maschine sofort auskuppeln und voll zum MOB lenken.", "ru": "Немедленно нейтраль и полностью рулить к MOB."},
                    {"type": "helmsman",
                     "de": "Mann / Boje über Bord an Steuerbord / Backbord!\nMann / Boje im Blick behalten!\nMarkierungsmittel ausbringen, Rettungsmittel bereithalten!",
                     "ru": "Человек / буй за бортом по правому / левому борту!\nНе терять из виду!\nВыбросить маркер, приготовить спасательные средства!"},
                    {"type": "instruction",
                     "de": "Crewmitglieder direkt ansprechen. Position des MOB zeigen lassen.\nMit Wind und Welle vom MOB ca. 4 Bootslängen wegfahren.\nKurs zum MOB aufnehmen.",
                     "ru": "Обращаться к членам экипажа лично. Пусть показывают на MOB.\nОтойти по ветру и волне ~4 длины судна от MOB.\nВзять курс на MOB."},
                    {"type": "helmsman",
                     "de": "Nehme Fahrt gegen Wind und Welle auf.\nBereitmachen zum Bergen an Steuerbord / Backbord.",
                     "ru": "Иду против ветра и волны.\nПриготовиться к подъёму по правому / левому борту."},
                    {"type": "crew", "de": "Ist klar.", "ru": "Готовы."},
                    {"type": "instruction",
                     "de": "Wenn der MOB auf Höhe des Bugs ist, Rückwärtsgang einlegen, um mittschiffs neben dem MOB aufzustoppen; Maschine auskuppeln.",
                     "ru": "Когда MOB на уровне носа — задний ход, остановиться рядом с MOB на миделе; нейтраль."},
                    {"type": "helmsman", "de": "Maschine neutral.\nMann / Boje an Bord nehmen!", "ru": "Двигатель нейтраль.\nПринять человека / буй на борт!"},
                    {"type": "crew", "de": "Mann / Boje ist geborgen.", "ru": "Человек / буй поднят на борт."},
                ],
            },
            {
                "title_de": "Schallsignale zur Kursänderungen",
                "title_ru": "Звуковые сигналы при изменении курса",
                "steps": [
                    {"type": "note", "de": "Nach Steuerbord: \u201eein kurzer Ton\u201c \u25cf", "ru": "Направо (штирборт): \u00abодин короткий гудок\u00bb \u25cf"},
                    {"type": "note", "de": "Nach Backbord: \u201ezwei kurze Töne\u201c \u25cf \u25cf", "ru": "Налево (бакборт): \u00abдва коротких гудка\u00bb \u25cf \u25cf"},
                    {"type": "note", "de": "Maschine geht rückwärts: \u201edrei kurze Töne\u201c \u25cf \u25cf \u25cf", "ru": "Задний ход: \u00abтри коротких гудка\u00bb \u25cf \u25cf \u25cf"},
                ],
            },
        ],
    }


def sailing_commands() -> Dict:
    return {
        "section": "SEGELN \u2014 Практический экзамен / Praktische Prüfung",
        "maneuvers": [
            {
                "title_de": "Hinweise",
                "title_ru": "Указания",
                "steps": [
                    {"type": "note", "de": "In der Prüfung ist man abwechselnd der Rudergänger und der Vorschoter.", "ru": "На экзамене вы по очереди выступаете рулевым и шкотовым."},
                    {"type": "note", "de": "Im Gegensatz zur Motorprüfung sitzt der Prüfer nicht mit an Bord.", "ru": "В отличие от моторного экзамена, экзаменатор не находится на борту."},
                    {"type": "note", "de": "Grün = Kommandos vom Rudergänger (auf Deutsch!).", "ru": "Зелёный = команды рулевого (на немецком!)."},
                    {"type": "note", "de": "Rot = Hinweise vom Vorschoter.", "ru": "Красный = указания шкотового."},
                ],
            },
            {
                "title_de": "Wende",
                "title_ru": "Поворот оверштаг (Wende)",
                "steps": [
                    {"type": "helmsman", "de": "Klar zur Wende?", "ru": "Готовы к повороту оверштаг?"},
                    {"type": "bowman", "de": "Ist klar!", "ru": "Готов!"},
                    {"type": "helmsman", "de": "Ree!", "ru": "Ree! (Поворот!)"},
                    {"type": "instruction",
                     "de": "Anluven; Bug geht durch den Wind.\nRuder gerade, sobald Vorsegel back steht.",
                     "ru": "Приводиться; нос проходит через ветер.\nРуль прямо, как только стаксель заполаскивает на другой стороне."},
                    {"type": "helmsman", "de": "Vorsegel über!", "ru": "Стаксель на другой борт!"},
                ],
            },
            {
                "title_de": "Halse",
                "title_ru": "Поворот фордевинд (Halse)",
                "steps": [
                    {"type": "instruction",
                     "de": "Eine Halse sollte aus einem stabilen Raumwindkurs gefahren werden.\nGgf. Raumwindkurs aufnehmen (abfallen, Schoten fieren).",
                     "ru": "Фордевинд выполняется со стабильного курса бакштаг.\nПри необходимости лечь на бакштаг (увалиться, потравить шкоты)."},
                    {"type": "helmsman", "de": "Klar zur Halse?", "ru": "Готовы к повороту фордевинд?"},
                    {"type": "bowman", "de": "Ist klar!", "ru": "Готов!"},
                    {"type": "instruction", "de": "Großschot dichtholen, dabei sicheren Raumwindkurs halten.", "ru": "Выбрать грота-шкот, удерживая безопасный курс бакштаг."},
                    {"type": "helmsman", "de": "Rund achtern!", "ru": "Поворот через корму!"},
                    {"type": "instruction",
                     "de": "Abfallen; Heck geht durch den Wind.\nWenn Großsegel umschlägt, muss die Großschot zügig gefiert werden.\nDas Vorsegel wird vom Vorschoter übergeholt.",
                     "ru": "Увалиться; корма проходит через ветер.\nКогда грот перебросится — быстро потравить грота-шкот.\nШкотовый перебрасывает стаксель."},
                ],
            },
            {
                "title_de": "Schiften",
                "title_ru": "Перекладка парусов (Schiften)",
                "steps": [
                    {"type": "instruction",
                     "de": "Bedeutung: auf einem Vorwindkurs das Vorsegel und/oder Großsegel auf die jeweils andere Seite bewegen, ohne dabei den Kurs zu ändern.",
                     "ru": "Смысл: на курсе фордевинд перенести стаксель и/или грот на другой борт без изменения курса."},
                    {"type": "helmsman", "de": "Klar zum Schiften?", "ru": "Готовы к перекладке?"},
                    {"type": "bowman", "de": "Ist klar!", "ru": "Готов!"},
                    {"type": "instruction", "de": "Vorwindkurs halten.", "ru": "Держать курс фордевинд."},
                    {"type": "helmsman", "de": "Rund achtern!", "ru": "Поворот через корму!"},
                    {"type": "instruction",
                     "de": "In das Großschotbündel greifen und Großbaum herüberziehen.\nDas Vorsegel wird vom Vorschoter übergeholt.",
                     "ru": "Взяться за грота-шкот и перетянуть гик.\nШкотовый перебрасывает стаксель."},
                ],
            },
            {
                "title_de": "Mann / Boje über Bord (MOB) mit Q-Wende",
                "title_ru": "Человек / буй за бортом (MOB) — Q-поворот",
                "steps": [
                    {"type": "helmsman",
                     "de": "Mann / Boje über Bord an Steuerbord / Backbord!\nMann / Boje im Blick behalten!\nMarkierungsmittel ausbringen, Rettungsmittel bereithalten!\nLuve an / Falle ab / Bleibe auf \u2014 Halbwindkurs!",
                     "ru": "Человек / буй за бортом по правому / левому борту!\nНе терять из виду!\nВыбросить маркер, приготовить спасательные средства!\nПривестись / увалиться / оставаться \u2014 на галфвинде!"},
                    {"type": "instruction",
                     "de": "Crewmitglieder direkt ansprechen. Position des MOB zeigen lassen.\nSchoten dem neuen Kurs anpassen; ca. 5 Bootslängen wegfahren.",
                     "ru": "Обращаться к экипажу лично. Пусть показывают на MOB.\nШкоты под новый курс; отойти ~5 длин лодки."},
                    {"type": "helmsman", "de": "Klar zur Q-Wende?", "ru": "Готовы к Q-повороту?"},
                    {"type": "bowman", "de": "Ist klar.", "ru": "Готов."},
                    {"type": "helmsman", "de": "Ree!", "ru": "Ree! (Поворот!)"},
                    {"type": "instruction", "de": "Anluven; Bug geht durch den Wind.", "ru": "Приводиться; нос проходит через ветер."},
                    {"type": "helmsman", "de": "Vorsegel über! Neuer Kurs Halbwindkurs!", "ru": "Стаксель на другой борт! Новый курс — галфвинд!"},
                    {"type": "instruction", "de": "Schoten dem neuen Kurs anpassen.", "ru": "Шкоты под новый курс."},
                    {"type": "helmsman",
                     "de": "Klar zum Aufnehmen an Steuerbord / Backbord!\nKlarmachen zum Aufschießer!",
                     "ru": "Приготовиться к подъёму по правому / левому борту!\nПриготовиться к приведению в ветер!"},
                    {"type": "bowman", "de": "Ist klar.", "ru": "Готов."},
                    {"type": "instruction", "de": "In den Wind schießen.", "ru": "Привестись в ветер (Aufschießer)."},
                    {"type": "helmsman", "de": "Schoten los!\nMann / Boje an Bord nehmen!", "ru": "Шкоты раздёрнуть!\nПринять человека / буй на борт!"},
                ],
            },
            {
                "title_de": "Anlegen und Ablegen",
                "title_ru": "Швартовка и отход",
                "steps": [
                    {"type": "note",
                     "de": "Das Anlegen und Ablegen verläuft je nach Situation unterschiedlich. Wichtig sind klare Anweisungen bezüglich der Handhabung der Segel, Leinen und Fender sowie des Setzens und Bergens der Segel. Die Manöver müssen vorher mit der gesamten Crew ausführlich durchgesprochen werden.",
                     "ru": "Швартовка и отход зависят от ситуации. Важны чёткие указания по работе с парусами, концами и кранцами, а также по постановке и уборке парусов. Все манёвры должны быть подробно обговорены с экипажем заранее."},
                ],
            },
        ],
    }


ROLE_LABELS = {
    "helmsman": ("Rudergänger:", "Рулевой:"),
    "crew": ("Mannschaft:", "Экипаж:"),
    "examiner": ("Prüfer:", "Экзаменатор:"),
    "bowman": ("Vorschoter:", "Шкотовый:"),
}

ROLE_COLORS = {
    "helmsman": "#2e7d32",
    "crew": "#c62828",
    "examiner": "#c62828",
    "bowman": "#c62828",
    "instruction": "#616161",
    "note": "#455a64",
}


def build_step_html(step: Dict, lang: str) -> str:
    stype = step["type"]
    text = step["de"] if lang == "de" else step["ru"]
    text_html = text.replace("\n", "<br>")
    color = ROLE_COLORS.get(stype, "#333")

    if stype in ROLE_LABELS:
        label = ROLE_LABELS[stype][0 if lang == "de" else 1]
        return (
            f'<div class="step role-step" style="border-left-color: {color}">'
            f'<span class="role-label" style="color: {color}">{label}</span>'
            f'<div class="step-text command-text">{text_html}</div></div>'
        )
    elif stype == "instruction":
        return (
            f'<div class="step instruction-step">'
            f'<div class="step-text">{text_html}</div></div>'
        )
    else:
        return (
            f'<div class="step note-step">'
            f'<div class="step-text">{text_html}</div></div>'
        )


def build_maneuver_html(maneuver: Dict) -> str:
    de_steps = "\n".join(build_step_html(s, "de") for s in maneuver["steps"])
    ru_steps = "\n".join(build_step_html(s, "ru") for s in maneuver["steps"])

    return f"""
    <div class="maneuver">
      <div class="maneuver-header">
        <span class="maneuver-title-de">{maneuver['title_de']}</span>
        <span class="maneuver-title-ru">{maneuver['title_ru']}</span>
      </div>
      <div class="columns">
        <div class="col col-de">
          {de_steps}
        </div>
        <div class="divider"></div>
        <div class="col col-ru">
          {ru_steps}
        </div>
      </div>
    </div>
    """


CSS = """
@page {
  size: A4 portrait;
  margin: 8mm;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  color: #1a1a1a;
  line-height: 1.45;
  font-size: 9pt;
}

.section-header {
  background: #0f2b46;
  color: white;
  padding: 4mm 6mm;
  font-size: 13pt;
  font-weight: 700;
  margin-bottom: 3mm;
  page-break-after: avoid;
  page-break-before: always;
}

.section-header:first-child {
  page-break-before: auto;
}

.maneuver {
  margin-bottom: 4mm;
  border: 1pt solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  page-break-inside: avoid;
}

.maneuver-header {
  background: #e3f2fd;
  padding: 2.5mm 5mm;
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  border-bottom: 1pt solid #bbdefb;
}

.maneuver-title-de {
  font-weight: 700;
  font-size: 11pt;
  color: #0f2b46;
}

.maneuver-title-ru {
  font-style: italic;
  font-size: 10pt;
  color: #455a64;
}

.columns {
  display: flex;
}

.col {
  flex: 1;
  padding: 3mm 4mm;
}

.col-de {
  background: #fafafa;
}

.divider {
  width: 1pt;
  background: #e0e0e0;
}

.step {
  margin-bottom: 2mm;
}

.role-step {
  border-left: 2.5pt solid #ccc;
  padding-left: 3mm;
}

.role-label {
  font-weight: 700;
  font-size: 8pt;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: block;
  margin-bottom: 0.5mm;
}

.command-text {
  font-weight: 600;
}

.instruction-step {
  background: #f0f0f0;
  padding: 1.5mm 3mm;
  border-radius: 2px;
  font-size: 8.5pt;
  color: #616161;
}

.col-ru .instruction-step {
  background: #f5f5f5;
}

.note-step {
  padding: 1mm 3mm;
  font-size: 8.5pt;
  color: #455a64;
  font-style: italic;
}

.step-text {
  line-height: 1.4;
}

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
    sections = [motor_commands(), sailing_commands()]

    all_html_parts = []
    for section in sections:
        all_html_parts.append(f'<div class="section-header">{section["section"]}</div>')
        for maneuver in section["maneuvers"]:
            all_html_parts.append(build_maneuver_html(maneuver))

    body = "\n".join(all_html_parts)
    html = f"""<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><style>{CSS}</style></head>
<body>
{body}
<div class="footer">SBF Binnen \u2014 Kommandos f\u00fcr die praktische Pr\u00fcfung (Motor + Segeln) \u2014 DE / RU</div>
</body>
</html>"""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    html_path = OUTPUT_DIR / "practice-commands.html"
    html_path.write_text(html, encoding="utf-8")

    pdf_path = OUTPUT_DIR / "practice-commands.pdf"

    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="networkidle")
        page.pdf(
            path=str(pdf_path),
            format="A4",
            landscape=False,
            margin={"top": "8mm", "bottom": "8mm", "left": "8mm", "right": "8mm"},
            print_background=True,
        )
        browser.close()

    print(f"HTML saved \u2192 {html_path}")
    print(f"PDF saved  \u2192 {pdf_path}")


if __name__ == "__main__":
    main()
