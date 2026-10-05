/**
 * ARCHIVED — Original question selection algorithm (v1)
 *
 * Replaced by v2 on 2026-04-06 to prioritize faster coverage of all 300 questions.
 *
 * WHY THIS WAS CHANGED:
 * The user found that 50% of each session consisted of questions they were already
 * confident about. In a session of 10:
 *   - 3 slots (30%) went to "struggling" questions (consecutiveCorrect=0)
 *   - 2 slots (20%) went to "onTrack" questions (consecutiveCorrect>=1, still "learning")
 *   - Only 5 slots (~50%) went to unseen (new) questions
 * Once all questions in a topic were seen, the Review phase served 60% familiar,
 * making sessions feel repetitive.
 *
 * WHAT v2 CHANGED:
 *   Coverage phase: 90% unseen / 10% struggling / 0% onTrack
 *   Review phase:   70% learning / 30% familiar
 *
 * HOW TO REVERT:
 * In app/learn/page.tsx, change the import:
 *   from: import { selectSessionQuestions } from "@/lib/question-selection";
 *   to:   import { selectSessionQuestions } from "@/lib/question-selection-v1";
 *
 * MASTERY MODEL (unchanged across versions):
 *   consecutiveCorrect=0, mastery="unseen"    → never answered
 *   consecutiveCorrect=0, mastery="learning"  → "struggling" — last answer was wrong
 *   consecutiveCorrect>=1, mastery="learning"  → "onTrack" — got it right, needs 1 more
 *   consecutiveCorrect>=2, mastery="familiar"  → "familiar" — confirmed with 2 in a row
 *   Any wrong answer resets consecutiveCorrect to 0 and mastery to "learning".
 */

import type { Question, Topic } from "@/types";

interface ProgressInfo {
  mastery: "unseen" | "learning" | "familiar";
  consecutiveCorrect: number;
  attempts: number;
}

export function selectSessionQuestions(
  questions: Question[],
  progressMap: Record<number, ProgressInfo>,
  count: number,
  topic?: Topic
): Question[] {
  const pool = topic ? questions.filter((q) => q.topic === topic) : [...questions];

  const unseen: Question[] = [];
  const struggling: Question[] = [];
  const onTrack: Question[] = [];
  const familiar: Question[] = [];

  for (const q of pool) {
    const p = progressMap[q.id];
    if (!p || p.mastery === "unseen") {
      unseen.push(q);
    } else if (p.mastery === "familiar") {
      familiar.push(q);
    } else if (p.consecutiveCorrect === 0) {
      struggling.push(q);
    } else {
      onTrack.push(q);
    }
  }

  shuffle(unseen);
  shuffle(struggling);
  shuffle(onTrack);
  shuffle(familiar);

  const selected: Question[] = [];

  if (unseen.length > 0) {
    const strugglingQuota = Math.min(struggling.length, Math.ceil(count * 0.3));
    selected.push(...struggling.slice(0, strugglingQuota));

    const onTrackQuota = Math.min(onTrack.length, Math.ceil(count * 0.2));
    selected.push(...onTrack.slice(0, onTrackQuota));

    const unseenQuota = Math.min(unseen.length, count - selected.length);
    selected.push(...unseen.slice(0, unseenQuota));

    if (selected.length < count) {
      selected.push(...onTrack.slice(onTrackQuota, onTrackQuota + count - selected.length));
    }
    if (selected.length < count) {
      selected.push(...familiar.slice(0, count - selected.length));
    }
  } else {
    const learning = [...struggling, ...onTrack];
    shuffle(learning);

    const learningQuota = Math.min(learning.length, Math.ceil(count * 0.4));
    selected.push(...learning.slice(0, learningQuota));

    if (selected.length < count) {
      selected.push(...familiar.slice(0, count - selected.length));
    }
  }

  return shuffle(selected).slice(0, count);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
