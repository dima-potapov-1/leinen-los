import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
if (!OPENROUTER_API_KEY) {
  console.error("Set OPENROUTER_API_KEY in the environment (e.g. scripts/.env).");
  process.exit(1);
}
const MODEL = "google/gemini-2.0-flash-001";

const dataPath = join(__dirname, "..", "data", "questions-final.json");
const data = JSON.parse(readFileSync(dataPath, "utf-8"));

function collectMismatches() {
  const mismatches = [];
  const langs = ["de", "en", "ru"];

  for (const q of data) {
    for (let oi = 0; oi < q.options.length; oi++) {
      const opt = q.options[oi];
      for (const lang of langs) {
        const text = opt[lang] || "";
        const highlights = opt[`highlights_${lang}`] || [];
        const broken = highlights.filter((h) => !text.includes(h));
        if (broken.length > 0) {
          mismatches.push({ qid: q.id, optIdx: oi, lang, broken, text, opt });
        }
      }
    }
  }
  return mismatches;
}

async function fixBatch(batch) {
  const items = batch.map((m) => {
    const deText = m.opt.de;
    const deHighlights = m.opt.highlights_de || [];
    return {
      key: `${m.qid}-${m.optIdx}-${m.lang}`,
      targetLang: m.lang,
      targetText: m.text,
      deText,
      deHighlights,
      brokenHighlights: m.broken,
    };
  });

  const prompt = `You are a text matching assistant. For each item below, I give you:
- A German answer text with working highlight substrings (exact substrings that exist in the German text)
- A target language answer text
- Broken highlight phrases that DON'T match the target text

Your task: for each broken highlight, find the EXACT substring in the target text that conveys the same meaning as the corresponding German highlight. The result MUST be a verbatim substring of the target text (copy-paste match including case).

Rules:
- Output MUST be valid JSON array
- Each element: { "key": "<key>", "fixes": [{ "old": "<broken highlight>", "new": "<exact substring from target text>" }] }
- If a concept simply doesn't appear in the target text, set "new" to "" (empty string)
- NEVER invent text. The "new" value must be found verbatim in the target text
- Preserve punctuation and whitespace exactly as in the target text

Items:
${JSON.stringify(items, null, 2)}

Return ONLY the JSON array, no markdown fences.`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  let text = json.choices[0].message.content.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  return JSON.parse(text);
}

async function main() {
  const mismatches = collectMismatches();
  console.log(`Found ${mismatches.length} option+lang combos with broken highlights`);

  const BATCH_SIZE = 15;
  const allFixes = [];

  for (let i = 0; i < mismatches.length; i += BATCH_SIZE) {
    const batch = mismatches.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(mismatches.length / BATCH_SIZE);
    console.log(`Processing batch ${batchNum}/${totalBatches}...`);

    try {
      const fixes = await fixBatch(batch);
      allFixes.push(...fixes);
    } catch (err) {
      console.error(`Batch ${batchNum} failed:`, err.message);
      console.log("Retrying individually...");
      for (const item of batch) {
        try {
          const fixes = await fixBatch([item]);
          allFixes.push(...fixes);
        } catch (e2) {
          console.error(`  Q${item.qid} opt${item.optIdx} ${item.lang} failed:`, e2.message);
        }
      }
    }

    if (i + BATCH_SIZE < mismatches.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  // Apply fixes
  let applied = 0;
  let failed = 0;

  for (const fix of allFixes) {
    const [qidStr, optIdxStr, lang] = fix.key.split("-");
    const qid = parseInt(qidStr);
    const optIdx = parseInt(optIdxStr);
    const q = data.find((q) => q.id === qid);
    if (!q) continue;

    const opt = q.options[optIdx];
    const text = opt[lang];
    const hlKey = `highlights_${lang}`;

    for (const f of fix.fixes) {
      if (!f.old || f.new === undefined) continue;

      const idx = opt[hlKey].indexOf(f.old);
      if (idx === -1) continue;

      if (f.new === "") {
        opt[hlKey].splice(idx, 1);
        applied++;
      } else if (text.includes(f.new)) {
        opt[hlKey][idx] = f.new;
        applied++;
      } else {
        console.log(`  SKIP Q${qid} opt${optIdx} [${lang}]: "${f.new}" not in text`);
        failed++;
      }
    }
  }

  console.log(`\nApplied: ${applied}, Failed: ${failed}`);

  // Verify remaining
  const remaining = collectMismatches();
  console.log(`Remaining mismatches: ${remaining.length}`);

  writeFileSync(dataPath, JSON.stringify(data, null, 2) + "\n");
  console.log("Saved questions-final.json");

  // Also update highlights.json
  const hlPath = join(__dirname, "..", "data", "highlights.json");
  const hlData = data.map((q) => {
    const correct = q.options[q.correct_option];
    return {
      id: q.id,
      highlights_de: correct.highlights_de || [],
      highlights_en: correct.highlights_en || [],
      highlights_ru: correct.highlights_ru || [],
    };
  });
  writeFileSync(hlPath, JSON.stringify(hlData, null, 2) + "\n");
  console.log("Saved highlights.json");
}

main().catch(console.error);
