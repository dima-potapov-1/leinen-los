import { useMemo } from "react";
import type { Question, QuestionOption } from "@/types";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import { buildOptionPermutation, invertPermutation } from "@/lib/shuffle";

export interface ShuffledOptions {
  /** Options in display order */
  displayOptions: QuestionOption[];
  /** Convert a display-position index to the original-array index */
  toOriginalIndex: (displayIdx: number) => number;
  /** Convert an original-array index to its display position (returns -1 if not found) */
  toDisplayIndex: (originalIdx: number) => number;
  /** Convert an original index or undefined to display index or undefined */
  toDisplayIndexSafe: (originalIdx: number | undefined) => number | undefined;
}

/**
 * Returns shuffled options + bidirectional index converters.
 * When shuffling is disabled, returns identity mappings.
 *
 * @param question  The question whose options to (maybe) shuffle
 * @param sessionSeed  A per-session value for deterministic shuffling
 */
export function useShuffledOptions(
  question: Question,
  sessionSeed: number
): ShuffledOptions {
  const shuffleAnswers = usePreferencesStore((s) => s.shuffleAnswers);

  return useMemo(() => {
    const n = question.options.length;

    if (!shuffleAnswers) {
      return {
        displayOptions: question.options,
        toOriginalIndex: (i: number) => i,
        toDisplayIndex: (i: number) => i,
        toDisplayIndexSafe: (i: number | undefined) => i,
      };
    }

    const perm = buildOptionPermutation(question.id, sessionSeed, n);
    const inv = invertPermutation(perm);

    return {
      displayOptions: perm.map((origIdx) => question.options[origIdx]),
      toOriginalIndex: (displayIdx: number) => perm[displayIdx],
      toDisplayIndex: (originalIdx: number) => inv[originalIdx] ?? -1,
      toDisplayIndexSafe: (originalIdx: number | undefined) =>
        originalIdx === undefined ? undefined : inv[originalIdx],
    };
  }, [question.id, question.options, sessionSeed, shuffleAnswers]);
}
