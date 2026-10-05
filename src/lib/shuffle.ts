/**
 * Seeded PRNG (mulberry32) and Fisher–Yates shuffle for deterministic
 * answer-option randomization. Given the same seed the output is identical
 * across renders, page reloads, and devices.
 */

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Returns a permutation array of length `n`.
 * permutation[displayIndex] === originalIndex
 *
 * Example: [2, 0, 3, 1] means display slot 0 shows original option 2.
 */
export function buildOptionPermutation(
  questionId: number,
  sessionSeed: number,
  n: number
): number[] {
  const seed = questionId * 2654435761 + sessionSeed;
  const rng = mulberry32(seed);

  const perm = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  return perm;
}

/**
 * Build the reverse mapping: inversePerm[originalIndex] === displayIndex
 */
export function invertPermutation(perm: number[]): number[] {
  const inv = new Array<number>(perm.length);
  for (let i = 0; i < perm.length; i++) {
    inv[perm[i]] = i;
  }
  return inv;
}
