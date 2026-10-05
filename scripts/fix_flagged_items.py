"""
Apply auto-fixable corrections from the LLM quality judge review.
Fixes: Russian translations, English translations, and highlight precision.
Skips: Explanation logic errors (require human domain expertise).
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import DATA_DIR, load_json, save_json, console

RU_PATH = DATA_DIR / "questions-ru.json"
EN_PATH = DATA_DIR / "questions-en.json"
HL_PATH = DATA_DIR / "highlights.json"

def fix_by_id(items, qid):
    return next((q for q in items if q["id"] == qid), None)


def apply_ru_fixes(ru_questions):
    fixes = 0

    # Q1: Schiffsführer -> судоводитель (throughout all questions, but only where contextually right)
    # This is a systematic issue - капитан -> судоводитель for Schiffsführer
    for q in ru_questions:
        for field in ["question_ru"] + [f"options_ru"]:
            if field == "question_ru":
                old = q.get(field, "")
                new = old.replace("капитаном судна", "судоводителем").replace("капитан судна", "судоводитель")
                if new != old:
                    q[field] = new
                    fixes += 1
            elif field == "options_ru":
                for i, opt in enumerate(q.get("options_ru", [])):
                    new = opt.replace("капитаном судна", "судоводителем").replace("капитан судна", "судоводитель")
                    if new != opt:
                        q["options_ru"][i] = new
                        fixes += 1

    # Q38: о удостоверении -> об удостоверении
    q38 = fix_by_id(ru_questions, 38)
    if q38:
        for i, opt in enumerate(q38.get("options_ru", [])):
            new = opt.replace("о удостоверении", "об удостоверении")
            if new != opt:
                q38["options_ru"][i] = new
                fixes += 1

    # Q19, Q145, Q146, Q148, Q150, Q155: "волн и зыби" -> "попутной волны и засасывания"
    sog_fix_ids = [19, 145, 146, 148, 150, 155]
    for qid in sog_fix_ids:
        q = fix_by_id(ru_questions, qid)
        if not q:
            continue
        for i, opt in enumerate(q.get("options_ru", [])):
            new = opt.replace("волн и зыби", "попутной волны и засасывания")
            new = new.replace("волн и колебаний", "попутной волны и засасывания")
            new = new.replace("волн и ударов волн", "попутной волны и засасывания")
            if new != opt:
                q["options_ru"][i] = new
                fixes += 1
        # Also fix question stem if present
        old_q = q.get("question_ru", "")
        new_q = old_q.replace("волн и зыби", "попутной волны и засасывания")
        new_q = new_q.replace("волн и колебаний", "попутной волны и засасывания")
        if new_q != old_q:
            q["question_ru"] = new_q
            fixes += 1

    # Q39: "не дрейфует" -> "не рыскает на якоре"
    q39 = fix_by_id(ru_questions, 39)
    if q39:
        for i, opt in enumerate(q39.get("options_ru", [])):
            new = opt.replace("не дрейфует", "не рыскает на якоре")
            if new != opt:
                q39["options_ru"][i] = new
                fixes += 1

    # Q43: трюм -> льяло (bilge)
    q43 = fix_by_id(ru_questions, 43)
    if q43:
        for i, opt in enumerate(q43.get("options_ru", [])):
            new = opt.replace("трюм", "льяло").replace("трюма", "льяла").replace("трюме", "льяле")
            if new != opt:
                q43["options_ru"][i] = new
                fixes += 1
        old_q = q43.get("question_ru", "")
        new_q = old_q.replace("трюм", "льяло").replace("трюма", "льяла").replace("трюме", "льяле")
        if new_q != old_q:
            q43["question_ru"] = new_q
            fixes += 1

    # Q100: gender agreement "красно-зелёная полосатая" -> "красно-зелёный полосатый"
    q100 = fix_by_id(ru_questions, 100)
    if q100:
        old_q = q100.get("question_ru", "")
        new_q = old_q.replace("красно-зелёная полосатая", "красно-зелёный полосатый")
        if new_q != old_q:
            q100["question_ru"] = new_q
            fixes += 1

    # Q126: "синее огонь" -> "синий огонь"
    q126 = fix_by_id(ru_questions, 126)
    if q126:
        old_q = q126.get("question_ru", "")
        new_q = old_q.replace("синее огонь", "синий огонь")
        if new_q != old_q:
            q126["question_ru"] = new_q
            fixes += 1

    # Q172: "судна" (wrong plural) -> "суда"
    q172 = fix_by_id(ru_questions, 172)
    if q172:
        for i, opt in enumerate(q172.get("options_ru", [])):
            new = opt.replace("судна ", "суда ")
            if new != opt:
                q172["options_ru"][i] = new
                fixes += 1

    # Q192: remove spurious "буксируемый" from "буксируемый толкаемый состав"
    q192 = fix_by_id(ru_questions, 192)
    if q192:
        for i, opt in enumerate(q192.get("options_ru", [])):
            new = opt.replace("Буксируемый толкаемый состав", "Толкаемый состав")
            new = new.replace("буксируемый толкаемый состав", "толкаемый состав")
            if new != opt:
                q192["options_ru"][i] = new
                fixes += 1

    # Q218: "талового судна" -> "судна, следующего вниз по течению"
    q218 = fix_by_id(ru_questions, 218)
    if q218:
        for i, opt in enumerate(q218.get("options_ru", [])):
            new = opt.replace("талового судна", "судна, следующего вниз по течению")
            if new != opt:
                q218["options_ru"][i] = new
                fixes += 1
        old_q = q218.get("question_ru", "")
        new_q = old_q.replace("талового судна", "судна, следующего вниз по течению")
        if new_q != old_q:
            q218["question_ru"] = new_q
            fixes += 1

    # Q255: "кильсон" -> "скуловой киль" (bilge keel)
    q255 = fix_by_id(ru_questions, 255)
    if q255:
        for i, opt in enumerate(q255.get("options_ru", [])):
            new = opt.replace("кильсон", "скуловой киль")
            if new != opt:
                q255["options_ru"][i] = new
                fixes += 1

    # Q267: "верёвки" -> "тросы" (lines/cordage)
    q267 = fix_by_id(ru_questions, 267)
    if q267:
        for i, opt in enumerate(q267.get("options_ru", [])):
            new = opt.replace("верёвки", "тросы").replace("верёвок", "тросов")
            if new != opt:
                q267["options_ru"][i] = new
                fixes += 1

    # Q274: "триммеры" -> "колдунчики" (telltales)
    q274 = fix_by_id(ru_questions, 274)
    if q274:
        for i, opt in enumerate(q274.get("options_ru", [])):
            new = opt.replace("триммеры", "колдунчики").replace("триммеров", "колдунчиков")
            if new != opt:
                q274["options_ru"][i] = new
                fixes += 1

    # Q277: "встречного встречного" -> "встречного" (duplicated word)
    q277 = fix_by_id(ru_questions, 277)
    if q277:
        for i, opt in enumerate(q277.get("options_ru", [])):
            new = opt.replace("встречного встречного", "встречного")
            if new != opt:
                q277["options_ru"][i] = new
                fixes += 1

    # Q285: "подтянутое грот-парус" -> "подтянутый грот-парус"
    q285 = fix_by_id(ru_questions, 285)
    if q285:
        old_q = q285.get("question_ru", "")
        new_q = old_q.replace("подтянутое грот-парус", "подтянутый грот-парус")
        if new_q != old_q:
            q285["question_ru"] = new_q
            fixes += 1

    # Q286: "шкот-фала" -> "каретки шкота" (fairlead/sheet lead)
    q286 = fix_by_id(ru_questions, 286)
    if q286:
        for i, opt in enumerate(q286.get("options_ru", [])):
            new = opt.replace("шкот-фала", "каретки шкота")
            if new != opt:
                q286["options_ru"][i] = new
                fixes += 1
        old_q = q286.get("question_ru", "")
        new_q = old_q.replace("шкот-фала", "каретки шкота")
        if new_q != old_q:
            q286["question_ru"] = new_q
            fixes += 1

    # Q293: "его сложнее управлять" -> "им сложнее управлять"
    q293 = fix_by_id(ru_questions, 293)
    if q293:
        for i, opt in enumerate(q293.get("options_ru", [])):
            new = opt.replace("его сложнее управлять", "им сложнее управлять")
            if new != opt:
                q293["options_ru"][i] = new
                fixes += 1

    # Q296: "качаться" -> "разворачиваться на швартове" (swing at mooring)
    q296 = fix_by_id(ru_questions, 296)
    if q296:
        for i, opt in enumerate(q296.get("options_ru", [])):
            new = opt.replace("качаться", "разворачиваться на швартове")
            if new != opt:
                q296["options_ru"][i] = new
                fixes += 1

    # Q300: "фалшкот" -> "фок-шкот" (jib sheet)
    q300 = fix_by_id(ru_questions, 300)
    if q300:
        for i, opt in enumerate(q300.get("options_ru", [])):
            new = opt.replace("фалшкот", "фок-шкот").replace("Фалшкот", "Фок-шкот")
            if new != opt:
                q300["options_ru"][i] = new
                fixes += 1

    return fixes


def apply_en_fixes(en_questions):
    fixes = 0

    # Q11: "position" -> "orientation" for Lage
    q11 = fix_by_id(en_questions, 11)
    if q11:
        for i, opt in enumerate(q11.get("options_en", [])):
            if i == 0:  # option a only
                new = opt.replace("position", "orientation")
                if new != opt:
                    q11["options_en"][i] = new
                    fixes += 1

    # Q70: "establish a state of closure" -> "establish watertight integrity"
    q70 = fix_by_id(en_questions, 70)
    if q70:
        for i, opt in enumerate(q70.get("options_en", [])):
            new = opt.replace("establish a state of closure", "establish watertight integrity")
            new = new.replace("state of closure", "watertight integrity")
            if new != opt:
                q70["options_en"][i] = new
                fixes += 1

    # Q97: "pillar buoys" -> "spar buoys", "floating sticks" -> "floating poles"
    q97 = fix_by_id(en_questions, 97)
    if q97:
        for i, opt in enumerate(q97.get("options_en", [])):
            new = opt.replace("pillar buoys", "spar buoys")
            new = new.replace("floating sticks", "floating poles")
            if new != opt:
                q97["options_en"][i] = new
                fixes += 1

    # Q103, Q163, Q202: "Tacking" -> "Turning" for Wenden
    wenden_ids = [103, 163, 202]
    for qid in wenden_ids:
        q = fix_by_id(en_questions, qid)
        if not q:
            continue
        for i, opt in enumerate(q.get("options_en", [])):
            new = opt.replace("Tacking", "Turning").replace("tacking", "turning")
            if new != opt:
                q["options_en"][i] = new
                fixes += 1
        old_q = q.get("question_en", "")
        new_q = old_q.replace("Tacking", "Turning").replace("tacking", "turning")
        if new_q != old_q:
            q["question_en"] = new_q
            fixes += 1

    # Q107, Q126: "hazardous materials/substances" -> "health-hazardous substances"
    for qid in [107, 126]:
        q = fix_by_id(en_questions, qid)
        if not q:
            continue
        for i, opt in enumerate(q.get("options_en", [])):
            new = opt.replace("hazardous materials", "health-hazardous substances")
            new = new.replace("hazardous substances", "health-hazardous substances")
            # Avoid double-fixing
            new = new.replace("health-health-hazardous", "health-hazardous")
            if new != opt:
                q["options_en"][i] = new
                fixes += 1

    # Q124, Q125: "ferry not under command" -> "cable ferry", "ferry under command" -> "free-running ferry"
    for qid in [124, 125]:
        q = fix_by_id(en_questions, qid)
        if not q:
            continue
        for i, opt in enumerate(q.get("options_en", [])):
            new = opt.replace("ferry not under command", "cable ferry")
            new = new.replace("Ferry not under command", "Cable ferry")
            new = new.replace("ferry under command", "free-running ferry")
            new = new.replace("Ferry under command", "Free-running ferry")
            if new != opt:
                q["options_en"][i] = new
                fixes += 1
        old_q = q.get("question_en", "")
        new_q = old_q.replace("ferry not under command", "cable ferry")
        new_q = new_q.replace("Ferry not under command", "Cable ferry")
        new_q = new_q.replace("ferry under command", "free-running ferry")
        new_q = new_q.replace("Ferry under command", "Free-running ferry")
        if new_q != old_q:
            q["question_en"] = new_q
            fixes += 1

    # Q143: "a sailor" -> "a sailing vessel" (for Segler meaning vessel)
    q143 = fix_by_id(en_questions, 143)
    if q143:
        old_q = q143.get("question_en", "")
        new_q = old_q.replace("a sailor", "a sailing vessel")
        if new_q != old_q:
            q143["question_en"] = new_q
            fixes += 1

    # Q159: "Vessel not under command" -> "vessel unable to maneuver" for manövrierunfähig
    q159 = fix_by_id(en_questions, 159)
    if q159:
        for i, opt in enumerate(q159.get("options_en", [])):
            new = opt.replace("Vessel not under command", "Vessel unable to maneuver")
            new = new.replace("vessel not under command", "vessel unable to maneuver")
            if new != opt:
                q159["options_en"][i] = new
                fixes += 1

    # Q195: "tacking" -> "crossing/navigating" for kreuzt
    q195 = fix_by_id(en_questions, 195)
    if q195:
        for i, opt in enumerate(q195.get("options_en", [])):
            new = opt.replace("tacking", "navigating")
            if new != opt:
                q195["options_en"][i] = new
                fixes += 1

    # Q275, Q278: "headwind" -> "boat speed wind" for Fahrtwind
    for qid in [275, 278]:
        q = fix_by_id(en_questions, qid)
        if not q:
            continue
        for i, opt in enumerate(q.get("options_en", [])):
            new = opt.replace("headwind", "boat speed wind")
            if new != opt:
                q["options_en"][i] = new
                fixes += 1
        old_q = q.get("question_en", "")
        new_q = old_q.replace("headwind", "boat speed wind")
        if new_q != old_q:
            q["question_en"] = new_q
            fixes += 1

    # Q268, Q282: "eased" -> "lowered" for gefiert (in halyard/centerboard context)
    for qid in [268, 282]:
        q = fix_by_id(en_questions, qid)
        if not q:
            continue
        for i, opt in enumerate(q.get("options_en", [])):
            new = opt.replace("eased", "lowered")
            if new != opt:
                q["options_en"][i] = new
                fixes += 1

    # Q270: "clew cringle" -> "clew" for Schothorn
    q270 = fix_by_id(en_questions, 270)
    if q270:
        for i, opt in enumerate(q270.get("options_en", [])):
            new = opt.replace("clew cringle", "clew")
            if new != opt:
                q270["options_en"][i] = new
                fixes += 1

    # Q298, Q299: "heave-to" / "Heave-to" -> "luffing up" for Aufschießer
    for qid in [298, 299]:
        q = fix_by_id(en_questions, qid)
        if not q:
            continue
        for i, opt in enumerate(q.get("options_en", [])):
            new = opt.replace("heave-to maneuver", "luffing up")
            new = new.replace("Heave-to", "Luffing up")
            new = new.replace("heave-to", "luffing up")
            if new != opt:
                q["options_en"][i] = new
                fixes += 1
        old_q = q.get("question_en", "")
        new_q = old_q.replace("heave-to maneuver", "luffing up")
        new_q = new_q.replace("Heave-to", "Luffing up")
        new_q = new_q.replace("heave-to", "luffing up")
        if new_q != old_q:
            q["question_en"] = new_q
            fixes += 1

    return fixes


def apply_highlight_fixes(highlights):
    fixes = 0

    # Q63: "explosives Gemisch" -> "explosives Gemisch mit Luft"
    q63 = fix_by_id(highlights, 63)
    if q63:
        if "explosives Gemisch" in q63.get("highlights_de", []):
            q63["highlights_de"] = [h.replace("explosives Gemisch", "explosives Gemisch mit Luft") if h == "explosives Gemisch" else h for h in q63["highlights_de"]]
            fixes += 1
        if "explosive mixture" in q63.get("highlights_en", []):
            q63["highlights_en"] = [h.replace("explosive mixture", "explosive mixture with air") if h == "explosive mixture" else h for h in q63["highlights_en"]]
            fixes += 1

    # Q278: "wahrer Wind" -> "wahre Wind"
    q278 = fix_by_id(highlights, 278)
    if q278:
        q278["highlights_de"] = ["wahre Wind" if h == "wahrer Wind" else h for h in q278.get("highlights_de", [])]
        fixes += 1

    # Q104: Remove highlights that come from question stem, not answer
    q104 = fix_by_id(highlights, 104)
    if q104:
        q104["highlights_de"] = [h for h in q104.get("highlights_de", []) if "weiße Lichter" not in h]
        q104["highlights_en"] = [h for h in q104.get("highlights_en", []) if "white lights" not in h]
        q104["highlights_ru"] = [h for h in q104.get("highlights_ru", []) if "белых огн" not in h]
        fixes += 1

    # Q130: Remove highlights from question stem
    q130 = fix_by_id(highlights, 130)
    if q130:
        q130["highlights_de"] = [h for h in q130.get("highlights_de", []) if "blaue Lichter" not in h]
        q130["highlights_en"] = [h for h in q130.get("highlights_en", []) if "blue lights" not in h]
        q130["highlights_ru"] = [h for h in q130.get("highlights_ru", []) if "синих огн" not in h]
        fixes += 1

    # Q161: Remove highlights from question stem
    q161 = fix_by_id(highlights, 161)
    if q161:
        q161["highlights_de"] = [h for h in q161.get("highlights_de", []) if "kurze Töne" not in h]
        q161["highlights_en"] = [h for h in q161.get("highlights_en", []) if "short blasts" not in h]
        q161["highlights_ru"] = [h for h in q161.get("highlights_ru", []) if "коротких" not in h]
        fixes += 1

    # Q242: Remove highlights from question stem
    q242 = fix_by_id(highlights, 242)
    if q242:
        q242["highlights_de"] = [h for h in q242.get("highlights_de", []) if h not in ("gelbe Tonnen", "Radarreflektor")]
        q242["highlights_en"] = [h for h in q242.get("highlights_en", []) if h not in ("yellow buoys", "radar reflector")]
        q242["highlights_ru"] = [h for h in q242.get("highlights_ru", []) if h not in ("жёлтые буи", "радарный отражатель")]
        fixes += 1

    # Q247: Remove highlights from question stem
    q247 = fix_by_id(highlights, 247)
    if q247:
        q247["highlights_de"] = [h for h in q247.get("highlights_de", []) if "roten Wimpel" not in h]
        q247["highlights_en"] = [h for h in q247.get("highlights_en", []) if "red pennant" not in h]
        q247["highlights_ru"] = [h for h in q247.get("highlights_ru", []) if "красн" not in h]
        fixes += 1

    return fixes


def main():
    console.print("[bold]Applying auto-fixes from quality review...[/bold]\n")

    ru = load_json(RU_PATH)
    en = load_json(EN_PATH)
    hl = load_json(HL_PATH)

    ru_fixes = apply_ru_fixes(ru)
    console.print(f"[green]Russian translation fixes: {ru_fixes}[/green]")

    en_fixes = apply_en_fixes(en)
    console.print(f"[green]English translation fixes: {en_fixes}[/green]")

    hl_fixes = apply_highlight_fixes(hl)
    console.print(f"[green]Highlight fixes: {hl_fixes}[/green]")

    total = ru_fixes + en_fixes + hl_fixes
    console.print(f"\n[bold green]Total fixes applied: {total}[/bold green]")

    save_json(ru, RU_PATH)
    save_json(en, EN_PATH)
    save_json(hl, HL_PATH)

    console.print("\nSaved updated files. Run seed_database.py to regenerate questions.json.")


if __name__ == "__main__":
    main()
