"use client";

import { Flame } from "lucide-react";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";

export function StreakBadge() {
  const streak = usePreferencesStore((s) => s.streakCount);

  if (streak === 0) return null;

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-learning/10 px-3 py-1">
      <Flame className="h-4 w-4 text-learning" />
      <span className="text-sm font-semibold text-learning">{streak}</span>
    </div>
  );
}
