"use client";

interface SessionResult {
  questionId: number;
  correct: boolean;
}

interface SessionSummaryProps {
  results: SessionResult[];
  onStartAnother: () => void;
  onBackToHome: () => void;
}

export function SessionSummary({
  results,
  onStartAnother,
  onBackToHome,
}: SessionSummaryProps) {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="mx-auto max-w-md rounded-xl border border-sky bg-white p-6 text-center">
      <h2 className="mb-1 text-xl font-semibold">Session Complete!</h2>
      <p className="mb-6 text-sm text-muted">
        {total} questions answered
      </p>

      <div className="mb-6">
        <div className="text-4xl font-bold text-navy">
          {correct} / {total}
        </div>
        <div className="mt-1 text-sm text-muted">
          {percentage}% correct
        </div>
      </div>

      <div className="mb-6 h-3 overflow-hidden rounded-full bg-sky">
        <div
          className="h-full rounded-full bg-correct transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onStartAnother}
          className="rounded-xl bg-ocean px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
        >
          Start Another Session
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
