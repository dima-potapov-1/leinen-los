"use client";

import { cn } from "@/lib/utils";

interface ExamQuestionGridProps {
  questionIds: number[];
  answers: Record<number, number>;
  currentIndex: number;
  onGoTo: (index: number) => void;
}

export function ExamQuestionGrid({
  questionIds,
  answers,
  currentIndex,
  onGoTo,
}: ExamQuestionGridProps) {
  return (
    <div className="grid grid-cols-10 gap-1">
      {questionIds.map((qid, idx) => {
        const answered = qid in answers;
        const isCurrent = idx === currentIndex;

        return (
          <button
            key={qid}
            onClick={() => onGoTo(idx)}
            className={cn(
              "h-8 w-8 rounded text-xs font-medium transition-colors",
              isCurrent && "ring-2 ring-ocean",
              answered
                ? "bg-ocean text-white"
                : "bg-sky text-muted hover:bg-ocean/20"
            )}
          >
            {idx + 1}
          </button>
        );
      })}
    </div>
  );
}
