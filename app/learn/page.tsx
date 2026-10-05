"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import type { Question, Topic } from "@/types";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import { useProgressStore, type CelebrationEvent } from "@/hooks/useProgressStore";
import { getQuestions } from "@/lib/data-layer";
import { selectSessionQuestions } from "@/lib/question-selection";
import { trackEvent } from "@/lib/analytics";
import { QuestionCard } from "@/components/QuestionCard";
import { SessionSummary } from "@/components/SessionSummary";
import { CelebrationToast } from "@/components/CelebrationToast";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";

type SessionPhase = "topic-select" | "studying" | "summary";

interface SessionResult {
  questionId: number;
  correct: boolean;
}

const TOPICS: { id: Topic | "all"; label: string; count: number }[] = [
  { id: "all", label: "All Questions", count: 300 },
  { id: "basis", label: "Basis", count: 72 },
  { id: "binnen", label: "Binnen", count: 181 },
  { id: "segeln", label: "Segel", count: 47 },
];

export default function LearnPage() {
  const router = useRouter();
  const hydrated = useProgressStore((s) => s.hydrated);
  const sessionSize = usePreferencesStore((s) => s.sessionSize);
  const questionOrder = usePreferencesStore((s) => s.questionOrder);
  const incrementAnswered = usePreferencesStore((s) => s.incrementTodayAnswered);
  const getLearnResumePosition = usePreferencesStore((s) => s.getLearnResumePosition);
  const setLearnResumePosition = usePreferencesStore((s) => s.setLearnResumePosition);
  const progress = useProgressStore((s) => s.progress);

  const [phase, setPhase] = useState<SessionPhase>("topic-select");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [sessionQuestions, setSessionQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [toast, setToast] = useState<CelebrationEvent | null>(null);
  const [overlay, setOverlay] = useState<CelebrationEvent | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [sessionCategory, setSessionCategory] = useState<string>("all");
  const sessionSeedRef = useRef<number>(0);

  useEffect(() => {
    getQuestions().then(setAllQuestions);
  }, []);

  const startSession = useCallback(
    (topicId: Topic | "all") => {
      const topic = topicId === "all" ? undefined : topicId;
      const resumeFromId = questionOrder === "sequential"
        ? getLearnResumePosition(topicId)
        : 0;
      const selected = selectSessionQuestions(
        allQuestions,
        progress,
        sessionSize,
        topic,
        questionOrder,
        resumeFromId
      );
      if (selected.length === 0) return;
      setSessionQuestions(selected);
      setCurrentIndex(0);
      setResults([]);
      sessionSeedRef.current = Date.now();
      setSessionStartTime(sessionSeedRef.current);
      setSessionCategory(topicId);
      setPhase("studying");
      trackEvent("learning_session_start", {
        category: topicId,
        session_size: selected.length,
        question_order: questionOrder,
      });
    },
    [allQuestions, progress, sessionSize, questionOrder, getLearnResumePosition]
  );

  const handleAnswered = useCallback(
    (isCorrect: boolean, celebrations: CelebrationEvent[]) => {
      setResults((prev) => [
        ...prev,
        { questionId: sessionQuestions[currentIndex].id, correct: isCorrect },
      ]);
      incrementAnswered();

      const overlayEvent = celebrations.find(
        (e) =>
          e.type === "category-complete" ||
          e.type === "readiness-green" ||
          e.type === "exam-passed"
      );
      const toastEvent = celebrations.find(
        (e) => e.type === "first-answer" || e.type === "correct-streak-10"
      );

      if (overlayEvent) setOverlay(overlayEvent);
      else if (toastEvent) setToast(toastEvent);
    },
    [sessionQuestions, currentIndex, incrementAnswered]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= sessionQuestions.length) {
      trackEvent("learning_session_complete", {
        category: sessionCategory,
        session_size: sessionQuestions.length,
        correct: results.filter((r) => r.correct).length,
        total: sessionQuestions.length,
        duration_seconds: Math.round((Date.now() - sessionStartTime) / 1000),
      });
      if (questionOrder === "sequential") {
        const maxId = Math.max(...sessionQuestions.map((q) => q.id));
        setLearnResumePosition(sessionCategory, maxId + 1);
      }
      setPhase("summary");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, sessionQuestions, results, sessionCategory, sessionStartTime, questionOrder, setLearnResumePosition]);

  if (!hydrated || allQuestions.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (phase === "summary") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <SessionSummary
          results={results}
          onStartAnother={() => setPhase("topic-select")}
          onBackToHome={() => router.push("/")}
        />
      </div>
    );
  }

  if (phase === "studying" && sessionQuestions.length > 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        {/* Progress bar */}
        <div className="mb-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-sky">
            <div
              className="h-full rounded-full bg-ocean transition-all"
              style={{
                width: `${((currentIndex + 1) / sessionQuestions.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted">
            {currentIndex + 1} / {sessionQuestions.length}
          </span>
        </div>

        <QuestionCard
          key={sessionQuestions[currentIndex].id}
          question={sessionQuestions[currentIndex]}
          index={currentIndex}
          total={sessionQuestions.length}
          mode="learning"
          sessionSeed={sessionSeedRef.current}
          onAnswered={handleAnswered}
          onNext={handleNext}
        />

        {toast && (
          <CelebrationToast event={toast} onDismiss={() => setToast(null)} />
        )}
        {overlay && (
          <CelebrationOverlay event={overlay} onDismiss={() => setOverlay(null)} />
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-ocean" />
        <h1 className="text-xl font-semibold">Learn</h1>
      </div>

      <p className="mb-6 text-sm text-muted">
        Choose a category to start a session of {sessionSize} questions.
      </p>

      <div className="flex flex-col gap-3">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => startSession(t.id)}
            className="flex items-center justify-between rounded-xl border border-sky bg-white px-5 py-4 text-left transition-colors hover:border-ocean hover:bg-sky/50"
          >
            <span className="font-medium">{t.label}</span>
            <span className="text-sm text-muted">{t.count} questions</span>
          </button>
        ))}
      </div>
    </div>
  );
}
