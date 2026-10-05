import type { Question, Topic, QuestionOrder } from "@/types";

interface ProgressInfo {
  mastery: "unseen" | "learning" | "familiar";
  consecutiveCorrect: number;
  attempts: number;
}

/**
 * Two-phase question selection (v2 — coverage-first):
 *
 * Coverage phase (unseen questions remain in pool):
 *   ~90% unseen + ~10% struggling (consecutiveCorrect=0).
 *   On-track and familiar questions are excluded until all questions are seen.
 *   Overflow: struggling → onTrack → familiar.
 *
 * Review phase (all questions seen at least once):
 *   70% learning (struggling + onTrack), 30% familiar.
 *
 * When order is "sequential", buckets are sorted by ID instead of shuffled,
 * and the final selection is returned in ascending ID order.
 */
export function selectSessionQuestions(
  questions: Question[],
  progressMap: Record<number, ProgressInfo>,
  count: number,
  topic?: Topic,
  order: QuestionOrder = "random",
  resumeFromId: number = 0
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

  const prepare = order === "sequential" ? sortById : shuffle;
  prepare(unseen);
  prepare(struggling);
  prepare(onTrack);
  prepare(familiar);

  const selected: Question[] = [];

  if (unseen.length > 0) {
    const strugglingQuota = Math.min(struggling.length, Math.ceil(count * 0.1));
    selected.push(...struggling.slice(0, strugglingQuota));

    const unseenQuota = Math.min(unseen.length, count - selected.length);
    selected.push(...unseen.slice(0, unseenQuota));

    if (selected.length < count) {
      selected.push(...struggling.slice(strugglingQuota, strugglingQuota + count - selected.length));
    }
    if (selected.length < count) {
      selected.push(...onTrack.slice(0, count - selected.length));
    }
    if (selected.length < count) {
      selected.push(...familiar.slice(0, count - selected.length));
    }
  } else {
    if (order === "sequential") {
      // Keep struggling and onTrack separate so struggling always gets
      // priority within the learning quota. Rotate all three pools so
      // the user cycles through the full question set across sessions.
      sortById(struggling);
      sortById(onTrack);
      if (resumeFromId > 0) {
        rotateToId(struggling, resumeFromId);
        rotateToId(onTrack, resumeFromId);
        shuffle(familiar);
      }
      const learningQuota = Math.min(
        struggling.length + onTrack.length,
        Math.ceil(count * 0.7)
      );
      selected.push(...struggling.slice(0, learningQuota));
      if (selected.length < learningQuota) {
        selected.push(...onTrack.slice(0, learningQuota - selected.length));
      }
    } else if (order === "weakest-first") {
      const learning = [...struggling, ...onTrack];
      shuffle(learning);
      const learningQuota = Math.min(learning.length, count);
      selected.push(...learning.slice(0, learningQuota));
    } else {
      const learning = [...struggling, ...onTrack];
      shuffle(learning);
      const learningQuota = Math.min(learning.length, Math.ceil(count * 0.7));
      selected.push(...learning.slice(0, learningQuota));
    }

    if (selected.length < count) {
      selected.push(...familiar.slice(0, count - selected.length));
    }
  }

  const final = selected.slice(0, count);
  return order === "sequential" ? sortById(final) : shuffle(final);
}

function sortById<T extends { id: number }>(arr: T[]): T[] {
  return arr.sort((a, b) => a.id - b.id);
}

/** Rotate a sorted array in-place so the first element has id >= targetId. Wraps to start if targetId exceeds all IDs. */
function rotateToId<T extends { id: number }>(arr: T[], targetId: number): void {
  if (arr.length === 0) return;
  let idx = arr.findIndex((q) => q.id >= targetId);
  if (idx <= 0) return;
  const tail = arr.splice(0, idx);
  arr.push(...tail);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
