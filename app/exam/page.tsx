"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck, ChevronLeft, ChevronRight, Grid3X3 } from "lucide-react";
import type { Question, ExamType } from "@/types";
import { useExamStore } from "@/hooks/useExamStore";
import { useProgressStore, type CelebrationEvent } from "@/hooks/useProgressStore";
import { getQuestions } from "@/lib/data-layer";
import {
  getExamTypes,
  drawRandomPaper,
  getQuestionIdsForExam,
  scoreExam,
  type ExamScoring,
} from "@/lib/exam";
import { trackEvent } from "@/lib/analytics";
import { ExamQuestionCard } from "@/components/ExamQuestionCard";
import { ExamTimer } from "@/components/ExamTimer";
import { ExamQuestionGrid } from "@/components/ExamQuestionGrid";
import { ExamResult } from "@/components/ExamResult";
import { ExamMistakeReview } from "@/components/ExamMistakeReview";
import { CelebrationOverlay } from "@/components/CelebrationOverlay";

type Phase = "select" | "active" | "result" | "review-mistakes";

export default function ExamPage() {
  const router = useRouter();
  const hydrated = useProgressStore((s) => s.hydrated);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [phase, setPhase] = useState<Phase>("select");
  const [showGrid, setShowGrid] = useState(false);
  const [scoring, setScoring] = useState<ExamScoring | null>(null);
  const [overlay, setOverlay] = useState<CelebrationEvent | null>(null);
  const [examLabel, setExamLabel] = useState("Exam");
  const [savedAnswers, setSavedAnswers] = useState<Record<number, number>>({});
  const [savedQuestionIds, setSavedQuestionIds] = useState<number[]>([]);
  const [savedSessionSeed, setSavedSessionSeed] = useState(0);

  const examStore = useExamStore();
  const submitExamAnswers = useProgressStore((s) => s.submitExamAnswers);

  useEffect(() => {
    getQuestions().then(setAllQuestions);
  }, []);

  useEffect(() => {
    if (hydrated && examStore.active) {
      setPhase("active");
    }
  }, [hydrated, examStore.active]);

  const examTypes = getExamTypes();

  const startExam = useCallback(
    (examType: ExamType) => {
      const paper = drawRandomPaper();
      const questionIds = getQuestionIdsForExam(paper, examType);
      const config = examTypes[examType];
      setExamLabel(config.label);
      examStore.startExam(examType, paper, questionIds, config.time_minutes * 60);
      setPhase("active");
      trackEvent("exam_session_start", {
        exam_type: examType,
        paper_id: paper.id,
      });
    },
    [examTypes, examStore]
  );

  const finishExam = useCallback(() => {
    if (!examStore.paper || !examStore.examType) return;

    const correctMap = new Map<number, number>();
    for (const q of allQuestions) {
      correctMap.set(q.id, q.correct_option);
    }

    const answersMap = new Map<number, number>();
    for (const [qid, opt] of Object.entries(examStore.answers)) {
      answersMap.set(Number(qid), opt);
    }

    const result = scoreExam(answersMap, examStore.paper, examStore.examType, correctMap);
    setScoring(result);
    setExamLabel(examTypes[examStore.examType]?.label ?? "Exam");

    const examAnswers = examStore.questionIds.map((qid) => ({
      questionId: qid,
      isCorrect: answersMap.get(qid) === correctMap.get(qid),
    }));
    const celebrations = submitExamAnswers(examAnswers, result.passed);

    const durationSec = examStore.startedAt
      ? Math.round((Date.now() - examStore.startedAt) / 1000)
      : 0;

    trackEvent("exam_session_complete", {
      exam_type: examStore.examType,
      paper_id: examStore.paper?.id,
      passed: result.passed,
      basis_correct: result.basisCorrect,
      binnen_correct: result.binnenCorrect,
      segel_correct: result.segelCorrect,
      duration_seconds: durationSec,
    });

    setSavedAnswers({ ...examStore.answers });
    setSavedQuestionIds([...examStore.questionIds]);
    setSavedSessionSeed(examStore.startedAt ?? 0);
    examStore.clearExam();
    setPhase("result");

    const overlayEvt = celebrations.find((e) => e.type === "exam-passed");
    if (overlayEvt) setOverlay(overlayEvt);
  }, [examStore, allQuestions, submitExamAnswers, examTypes]);

  if (!hydrated || allQuestions.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (phase === "review-mistakes" && scoring) {
    const mistakeData = savedQuestionIds
      .filter((qid) => {
        const q = allQuestions.find((aq) => aq.id === qid);
        return q && savedAnswers[qid] !== q.correct_option;
      })
      .map((qid) => ({
        question: allQuestions.find((aq) => aq.id === qid)!,
        userAnswer: savedAnswers[qid] as number | undefined,
      }));

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <ExamMistakeReview
          mistakes={mistakeData}
          sessionSeed={savedSessionSeed}
          onBack={() => setPhase("result")}
        />
      </div>
    );
  }

  if (phase === "result" && scoring) {
    const mistakeCount = savedQuestionIds.filter((qid) => {
      const q = allQuestions.find((aq) => aq.id === qid);
      return q && savedAnswers[qid] !== q.correct_option;
    }).length;

    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <ExamResult
          scoring={scoring}
          examLabel={examLabel}
          onTryAgain={() => setPhase("select")}
          onBackToHome={() => router.push("/")}
          onReviewMistakes={() => setPhase("review-mistakes")}
          mistakeCount={mistakeCount}
        />
        {overlay && (
          <CelebrationOverlay event={overlay} onDismiss={() => setOverlay(null)} />
        )}
      </div>
    );
  }

  if (phase === "active" && examStore.active) {
    const currentQId = examStore.questionIds[examStore.currentIndex];
    const currentQuestion = allQuestions.find((q) => q.id === currentQId);
    const answeredCount = Object.keys(examStore.answers).length;

    if (!currentQuestion) return null;

    return (
      <div className="mx-auto max-w-2xl px-4 py-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm font-medium">
            {examStore.currentIndex + 1} / {examStore.questionIds.length}
          </div>
          <div className="flex items-center gap-2">
            {examStore.startedAt && (
              <ExamTimer
                startedAt={examStore.startedAt}
                timeLimitSec={examStore.timeLimit}
                onTimeUp={finishExam}
              />
            )}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className="rounded-full bg-sky p-2 text-navy hover:bg-ocean/20"
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showGrid && (
          <div className="mb-4 rounded-xl border border-sky bg-white p-3">
            <ExamQuestionGrid
              questionIds={examStore.questionIds}
              answers={examStore.answers}
              currentIndex={examStore.currentIndex}
              onGoTo={(idx) => {
                examStore.goToQuestion(idx);
                setShowGrid(false);
              }}
            />
          </div>
        )}

        <ExamQuestionCard
          key={currentQId}
          question={currentQuestion}
          index={examStore.currentIndex}
          total={examStore.questionIds.length}
          selectedOption={examStore.answers[currentQId]}
          sessionSeed={examStore.startedAt ?? 0}
          onSelect={(opt) => examStore.setAnswer(currentQId, opt)}
        />

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() =>
              examStore.goToQuestion(Math.max(0, examStore.currentIndex - 1))
            }
            disabled={examStore.currentIndex === 0}
            className="flex items-center gap-1 rounded-lg border border-sky px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-sky disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" /> Previous
          </button>

          {examStore.currentIndex < examStore.questionIds.length - 1 ? (
            <button
              onClick={() =>
                examStore.goToQuestion(examStore.currentIndex + 1)
              }
              className="flex items-center gap-1 rounded-lg border border-sky px-4 py-2 text-sm font-medium text-navy transition-colors hover:bg-sky"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={finishExam}
              className="rounded-lg bg-ocean px-6 py-2 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
            >
              Submit ({answeredCount}/{examStore.questionIds.length})
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <ClipboardCheck className="h-5 w-5 text-ocean" />
        <h1 className="text-xl font-semibold">Practice Exam</h1>
      </div>

      <div className="flex flex-col gap-4">
        {(
          Object.entries(examTypes) as [ExamType, (typeof examTypes)[ExamType]][]
        ).map(([type, config]) => (
          <div key={type} className="rounded-xl border border-sky bg-white p-5">
            <h2 className="mb-1 font-medium">{config.label}</h2>
            <p className="mb-4 text-sm text-muted">
              {config.time_minutes} minutes
            </p>
            <div className="mb-4 text-sm">
              {config.pass_rules.basis_min !== undefined && (
                <div className="flex justify-between border-b border-sky py-1.5">
                  <span>Basis</span>
                  <span className="text-muted">
                    ≥ {config.pass_rules.basis_min}/7
                  </span>
                </div>
              )}
              {config.pass_rules.binnen_min !== undefined && (
                <div className="flex justify-between border-b border-sky py-1.5">
                  <span>Binnen</span>
                  <span className="text-muted">
                    ≥ {config.pass_rules.binnen_min}/23
                  </span>
                </div>
              )}
              {config.pass_rules.segel_min !== undefined && (
                <div className="flex justify-between border-b border-sky py-1.5">
                  <span>Segel</span>
                  <span className="text-muted">
                    ≥ {config.pass_rules.segel_min}/7
                  </span>
                </div>
              )}
              {config.pass_rules.total_min !== undefined && (
                <div className="flex justify-between py-1.5">
                  <span>Total</span>
                  <span className="text-muted">
                    ≥ {config.pass_rules.total_min}
                  </span>
                </div>
              )}
            </div>
            <button
              onClick={() => startExam(type)}
              className="w-full rounded-xl bg-ocean px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
            >
              Start Exam
            </button>
          </div>
        ))}
      </div>

      <p className="mt-6 text-center text-xs text-muted">
        A random Prüfungsbogen (exam paper) will be drawn from the 15 official
        papers.
      </p>
    </div>
  );
}
