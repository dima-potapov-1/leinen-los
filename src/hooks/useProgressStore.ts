import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Mastery, Topic } from "@/types";
import { createSupabaseBrowser } from "@/lib/supabase-client";

export type CelebrationEvent =
  | { type: "first-answer" }
  | { type: "correct-streak-10" }
  | { type: "category-complete"; topic: Topic }
  | { type: "readiness-green"; topic: Topic }
  | { type: "exam-passed" };

interface QuestionProgress {
  mastery: Mastery;
  consecutiveCorrect: number;
  attempts: number;
  correctCount: number;
  bookmarked: boolean;
}

const TOPIC_RANGES: Record<Topic, [number, number]> = {
  basis: [1, 72],
  binnen: [73, 253],
  segeln: [254, 300],
};

function getTopicForId(id: number): Topic {
  if (id <= 72) return "basis";
  if (id <= 253) return "binnen";
  return "segeln";
}

interface ProgressState {
  progress: Record<number, QuestionProgress>;
  globalConsecutiveCorrect: number;
  userId: string | null;
  hydrated: boolean;

  hydrateFromServer: (userId: string) => Promise<void>;
  clearForLogout: () => void;

  recordAnswer: (questionId: number, isCorrect: boolean) => CelebrationEvent[];
  toggleBookmark: (questionId: number) => void;
  submitExamAnswers: (
    answers: { questionId: number; isCorrect: boolean }[],
    passed: boolean
  ) => CelebrationEvent[];

  getProgress: (questionId: number) => QuestionProgress;
  getMistakes: () => number[];
  getBookmarks: () => number[];
  getMasteryBreakdown: () => { unseen: number; learning: number; familiar: number };
  getMasteryBreakdownByTopic: (topic: Topic) => {
    unseen: number;
    learning: number;
    familiar: number;
    total: number;
  };
  getReadiness: (topic: Topic) => "red" | "amber" | "green";
  getTotalAttempts: () => number;
  getTotalCorrect: () => number;
}

const DEFAULT_PROGRESS: QuestionProgress = {
  mastery: "unseen",
  consecutiveCorrect: 0,
  attempts: 0,
  correctCount: 0,
  bookmarked: false,
};

function upsertToSupabase(userId: string, questionId: number, progress: QuestionProgress) {
  const supabase = createSupabaseBrowser();
  supabase
    .from("user_progress")
    .upsert(
      {
        user_id: userId,
        question_id: questionId,
        mastery: progress.mastery,
        consecutive_correct: progress.consecutiveCorrect,
        attempts: progress.attempts,
        correct_count: progress.correctCount,
        bookmarked: progress.bookmarked,
      },
      { onConflict: "user_id,question_id" }
    )
    .then(({ error }) => {
      if (error) console.error("Failed to upsert progress:", error);
    });
}

export const useProgressStore = create<ProgressState>()(
  persist(
  (set, get) => ({
    progress: {},
    globalConsecutiveCorrect: 0,
    userId: null,
    hydrated: false,

    hydrateFromServer: async (userId) => {
      const supabase = createSupabaseBrowser();
      const { data, error } = await supabase
        .from("user_progress")
        .select("question_id, mastery, consecutive_correct, attempts, correct_count, bookmarked")
        .eq("user_id", userId);

      if (error) {
        console.error("Failed to fetch progress:", error);
        set({ userId, hydrated: true });
        return;
      }

      const progress: Record<number, QuestionProgress> = {};
      for (const row of data ?? []) {
        progress[row.question_id] = {
          mastery: row.mastery as Mastery,
          consecutiveCorrect: row.consecutive_correct,
          attempts: row.attempts,
          correctCount: row.correct_count,
          bookmarked: row.bookmarked,
        };
      }

      set({ progress, userId, hydrated: true });
    },

    clearForLogout: () => {
      set({ userId: null, hydrated: false });
    },

    recordAnswer: (questionId, isCorrect) => {
      const state = get();
      const prev = state.progress[questionId] ?? { ...DEFAULT_PROGRESS };
      const celebrations: CelebrationEvent[] = [];

      const isFirstEver =
        Object.keys(state.progress).length === 0 ||
        (Object.keys(state.progress).length === 1 &&
          state.progress[questionId]?.attempts === 0);

      const updated: QuestionProgress = { ...prev, attempts: prev.attempts + 1 };

      if (isCorrect) {
        updated.correctCount += 1;
        updated.consecutiveCorrect = prev.consecutiveCorrect + 1;
        if (updated.consecutiveCorrect >= 2) {
          updated.mastery = "familiar";
        } else if (updated.mastery === "unseen") {
          updated.mastery = "learning";
        }
      } else {
        updated.mastery = "learning";
        updated.consecutiveCorrect = 0;
      }

      const newGlobalStreak = isCorrect
        ? state.globalConsecutiveCorrect + 1
        : 0;

      const newProgress = { ...state.progress, [questionId]: updated };

      if (prev.attempts === 0 && isFirstEver) {
        celebrations.push({ type: "first-answer" });
      }

      if (newGlobalStreak > 0 && newGlobalStreak % 10 === 0) {
        celebrations.push({ type: "correct-streak-10" });
      }

      const topic = getTopicForId(questionId);
      const [rangeStart, rangeEnd] = TOPIC_RANGES[topic];
      const topicSize = rangeEnd - rangeStart + 1;

      let attemptedInTopic = 0;
      let familiarInTopic = 0;
      for (let id = rangeStart; id <= rangeEnd; id++) {
        const p = id === questionId ? updated : newProgress[id];
        if (p && p.attempts > 0) attemptedInTopic++;
        if (p && p.mastery === "familiar") familiarInTopic++;
      }

      if (
        prev.attempts === 0 &&
        attemptedInTopic === topicSize
      ) {
        celebrations.push({ type: "category-complete", topic });
      }

      const prevFamiliar = familiarInTopic - (updated.mastery === "familiar" && prev.mastery !== "familiar" ? 1 : 0);
      const prevRatio = prevFamiliar / topicSize;
      const newRatio = familiarInTopic / topicSize;
      if (prevRatio < 0.9 && newRatio >= 0.9) {
        celebrations.push({ type: "readiness-green", topic });
      }

      set({
        progress: newProgress,
        globalConsecutiveCorrect: newGlobalStreak,
      });

      if (state.userId) {
        upsertToSupabase(state.userId, questionId, updated);
      }

      return celebrations;
    },

    toggleBookmark: (questionId) => {
      const state = get();
      const prev = state.progress[questionId] ?? { ...DEFAULT_PROGRESS };
      const updated = { ...prev, bookmarked: !prev.bookmarked };
      set({
        progress: {
          ...state.progress,
          [questionId]: updated,
        },
      });

      if (state.userId) {
        upsertToSupabase(state.userId, questionId, updated);
      }
    },

    submitExamAnswers: (answers, passed) => {
      const state = get();
      const celebrations: CelebrationEvent[] = [];
      const newProgress = { ...state.progress };

      for (const { questionId, isCorrect } of answers) {
        const prev = newProgress[questionId] ?? { ...DEFAULT_PROGRESS };
        const updated: QuestionProgress = {
          ...prev,
          attempts: prev.attempts + 1,
        };
        if (isCorrect) {
          updated.correctCount += 1;
          updated.consecutiveCorrect = prev.consecutiveCorrect + 1;
          if (updated.consecutiveCorrect >= 2) updated.mastery = "familiar";
          else if (updated.mastery === "unseen") updated.mastery = "learning";
        } else {
          updated.mastery = "learning";
          updated.consecutiveCorrect = 0;
        }
        newProgress[questionId] = updated;
      }

      if (passed) {
        celebrations.push({ type: "exam-passed" });
      }

      set({ progress: newProgress });

      if (state.userId) {
        const rows = answers.map(({ questionId }) => {
          const p = newProgress[questionId];
          return {
            user_id: state.userId!,
            question_id: questionId,
            mastery: p.mastery,
            consecutive_correct: p.consecutiveCorrect,
            attempts: p.attempts,
            correct_count: p.correctCount,
            bookmarked: p.bookmarked,
          };
        });
        const supabase = createSupabaseBrowser();
        supabase
          .from("user_progress")
          .upsert(rows, { onConflict: "user_id,question_id" })
          .then(({ error }) => {
            if (error) console.error("Failed to batch upsert exam progress:", error);
          });
      }

      return celebrations;
    },

    getProgress: (questionId) => {
      return get().progress[questionId] ?? DEFAULT_PROGRESS;
    },

    getMistakes: () => {
      const { progress } = get();
      return Object.entries(progress)
        .filter(([, p]) => p.mastery === "learning" && p.consecutiveCorrect === 0)
        .map(([id]) => Number(id));
    },

    getBookmarks: () => {
      const { progress } = get();
      return Object.entries(progress)
        .filter(([, p]) => p.bookmarked)
        .map(([id]) => Number(id));
    },

    getMasteryBreakdown: () => {
      const { progress } = get();
      let familiar = 0;
      let learning = 0;
      for (const p of Object.values(progress)) {
        if (p.mastery === "familiar") familiar++;
        else if (p.mastery === "learning") learning++;
      }
      return { unseen: 300 - familiar - learning, learning, familiar };
    },

    getMasteryBreakdownByTopic: (topic) => {
      const { progress } = get();
      const [start, end] = TOPIC_RANGES[topic];
      const total = end - start + 1;
      let familiar = 0;
      let learning = 0;
      for (let id = start; id <= end; id++) {
        const p = progress[id];
        if (p?.mastery === "familiar") familiar++;
        else if (p?.mastery === "learning") learning++;
      }
      return { unseen: total - familiar - learning, learning, familiar, total };
    },

    getReadiness: (topic) => {
      const { familiar, total } = get().getMasteryBreakdownByTopic(topic);
      const ratio = familiar / total;
      if (ratio >= 0.9) return "green";
      const amberThreshold = topic === "binnen" ? 0.75 : 0.7;
      if (ratio >= amberThreshold) return "amber";
      return "red";
    },

    getTotalAttempts: () => {
      return Object.values(get().progress).reduce((sum, p) => sum + p.attempts, 0);
    },

    getTotalCorrect: () => {
      return Object.values(get().progress).reduce((sum, p) => sum + p.correctCount, 0);
    },
  }),
  {
    name: "leinen-los-progress",
    partialize: (state) => ({
      progress: state.progress,
      globalConsecutiveCorrect: state.globalConsecutiveCorrect,
    }),
  }
  )
);
