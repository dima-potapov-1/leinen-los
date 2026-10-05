"use client";

import type { ExamScoring } from "@/lib/exam";
import { cn } from "@/lib/utils";

interface ExamResultProps {
  scoring: ExamScoring;
  examLabel: string;
  onBackToHome: () => void;
  onTryAgain: () => void;
  onReviewMistakes?: () => void;
  mistakeCount?: number;
}

export function ExamResult({
  scoring,
  examLabel,
  onBackToHome,
  onTryAgain,
  onReviewMistakes,
  mistakeCount,
}: ExamResultProps) {
  return (
    <div className="mx-auto max-w-md rounded-xl border border-sky bg-white p-6 text-center">
      <div className="mb-4 text-5xl">{scoring.passed ? "🎉" : "⚓"}</div>
      <h2
        className={cn(
          "mb-1 text-2xl font-bold",
          scoring.passed ? "text-correct" : "text-wrong"
        )}
      >
        {scoring.passed ? "Bestanden!" : "Nicht bestanden"}
      </h2>
      <p className="mb-6 text-sm text-muted">{examLabel}</p>

      <div className="mb-6 space-y-2 text-sm">
        <ResultRow label="Basis" correct={scoring.basisCorrect} total={scoring.basisTotal} />
        <ResultRow label="Binnen" correct={scoring.binnenCorrect} total={scoring.binnenTotal} />
        {scoring.segelTotal > 0 && (
          <ResultRow label="Segel" correct={scoring.segelCorrect} total={scoring.segelTotal} />
        )}
        <div className="border-t border-sky pt-2">
          <ResultRow
            label="Total"
            correct={scoring.totalCorrect}
            total={scoring.totalQuestions}
            bold
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {onReviewMistakes && mistakeCount !== undefined && mistakeCount > 0 && (
          <button
            onClick={onReviewMistakes}
            className="rounded-xl bg-wrong/10 px-6 py-3 text-sm font-semibold text-wrong transition-colors hover:bg-wrong/20"
          >
            Review {mistakeCount} Mistake{mistakeCount !== 1 ? "s" : ""}
          </button>
        )}
        <button
          onClick={onTryAgain}
          className="rounded-xl bg-ocean px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
        >
          Try Another Exam
        </button>
        <button
          onClick={onBackToHome}
          className="rounded-xl border border-sky px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-sky/50"
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  correct,
  total,
  bold,
}: {
  label: string;
  correct: number;
  total: number;
  bold?: boolean;
}) {
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className={cn("flex items-center justify-between", bold && "font-semibold")}>
      <span>{label}</span>
      <span>
        {correct}/{total}{" "}
        <span className="text-muted">({percentage}%)</span>
      </span>
    </div>
  );
}
