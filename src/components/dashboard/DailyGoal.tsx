"use client";

import { Target } from "lucide-react";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";

export function DailyGoal() {
  const todayAnswered = usePreferencesStore((s) => s.todayAnswered);
  const sessionSize = usePreferencesStore((s) => s.sessionSize);

  const progress = Math.min(todayAnswered / sessionSize, 1);
  const met = todayAnswered >= sessionSize;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-sky bg-white px-4 py-3">
      <Target className={`h-5 w-5 ${met ? "text-correct" : "text-muted"}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            {met ? "Daily goal met!" : "Daily goal"}
          </span>
          <span className="text-muted">
            {todayAnswered} / {sessionSize}
          </span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sky">
          <div
            className={`h-full rounded-full transition-all ${met ? "bg-correct" : "bg-ocean"}`}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
