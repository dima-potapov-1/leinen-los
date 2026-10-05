import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Language, Topic, QuestionOrder } from "@/types";
import { createSupabaseBrowser } from "@/lib/supabase-client";

export type { QuestionOrder };

type ExplorePositions = Record<string, number>;
type LearnResumePositions = Record<string, number>;

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  return dateStr === new Date().toISOString().slice(0, 10);
}

function isYesterday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateStr === yesterday.toISOString().slice(0, 10);
}

interface PreferencesState {
  primaryLanguage: Language;
  secondaryLanguage: Language;
  sessionSize: number;
  questionOrder: QuestionOrder;
  shuffleAnswers: boolean;
  examDate: string | null;
  streakCount: number;
  lastStudyDate: string | null;
  todayAnswered: number;
  explorePositions: ExplorePositions;
  learnResumePositions: LearnResumePositions;
  userId: string | null;
  hydrated: boolean;

  hydrateFromServer: (userId: string) => Promise<void>;
  clearForLogout: () => void;

  setPrimaryLanguage: (lang: Language) => void;
  setSecondaryLanguage: (lang: Language) => void;
  setSessionSize: (size: number) => void;
  setQuestionOrder: (order: QuestionOrder) => void;
  setShuffleAnswers: (on: boolean) => void;
  setExamDate: (date: string | null) => void;
  incrementTodayAnswered: () => void;
  getExplorePosition: (topicId: Topic | "all") => number;
  setExplorePosition: (topicId: Topic | "all", index: number) => void;
  getLearnResumePosition: (topicId: string) => number;
  setLearnResumePosition: (topicId: string, questionId: number) => void;
}

const COUNTER_VERSION = 2;

let exploreSyncTimer: ReturnType<typeof setTimeout> | null = null;
let learnResumeSyncTimer: ReturnType<typeof setTimeout> | null = null;

function syncToServer(userId: string, state: PreferencesState) {
  const supabase = createSupabaseBrowser();
  supabase
    .from("profiles")
    .update({
      preferences: {
        primary_language: state.primaryLanguage,
        secondary_language: state.secondaryLanguage,
        session_size: state.sessionSize,
        question_order: state.questionOrder,
        shuffle_answers: state.shuffleAnswers,
        exam_date: state.examDate,
        streak_count: state.streakCount,
        last_study_date: state.lastStudyDate,
        today_answered: state.todayAnswered,
        counter_version: COUNTER_VERSION,
        explore_positions: state.explorePositions,
        learn_resume_positions: state.learnResumePositions,
      },
    })
    .eq("id", userId)
    .then(({ error }) => {
      if (error) console.error("Failed to sync preferences:", error);
    });
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
  (set, get) => ({
    primaryLanguage: "de",
    secondaryLanguage: "en",
    sessionSize: 10,
    questionOrder: "random" as QuestionOrder,
    shuffleAnswers: false,
    examDate: null,
    streakCount: 0,
    lastStudyDate: null,
    todayAnswered: 0,
    explorePositions: {},
    learnResumePositions: {},
    userId: null,
    hydrated: false,

    hydrateFromServer: async (userId) => {
      const supabase = createSupabaseBrowser();

      const profileResult = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", userId)
        .single();

      if (profileResult.error || !profileResult.data?.preferences) {
        console.error("Failed to fetch preferences:", profileResult.error);
        set({ userId, hydrated: true });
        return;
      }

      const prefs = profileResult.data.preferences as Record<string, unknown>;
      const today = new Date().toISOString().slice(0, 10);
      const lastStudyDateOnServer = (prefs.last_study_date as string | null) ?? null;
      const storedVersion = (prefs.counter_version as number) ?? 0;
      const todayAnswered =
        storedVersion >= COUNTER_VERSION && lastStudyDateOnServer === today
          ? ((prefs.today_answered as number) ?? 0)
          : 0;
      const lastStudyDate = todayAnswered > 0
        ? today
        : lastStudyDateOnServer;

      set({
        primaryLanguage: (prefs.primary_language as Language) ?? "de",
        secondaryLanguage: (prefs.secondary_language as Language) ?? "en",
        sessionSize: (prefs.session_size as number) ?? 10,
        questionOrder: (prefs.question_order as QuestionOrder) ?? "random",
        shuffleAnswers: (prefs.shuffle_answers as boolean) ?? false,
        examDate: (prefs.exam_date as string | null) ?? null,
        streakCount: (prefs.streak_count as number) ?? 0,
        lastStudyDate,
        todayAnswered,
        explorePositions: (prefs.explore_positions as ExplorePositions) ?? {},
        learnResumePositions: (prefs.learn_resume_positions as LearnResumePositions) ?? {},
        userId,
        hydrated: true,
      });
    },

    clearForLogout: () => {
      set({ userId: null, hydrated: false });
    },

    setPrimaryLanguage: (lang) => {
      const state = get();
      if (lang === state.secondaryLanguage) {
        set({ primaryLanguage: lang, secondaryLanguage: state.primaryLanguage });
      } else {
        set({ primaryLanguage: lang });
      }
      const updated = get();
      if (updated.userId) syncToServer(updated.userId, updated);
    },

    setSecondaryLanguage: (lang) => {
      const state = get();
      if (lang === state.primaryLanguage) {
        set({ secondaryLanguage: lang, primaryLanguage: state.secondaryLanguage });
      } else {
        set({ secondaryLanguage: lang });
      }
      const updated = get();
      if (updated.userId) syncToServer(updated.userId, updated);
    },

    setSessionSize: (size) => {
      set({ sessionSize: Math.max(5, Math.min(30, size)) });
      const state = get();
      if (state.userId) syncToServer(state.userId, state);
    },

    setQuestionOrder: (order) => {
      set({ questionOrder: order });
      const state = get();
      if (state.userId) syncToServer(state.userId, state);
    },

    setShuffleAnswers: (on) => {
      set({ shuffleAnswers: on });
      const state = get();
      if (state.userId) syncToServer(state.userId, state);
    },

    setExamDate: (date) => {
      set({ examDate: date });
      const state = get();
      if (state.userId) syncToServer(state.userId, state);
    },

    getExplorePosition: (topicId) => {
      return get().explorePositions[topicId] ?? 0;
    },

    setExplorePosition: (topicId, index) => {
      const state = get();
      const newPositions = { ...state.explorePositions, [topicId]: index };
      set({ explorePositions: newPositions });
      if (state.userId) {
        if (exploreSyncTimer) clearTimeout(exploreSyncTimer);
        exploreSyncTimer = setTimeout(() => {
          const latest = get();
          if (latest.userId) syncToServer(latest.userId, latest);
        }, 2000);
      }
    },

    getLearnResumePosition: (topicId) => {
      return get().learnResumePositions[topicId] ?? 0;
    },

    setLearnResumePosition: (topicId, questionId) => {
      const state = get();
      const newPositions = { ...state.learnResumePositions, [topicId]: questionId };
      set({ learnResumePositions: newPositions });
      if (state.userId) {
        if (learnResumeSyncTimer) clearTimeout(learnResumeSyncTimer);
        learnResumeSyncTimer = setTimeout(() => {
          const latest = get();
          if (latest.userId) syncToServer(latest.userId, latest);
        }, 2000);
      }
    },

    incrementTodayAnswered: () => {
      const state = get();
      const today = new Date().toISOString().slice(0, 10);

      if (!isToday(state.lastStudyDate)) {
        const newStreak = isYesterday(state.lastStudyDate)
          ? state.streakCount
          : 0;
        set({ todayAnswered: 1, lastStudyDate: today, streakCount: newStreak });
      } else {
        const newCount = state.todayAnswered + 1;
        const dailyGoalJustMet =
          newCount >= state.sessionSize && state.todayAnswered < state.sessionSize;
        set({
          todayAnswered: newCount,
          streakCount: dailyGoalJustMet
            ? state.streakCount + 1
            : state.streakCount,
        });
      }

      const updated = get();
      if (updated.userId) syncToServer(updated.userId, updated);
    },
  }),
  {
    name: "leinen-los-preferences",
    partialize: (state) => ({
      primaryLanguage: state.primaryLanguage,
      secondaryLanguage: state.secondaryLanguage,
      sessionSize: state.sessionSize,
      questionOrder: state.questionOrder,
      shuffleAnswers: state.shuffleAnswers,
      examDate: state.examDate,
      streakCount: state.streakCount,
      lastStudyDate: state.lastStudyDate,
      todayAnswered: state.todayAnswered,
      explorePositions: state.explorePositions,
      learnResumePositions: state.learnResumePositions,
    }),
  }
  )
);
