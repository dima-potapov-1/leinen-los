import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ExamType, ExamPaper } from "@/types";

interface ExamState {
  active: boolean;
  examType: ExamType | null;
  paper: ExamPaper | null;
  questionIds: number[];
  answers: Record<number, number>;
  currentIndex: number;
  startedAt: number | null;
  timeLimit: number;

  startExam: (examType: ExamType, paper: ExamPaper, questionIds: number[], timeLimitSec: number) => void;
  setAnswer: (questionId: number, optionIndex: number) => void;
  goToQuestion: (index: number) => void;
  clearExam: () => void;
}

export const useExamStore = create<ExamState>()(
  persist(
    (set) => ({
      active: false,
      examType: null,
      paper: null,
      questionIds: [],
      answers: {},
      currentIndex: 0,
      startedAt: null,
      timeLimit: 0,

      startExam: (examType, paper, questionIds, timeLimitSec) =>
        set({
          active: true,
          examType,
          paper,
          questionIds,
          answers: {},
          currentIndex: 0,
          startedAt: Date.now(),
          timeLimit: timeLimitSec,
        }),

      setAnswer: (questionId, optionIndex) =>
        set((state) => ({
          answers: { ...state.answers, [questionId]: optionIndex },
        })),

      goToQuestion: (index) => set({ currentIndex: index }),

      clearExam: () =>
        set({
          active: false,
          examType: null,
          paper: null,
          questionIds: [],
          answers: {},
          currentIndex: 0,
          startedAt: null,
          timeLimit: 0,
        }),
    }),
    { name: "leinen-los-exam" }
  )
);
