export interface TextSegment {
  text: string;
  highlighted: boolean;
}

export function splitByHighlights(
  text: string,
  phrases: string[]
): TextSegment[] {
  if (!phrases.length || !text) return [{ text, highlighted: false }];

  const sortedPhrases = [...phrases]
    .filter((p) => p && text.toLowerCase().includes(p.toLowerCase()))
    .sort((a, b) => b.length - a.length);

  if (!sortedPhrases.length) return [{ text, highlighted: false }];

  const escaped = sortedPhrases.map((p) =>
    p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  );
  const pattern = new RegExp(`(${escaped.join("|")})`, "gi");

  const segments: TextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    const matchStart = match.index!;
    if (matchStart > lastIndex) {
      segments.push({ text: text.slice(lastIndex, matchStart), highlighted: false });
    }
    segments.push({ text: match[0], highlighted: true });
    lastIndex = matchStart + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), highlighted: false });
  }

  return segments.length ? segments : [{ text, highlighted: false }];
}
