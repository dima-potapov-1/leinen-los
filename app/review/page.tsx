"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Bookmark, ListX } from "lucide-react";
import type { Question, Language } from "@/types";
import { useProgressStore, type CelebrationEvent } from "@/hooks/useProgressStore";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import { getQuestions } from "@/lib/data-layer";
import { trackEvent } from "@/lib/analytics";
import { QuestionCard } from "@/components/QuestionCard";
import { SessionSummary } from "@/components/SessionSummary";
import { CelebrationToast } from "@/components/CelebrationToast";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";

type Tab = "mistakes" | "bookmarks";
type Phase = "list" | "practice" | "summary";

interface SessionResult {
  questionId: number;
  correct: boolean;
}

export default function ReviewPage() {
  const router = useRouter();
  const hydrated = useProgressStore((s) => s.hydrated);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [tab, setTab] = useState<Tab>("mistakes");
  const [phase, setPhase] = useState<Phase>("list");
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<SessionResult[]>([]);
  const [toast, setToast] = useState<CelebrationEvent | null>(null);
  const [overlay, setOverlay] = useState<CelebrationEvent | null>(null);
  const [reviewStartTime, setReviewStartTime] = useState<number>(0);
  const [reviewTab, setReviewTab] = useState<Tab>("mistakes");
  const sessionSeedRef = useRef<number>(0);

  const progress = useProgressStore((s) => s.progress);
  const primaryLang = usePreferencesStore((s) => s.primaryLanguage);
  const incrementAnswered = usePreferencesStore((s) => s.incrementTodayAnswered);

  const mistakes = useMemo(
    () => Object.entries(progress)
      .filter(([, p]) => p.mastery === "learning" && p.consecutiveCorrect === 0)
      .map(([id]) => Number(id)),
    [progress]
  );
  const bookmarks = useMemo(
    () => Object.entries(progress).filter(([, p]) => p.bookmarked).map(([id]) => Number(id)),
    [progress]
  );

  useEffect(() => {
    getQuestions().then(setAllQuestions);
  }, []);

  const activeIds = tab === "mistakes" ? mistakes : bookmarks;
  const activeQuestions = allQuestions.filter((q) => activeIds.includes(q.id));

  const startPractice = useCallback(() => {
    if (activeQuestions.length === 0) return;
    const sorted = [...activeQuestions].sort((a, b) => a.id - b.id);
    setPracticeQuestions(sorted);
    setCurrentIndex(0);
    setResults([]);
    sessionSeedRef.current = Date.now();
    setReviewStartTime(sessionSeedRef.current);
    setReviewTab(tab);
    setPhase("practice");
    trackEvent("review_session_start", {
      tab,
      question_count: sorted.length,
    });
  }, [activeQuestions, tab]);

  const handleAnswered = useCallback(
    (isCorrect: boolean, celebrations: CelebrationEvent[]) => {
      setResults((prev) => [
        ...prev,
        { questionId: practiceQuestions[currentIndex].id, correct: isCorrect },
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
    [practiceQuestions, currentIndex, incrementAnswered]
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= practiceQuestions.length) {
      trackEvent("review_session_complete", {
        tab: reviewTab,
        correct: results.filter((r) => r.correct).length,
        total: practiceQuestions.length,
        duration_seconds: Math.round((Date.now() - reviewStartTime) / 1000),
      });
      setPhase("summary");
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, practiceQuestions.length, results, reviewTab, reviewStartTime]);

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
          onStartAnother={startPractice}
          onBackToHome={() => router.push("/")}
        />
      </div>
    );
  }

  if (phase === "practice" && practiceQuestions.length > 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => setPhase("list")}
            className="text-sm text-ocean hover:underline"
          >
            ← Back to list
          </button>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-sky">
            <div
              className="h-full rounded-full bg-ocean transition-all"
              style={{
                width: `${((currentIndex + 1) / practiceQuestions.length) * 100}%`,
              }}
            />
          </div>
          <span className="text-xs text-muted">
            {currentIndex + 1} / {practiceQuestions.length}
          </span>
        </div>

        <QuestionCard
          key={practiceQuestions[currentIndex].id}
          question={practiceQuestions[currentIndex]}
          index={currentIndex}
          total={practiceQuestions.length}
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
      <h1 className="mb-6 text-xl font-semibold">Review</h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-sky p-1">
        <button
          onClick={() => setTab("mistakes")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "mistakes" ? "bg-white text-navy shadow-sm" : "text-muted"
          }`}
        >
          <ListX className="h-4 w-4" />
          Mistakes ({mistakes.length})
        </button>
        <button
          onClick={() => setTab("bookmarks")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "bookmarks" ? "bg-white text-navy shadow-sm" : "text-muted"
          }`}
        >
          <Bookmark className="h-4 w-4" />
          Bookmarks ({bookmarks.length})
        </button>
      </div>

      {activeQuestions.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-lg font-medium text-muted">
            {tab === "mistakes"
              ? "No mistakes to review!"
              : "No bookmarked questions yet."}
          </p>
          <p className="mt-1 text-sm text-muted">
            {tab === "mistakes"
              ? "Keep studying — you'll see wrong answers here."
              : "Tap the bookmark icon on any question to save it."}
          </p>
        </div>
      ) : (
        <>
          <button
            onClick={startPractice}
            className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-ocean px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
          >
            <RotateCcw className="h-4 w-4" />
            Practice {activeQuestions.length}{" "}
            {tab === "mistakes" ? "mistakes" : "bookmarks"}
          </button>

          <div className="flex flex-col gap-2">
            {activeQuestions.map((q) => (
              <div
                key={q.id}
                className="rounded-lg border border-sky bg-white px-4 py-3 text-sm"
              >
                <span className="mr-2 font-medium text-ocean">Q.{q.id}</span>
                <span className="text-navy/80">
                  {(q[`question_${primaryLang}` as keyof Question] as string).slice(0, 80)}
                  {(q[`question_${primaryLang}` as keyof Question] as string).length > 80 ? "..." : ""}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
