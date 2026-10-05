#!/usr/bin/env python3
"""
Build Quizlet-ready vocabulary and tutor brief from the SBF Binnen exam questions.

Curated ~250 headwords grouped into thematic blocks, with Russian translations
and example sentences drawn directly from the exam questions.
"""

import json
from pathlib import Path

QUESTIONS_PATH = Path(__file__).resolve().parent.parent / "src" / "data" / "questions.json"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "print"

# ──────────────────────────────────────────────────────────────────────
# CURATED VOCABULARY — grouped by thematic block for the tutor curriculum
# Format: (german_headword, russian_translation, tags[])
#
# Tags: N=nautical, V=verb, R=rule/regulation, S=signal/sign, W=weather,
#       E=equipment, M=maneuver, C=color/visual, P=people/roles
# ──────────────────────────────────────────────────────────────────────

VOCAB_BLOCKS = {
    "Block 1 — Судно и его части / Fahrzeug und seine Teile": [
        ("das Fahrzeug", "судно, транспортное средство", ["N"]),
        ("das Kleinfahrzeug", "малое судно (до 20 м)", ["N"]),
        ("das Sportboot", "прогулочное/спортивное судно", ["N"]),
        ("das Segelboot", "парусная лодка", ["N"]),
        ("das Motorboot", "моторная лодка", ["N"]),
        ("das Boot", "лодка", ["N"]),
        ("das Schiff", "корабль, судно", ["N"]),
        ("das Großfahrzeug", "большое судно", ["N"]),
        ("das Segelfahrzeug", "парусное судно", ["N"]),
        ("der Verband", "состав судов (буксирный, толкаемый)", ["N"]),
        ("der Schleppverband", "буксирный состав", ["N"]),
        ("der Bug", "нос судна", ["N"]),
        ("das Heck", "корма судна", ["N"]),
        ("Backbord", "левый борт", ["N"]),
        ("Steuerbord", "правый борт", ["N"]),
        ("die Backbordseite", "левая сторона судна", ["N"]),
        ("die Steuerbordseite", "правая сторона судна", ["N"]),
        ("der Mast", "мачта", ["N"]),
        ("der Kiel", "киль", ["N"]),
        ("das Ruder", "руль", ["N"]),
        ("das Steuer", "штурвал, руль", ["N"]),
        ("das Deck", "палуба", ["N"]),
        ("der Bord", "борт", ["N"]),
        ("das Großsegel", "грот (главный парус)", ["N"]),
        ("die Fock", "стаксель (передний парус)", ["N"]),
        ("die Leine", "швартовый трос, линь", ["N"]),
        ("das Tau", "канат, трос", ["N"]),
        ("der Anker", "якорь", ["N"]),
        ("die Antriebsmaschine", "двигатель (привод)", ["N"]),
        ("der Maschinenantrieb", "машинный привод", ["N"]),
        ("die Länge", "длина", ["N"]),
        ("der Tiefgang", "осадка судна", ["N"]),
    ],

    "Block 2 — Водные пути / Wasserstraßen": [
        ("die Wasserstraße", "водный путь", ["N"]),
        ("die Binnenschifffahrtsstraße", "внутренний водный путь", ["N", "R"]),
        ("das Fahrwasser", "фарватер, судовой ход", ["N"]),
        ("die Fahrrinne", "судоходный канал", ["N"]),
        ("die Fahrrinnenseite", "сторона судоходного канала", ["N"]),
        ("die Nebenwasserstraße", "второстепенный водный путь", ["N"]),
        ("der Hafen", "порт, гавань", ["N"]),
        ("die Schleuse", "шлюз", ["N"]),
        ("der Kanal", "канал", ["N"]),
        ("der Fluss", "река", ["N"]),
        ("der Strom", "течение; большая река", ["N"]),
        ("die Strömung", "течение (воды)", ["N"]),
        ("das Ufer", "берег", ["N"]),
        ("der See", "озеро (der); море (die See)", ["N"]),
        ("die Boje", "буй", ["N"]),
        ("die Tonne", "бакен, навигационный знак", ["N"]),
        ("die Bake", "створный знак", ["N"]),
        ("das Leuchtfeuer", "навигационный огонь, маяк", ["N"]),
    ],

    "Block 3 — Движение и маневры / Fahrt und Manöver": [
        ("die Fahrt", "движение, ход, рейс", ["N", "M"]),
        ("die Geschwindigkeit", "скорость", ["N"]),
        ("der Kurs", "курс", ["N"]),
        ("die Kursänderung", "изменение курса", ["N", "M"]),
        ("die Fahrtrichtung", "направление движения", ["N"]),
        ("die Richtung", "направление", ["N"]),
        ("die Bergfahrt", "движение вверх по течению", ["N", "M"]),
        ("die Talfahrt", "движение вниз по течению", ["N", "M"]),
        ("die Rückwärtsfahrt", "задний ход", ["N", "M"]),
        ("die Vorbeifahrt", "проход мимо", ["N", "M"]),
        ("die Durchfahrt", "проход, проезд", ["N", "M"]),
        ("ausweichen", "уступать дорогу, уклоняться", ["V", "M"]),
        ("überholen", "обгонять", ["V", "M"]),
        ("begegnen", "встречаться (о судах)", ["V", "M"]),
        ("kreuzen", "пересекать (курс)", ["V", "M"]),
        ("anlegen", "причаливать, швартоваться", ["V", "M"]),
        ("ablegen", "отчаливать", ["V", "M"]),
        ("festmachen", "швартоваться (привязывать)", ["V", "M"]),
        ("ankern", "стоять на якоре", ["V", "M"]),
        ("stillliegen", "стоять (о судне, без хода)", ["V", "M"]),
        ("wenden", "разворачиваться", ["V", "M"]),
        ("drehen", "поворачивать", ["V", "M"]),
        ("manövrieren", "маневрировать", ["V", "M"]),
        ("manövrierunfähig", "неуправляемый (о судне)", ["M"]),
        ("der Kollisionskurs", "курс столкновения", ["N", "M"]),
        ("der Gegenverkehr", "встречное движение", ["N", "M"]),
        ("der Abstand", "дистанция, расстояние", ["N"]),
        ("ausweichpflichtig", "обязан уступить дорогу", ["M", "R"]),
        ("der Vorrang", "преимущество, приоритет", ["R", "M"]),
    ],

    "Block 4 — Парусный спорт / Segeln": [
        ("das Segel", "парус", ["N"]),
        ("segeln", "ходить под парусом", ["V"]),
        ("der Wind", "ветер", ["W"]),
        ("Luv", "наветренная сторона", ["N"]),
        ("Lee", "подветренная сторона", ["N"]),
        ("der Vorwindkurs", "курс по ветру (фордевинд)", ["N"]),
        ("der Halbwindkurs", "курс галфвинд (полветра)", ["N"]),
        ("der Amwindkurs", "курс бейдевинд (против ветра)", ["N"]),
        ("die Krängung", "крен (судна)", ["N"]),
        ("kentern", "опрокинуться, перевернуться", ["V"]),
        ("die Bö", "шквал, порыв ветра", ["W"]),
        ("reffen", "брать рифы (уменьшать парус)", ["V"]),
        ("bergen", "убирать (парус); спасать", ["V"]),
        ("halsen", "делать поворот фордевинд", ["V", "M"]),
        ("die Halse", "поворот фордевинд", ["N", "M"]),
        ("die Wende", "поворот оверштаг", ["N", "M"]),
        ("achtern", "на корме, позади", ["N"]),
        ("voraus", "впереди (по курсу)", ["N"]),
        ("querab", "на траверзе", ["N"]),
        ("dwars", "поперёк, на траверзе", ["N"]),
    ],

    "Block 5 — Правила и регулирование / Regeln und Vorschriften": [
        ("die Verordnung", "постановление, предписание", ["R"]),
        ("die Ordnung", "порядок, правила", ["R"]),
        ("die Vorschrift", "предписание, правило", ["R"]),
        ("der Geltungsbereich", "область действия (закона)", ["R"]),
        ("die Binnenschiffsuntersuchungsordnung", "правила освидетельствования судов", ["R"]),
        ("der Sportbootführerschein", "удостоверение на управление спортивным судном", ["R", "P"]),
        ("der Schiffsführer", "капитан, судоводитель", ["P"]),
        ("die Zulassung", "допуск, разрешение", ["R"]),
        ("die Kennzeichnung", "маркировка, обозначение", ["R"]),
        ("gestattet", "разрешено, допустимо", ["R"]),
        ("verboten", "запрещено", ["R"]),
        ("erlaubt", "разрешено", ["R"]),
        ("das Verbot", "запрет", ["R"]),
        ("die Pflicht", "обязанность", ["R"]),
        ("die Genehmigung", "разрешение, одобрение", ["R"]),
        ("die Verantwortung", "ответственность", ["R"]),
        ("verantwortlich", "ответственный", ["R"]),
        ("verpflichtet", "обязан", ["R"]),
        ("die Sorgfaltspflicht", "обязанность проявлять осторожность", ["R"]),
        ("die Wasserschutzpolizei", "водная полиция", ["R", "P"]),
        ("das Fahrtenbuch", "бортовой журнал", ["R"]),
        ("die Untersuchungskommission", "комиссия по расследованию", ["R"]),
    ],

    "Block 6 — Знаки и сигналы / Zeichen und Signale": [
        ("das Tafelzeichen", "навигационный щит, знак", ["S"]),
        ("das Sichtzeichen", "визуальный знак/сигнал", ["S"]),
        ("das Schallsignal", "звуковой сигнал", ["S"]),
        ("das Zeichen", "знак", ["S"]),
        ("die Bedeutung", "значение", ["S"]),
        ("bedeuten", "означать", ["V", "S"]),
        ("bedeutet", "означает", ["V", "S"]),
        ("das Licht", "огонь, свет", ["S", "C"]),
        ("die Lichter", "огни", ["S", "C"]),
        ("das Rundumlicht", "круговой огонь", ["S"]),
        ("die Seitenlichter", "бортовые огни", ["S"]),
        ("das Topplicht", "топовый огонь", ["S"]),
        ("das Hecklicht", "кормовой огонь", ["S"]),
        ("das Funkellicht", "проблесковый огонь", ["S"]),
        ("die Flagge", "флаг", ["S"]),
        ("der Wimpel", "вымпел", ["S"]),
        ("der Signalkörper", "сигнальная фигура", ["S"]),
        ("der Kegel", "конус (сигнальная фигура)", ["S"]),
        ("der Ball", "шар (сигнальная фигура)", ["S"]),
        ("der Zylinder", "цилиндр (сигнальная фигура)", ["S"]),
    ],

    "Block 7 — Цвета и визуальные описания / Farben und Sichtbarkeit": [
        ("rot", "красный", ["C"]),
        ("grün", "зелёный", ["C"]),
        ("weiß", "белый", ["C"]),
        ("gelb", "жёлтый", ["C"]),
        ("blau", "синий, голубой", ["C"]),
        ("schwarz", "чёрный", ["C"]),
        ("hell", "яркий, светлый", ["C"]),
        ("dunkel", "тёмный", ["C"]),
        ("sichtbar", "видимый", ["C"]),
        ("unsichtbar", "невидимый", ["C"]),
        ("die Sicht", "видимость", ["C", "W"]),
        ("die Sichtweite", "дальность видимости", ["C"]),
        ("übereinander", "один над другим", ["C"]),
        ("nebeneinander", "рядом, бок о бок", ["C"]),
    ],

    "Block 8 — Безопасность и спасение / Sicherheit und Rettung": [
        ("die Gefahr", "опасность", ["E"]),
        ("gefährlich", "опасный", ["E"]),
        ("die Rettungsweste", "спасательный жилет", ["E"]),
        ("die Schwimmweste", "плавательный жилет", ["E"]),
        ("das Rettungsmittel", "спасательное средство", ["E"]),
        ("der Rettungsring", "спасательный круг", ["E"]),
        ("der Feuerlöscher", "огнетушитель", ["E"]),
        ("die Hilfe", "помощь", ["E"]),
        ("die Notlage", "аварийная ситуация", ["E"]),
        ("der Notruf", "сигнал бедствия", ["E"]),
        ("der Notfall", "экстренный случай", ["E"]),
        ("sinken", "тонуть", ["V"]),
        ("gesunken", "затонувший", ["V"]),
        ("retten", "спасать", ["V"]),
        ("bergen", "поднимать (из воды), спасать", ["V"]),
        ("die Kollision", "столкновение", ["E"]),
        ("der Unfall", "несчастный случай, авария", ["E"]),
        ("kentern", "перевернуться (о судне)", ["V"]),
        ("das Leck", "течь, пробоина", ["N"]),
        ("die Grundberührung", "касание дна", ["N"]),
    ],

    "Block 9 — Погода и вода / Wetter und Wasser": [
        ("der Wellenschlag", "волнение (от прохождения судна)", ["W", "N"]),
        ("die Welle", "волна", ["W"]),
        ("der Sog", "присасывание, тяга (от судна)", ["W", "N"]),
        ("die Bö", "шквал", ["W"]),
        ("der Sturm", "шторм", ["W"]),
        ("das Gewitter", "гроза", ["W"]),
        ("der Nebel", "туман", ["W"]),
        ("die Temperatur", "температура", ["W"]),
        ("das Hochwasser", "паводок, высокая вода", ["W"]),
        ("das Niedrigwasser", "низкая вода", ["W"]),
        ("die Wassertiefe", "глубина воды", ["W"]),
        ("die Unterkühlung", "переохлаждение", ["W", "E"]),
    ],

    "Block 10 — Ключевые глаголы / Wichtige Verben": [
        ("vermeiden", "избегать", ["V"]),
        ("beachten", "соблюдать, обращать внимание", ["V"]),
        ("verhalten (sich)", "вести себя", ["V"]),
        ("führen", "управлять, вести", ["V"]),
        ("fahren", "ехать, двигаться (по воде)", ["V"]),
        ("gelten", "действовать, быть действительным", ["V"]),
        ("bestimmen", "определять, устанавливать", ["V"]),
        ("einhalten", "соблюдать", ["V"]),
        ("verringern", "уменьшать, снижать", ["V"]),
        ("vermindern", "уменьшать", ["V"]),
        ("erhöhen", "увеличивать, повышать", ["V"]),
        ("behindern", "препятствовать, мешать", ["V"]),
        ("gefährden", "подвергать опасности", ["V"]),
        ("anzeigen", "показывать, указывать; сообщать", ["V"]),
        ("kennzeichnen", "обозначать, маркировать", ["V"]),
        ("erkennen", "распознавать", ["V"]),
        ("befahren", "плыть по (водному пути)", ["V"]),
        ("einfahren", "входить (в шлюз, порт)", ["V"]),
        ("ausfahren", "выходить (из шлюза, порта)", ["V"]),
        ("vorbeifahren", "проходить мимо", ["V"]),
        ("heranfahren", "подходить, приближаться", ["V"]),
        ("umkehren", "разворачиваться", ["V"]),
        ("unterlassen", "воздерживаться от", ["V"]),
        ("verursachen", "причинять", ["V"]),
    ],

    "Block 11 — Направления и позиции / Richtungen und Positionen": [
        ("rechts", "справа, направо", []),
        ("links", "слева, налево", []),
        ("vorne", "впереди", []),
        ("hinten", "сзади", []),
        ("oben", "вверху, наверху", []),
        ("unten", "внизу", []),
        ("quer", "поперёк", []),
        ("längs", "вдоль", []),
        ("voraus", "впереди по курсу", ["N"]),
        ("achtern", "на корме, позади", ["N"]),
        ("mittschiffs", "на миделе (посередине судна)", ["N"]),
        ("seitlich", "сбоку, боковой", []),
        ("gegenüber", "напротив", []),
        ("außerhalb", "за пределами, снаружи", []),
        ("innerhalb", "в пределах, внутри", []),
        ("stromaufwärts", "вверх по течению", ["N"]),
        ("stromabwärts", "вниз по течению", ["N"]),
    ],

    "Block 12 — Прилагательные из экзамена / Prüfungsadjektive": [
        ("ausweichpflichtig", "обязанный уступить дорогу", ["R"]),
        ("frei", "свободный", []),
        ("empfohlen", "рекомендуемый", []),
        ("gesperrt", "закрытый, перекрытый", []),
        ("eingeschränkt", "ограниченный", []),
        ("stillstehend", "неподвижный", []),
        ("treibend", "дрейфующий", []),
        ("schwimmend", "плавающий", []),
        ("befestigt", "закреплённый", []),
        ("geladen", "гружёный", []),
        ("gesunken", "затонувший", []),
        ("sicher", "безопасный", []),
        ("dicht", "плотный; близко", []),
        ("möglich", "возможный", []),
        ("nötig", "необходимый", []),
        ("sofort", "немедленно", []),
        ("gleichzeitig", "одновременно", []),
    ],

    "Block 13 — Существительные из правил / Regelwerk-Substantive": [
        ("die Seite", "сторона", []),
        ("die Stelle", "место, позиция", []),
        ("der Bereich", "область, зона", []),
        ("die Arbeit", "работа", []),
        ("die Stoffe", "вещества, материалы", []),
        ("der Teil", "часть", []),
        ("die Nacht", "ночь", []),
        ("der Tag", "день", []),
        ("das Jahr", "год", []),
        ("die Anlage", "сооружение, установка", []),
        ("der Verkehr", "движение, транспорт", ["N"]),
        ("das Gerät", "прибор, устройство", []),
        ("die Schifffahrt", "судоходство", ["N"]),
        ("die Besatzung", "экипаж", ["N", "P"]),
        ("die Ladung", "груз", ["N"]),
        ("die Mannschaft", "команда, экипаж", ["P"]),
    ],
}


def find_example_sentence(word, questions):
    """Find the best (shortest, clearest) example sentence pair containing the word."""
    word_lower = word.lower()
    candidates = []

    for q in questions:
        if word_lower in q["question_de"].lower():
            candidates.append({"de": q["question_de"], "ru": q["question_ru"], "q_id": q["id"]})
        for opt in q["options"]:
            if word_lower in opt["de"].lower():
                candidates.append({"de": opt["de"], "ru": opt["ru"], "q_id": q["id"]})

    if not candidates:
        return None

    candidates.sort(key=lambda c: len(c["de"]))
    return candidates[0]


def strip_article(word: str) -> str:
    for prefix in ("der ", "die ", "das "):
        if word.startswith(prefix):
            return word[len(prefix):]
    return word


def main():
    with open(QUESTIONS_PATH, encoding="utf-8") as f:
        questions = json.load(f)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    quizlet_lines = []
    all_entries = []
    block_stats = {}

    for block_name, words in VOCAB_BLOCKS.items():
        block_entries = []
        for de_word, ru_translation, tags in words:
            search_term = strip_article(de_word).split("(")[0].strip().split(",")[0].strip()
            example = find_example_sentence(search_term, questions)

            entry = {
                "de": de_word,
                "ru": ru_translation,
                "tags": tags,
                "block": block_name,
                "example_de": example["de"] if example else "",
                "example_ru": example["ru"] if example else "",
                "example_q_id": example["q_id"] if example else None,
            }
            block_entries.append(entry)
            all_entries.append(entry)

            front = de_word
            back_parts = [ru_translation]
            if example:
                de_short = example["de"]
                ru_short = example["ru"]
                if len(de_short) > 100:
                    de_short = de_short[:97] + "..."
                if len(ru_short) > 100:
                    ru_short = ru_short[:97] + "..."
                back_parts.append(f"📝 {de_short}")
                back_parts.append(f"→ {ru_short}")
            back = " | ".join(back_parts)
            quizlet_lines.append(f"{front}\t{back}")

        block_stats[block_name] = len(block_entries)

    quizlet_path = OUTPUT_DIR / "sbf-binnen-vocabulary-quizlet.txt"
    with open(quizlet_path, "w", encoding="utf-8") as f:
        f.write("\n".join(quizlet_lines))

    json_path = OUTPUT_DIR / "sbf-binnen-vocabulary-full.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)

    tutor_lines = []
    tutor_lines.append("# SBF Binnen — Учебный план для подготовки к теоретическому экзамену")
    tutor_lines.append("# SBF Binnen — Lernplan für die theoretische Prüfung\n")
    tutor_lines.append("## Контекст / Kontext\n")
    tutor_lines.append("Дима готовится к теоретическому экзамену на Sportbootführerschein Binnen (SBF Binnen) — ")
    tutor_lines.append("удостоверение на управление прогулочным судном на внутренних водных путях Германии.")
    tutor_lines.append("Экзамен состоит из 30 вопросов (из 300 возможных), на немецком языке, формат — множественный выбор.")
    tutor_lines.append("Текущий уровень немецкого: A1 → A2. Экзамен запланирован примерно на середину мая 2026.\n")
    tutor_lines.append("Dima bereitet sich auf die theoretische Prüfung für den Sportbootführerschein Binnen (SBF Binnen) vor — ")
    tutor_lines.append("einen Führerschein für Sportboote auf Binnenschifffahrtsstraßen.")
    tutor_lines.append("Die Prüfung besteht aus 30 Fragen (aus 300 möglichen), auf Deutsch, im Multiple-Choice-Format.")
    tutor_lines.append("Aktuelles Deutschniveau: A1 → A2. Prüfung geplant ca. Mitte Mai 2026.\n")

    tutor_lines.append("---\n")
    tutor_lines.append("## Рекомендации для преподавателя / Empfehlungen für die Lehrerin\n")
    tutor_lines.append("### Как использовать этот материал / Wie dieses Material verwenden\n")
    tutor_lines.append("1. **Каждую неделю — 1 блок** из списка ниже (~15-25 слов). За 8 недель — все блоки.")
    tutor_lines.append("2. **На уроке:** разбирать слова в контексте предложений из экзамена (примеры указаны).")
    tutor_lines.append("3. **Домашнее задание:** Quizlet-карточки по текущему блоку + упражнения ниже.")
    tutor_lines.append("4. **Формат экзамена:** вопрос + 4 варианта ответа. Ключевой навык — понимание различий между похожими ответами.\n")
    tutor_lines.append("### Типы упражнений / Übungstypen\n")
    tutor_lines.append("- **Lückentext (заполни пропуски):** предложения из экзамена с пропущенными ключевыми словами")
    tutor_lines.append("- **Zuordnung (соотнесение):** термин ↔ определение; знак ↔ значение")
    tutor_lines.append("- **Richtig/Falsch (верно/неверно):** утверждения о правилах судоходства")
    tutor_lines.append("- **Mündliche Beschreibung (устное описание):** описать ситуацию на воде, используя термины")
    tutor_lines.append("- **Paraphrase (перефразирование):** объяснить правило своими словами")
    tutor_lines.append("- **Prüfungssimulation (симуляция экзамена):** разбирать реальные вопросы вместе\n")

    tutor_lines.append("### Что было бы ценно узнать от преподавателя / Input von der Lehrerin\n")
    tutor_lines.append("- Какие грамматические конструкции Дима уже усвоил? (падежи, времена, модальные глаголы)")
    tutor_lines.append("- С какими типами предложений возникают трудности? (придаточные, пассив, сослагательное)")
    tutor_lines.append("- Рекомендуемый темп — реалистично ли 1 блок в неделю для домашней работы?")
    tutor_lines.append("- Есть ли предпочтения по формату домашних заданий?\n")

    tutor_lines.append("---\n")
    tutor_lines.append("## Предлагаемый план на 8 недель / Vorgeschlagener 8-Wochen-Plan\n")

    block_names = list(VOCAB_BLOCKS.keys())
    week_plan = [
        (1, [0, 1], "Судно и водные пути — базовая лексика"),
        (2, [2], "Движение и маневры — глаголы действия"),
        (3, [3], "Парусный спорт — специальная лексика"),
        (4, [4, 5], "Правила, знаки и сигналы"),
        (5, [6, 7], "Цвета, видимость и безопасность"),
        (6, [8, 9], "Погода и ключевые глаголы"),
        (7, [10, 11], "Направления и прилагательные"),
        (8, [12], "Повторение + симуляция экзамена"),
    ]

    for week_num, block_indices, description in week_plan:
        blocks = [block_names[i] for i in block_indices if i < len(block_names)]
        word_count = sum(block_stats.get(b, 0) for b in blocks)
        tutor_lines.append(f"### Неделя {week_num} — {description}")
        tutor_lines.append(f"**Woche {week_num}** | ~{word_count} слов\n")
        for b in blocks:
            tutor_lines.append(f"- {b}")
        tutor_lines.append("")

    tutor_lines.append("---\n")
    tutor_lines.append("## Словарь по блокам / Wortschatz nach Blöcken\n")

    for block_name, words in VOCAB_BLOCKS.items():
        tutor_lines.append(f"### {block_name}\n")
        tutor_lines.append("| Deutsch | Русский | Пример из экзамена |")
        tutor_lines.append("|---|---|---|")

        for entry in all_entries:
            if entry["block"] == block_name:
                ex = ""
                if entry["example_de"]:
                    ex_de = entry["example_de"]
                    if len(ex_de) > 80:
                        ex_de = ex_de[:77] + "..."
                    ex = f"*{ex_de}*"
                de = entry["de"].replace("|", "\\|")
                ru = entry["ru"].replace("|", "\\|")
                ex = ex.replace("|", "\\|")
                tutor_lines.append(f"| {de} | {ru} | {ex} |")

        tutor_lines.append("")

    tutor_lines.append("---\n")
    tutor_lines.append(f"**Всего слов / Gesamtzahl:** {len(all_entries)}")
    tutor_lines.append(f"**Блоков / Blöcke:** {len(VOCAB_BLOCKS)}")
    tutor_lines.append(f"**Источник:** 300 вопросов SBF Binnen Fragenkatalog")

    tutor_path = OUTPUT_DIR / "sbf-binnen-tutor-brief.md"
    with open(tutor_path, "w", encoding="utf-8") as f:
        f.write("\n".join(tutor_lines))

    print(f"Total vocabulary entries: {len(all_entries)}")
    print(f"Blocks: {len(VOCAB_BLOCKS)}")
    print()
    for name, count in block_stats.items():
        print(f"  {name}: {count} words")
    print()

    with_examples = sum(1 for e in all_entries if e["example_de"])
    print(f"Entries with exam examples: {with_examples}/{len(all_entries)}")
    print()
    print(f"Quizlet file: {quizlet_path}")
    print(f"Tutor brief:  {tutor_path}")
    print(f"Full JSON:    {json_path}")


if __name__ == "__main__":
    main()
