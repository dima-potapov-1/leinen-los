"use client";

import { useMemo } from "react";
import { Calendar } from "lucide-react";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import { useProgressStore } from "@/hooks/useProgressStore";

export function ExamCountdown() {
  const examDate = usePreferencesStore((s) => s.examDate);
  const progress = useProgressStore((s) => s.progress);

  const familiar = useMemo(() => {
    let count = 0;
    for (const p of Object.values(progress)) {
      if (p.mastery === "familiar") count++;
    }
    return count;
  }, [progress]);

  if (!examDate) return null;

  const now = new Date();
  const target = new Date(examDate);
  const diffMs = target.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  const questionsToFamiliar = 300 - familiar;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-sky bg-white px-4 py-3">
      <Calendar className="h-5 w-5 text-ocean" />
      <div>
        <div className="text-sm font-medium">
          {daysLeft === 0 ? "Exam today!" : `${daysLeft} day${daysLeft !== 1 ? "s" : ""} until exam`}
        </div>
        {questionsToFamiliar > 0 && (
          <div className="text-xs text-muted">
            {questionsToFamiliar} question{questionsToFamiliar !== 1 ? "s" : ""} left to reach Familiar
          </div>
        )}
      </div>
    </div>
  );
}
