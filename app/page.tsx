"use client";

import { Columns2, BookOpen, ClipboardCheck } from "lucide-react";
import Link from "next/link";
import { useProgressStore } from "@/hooks/useProgressStore";
import { useAuth } from "@/hooks/useAuth";
import { MasteryBar } from "@/components/dashboard/MasteryBar";
import { ReadinessIndicator } from "@/components/dashboard/ReadinessIndicator";
import { StreakBadge } from "@/components/dashboard/StreakBadge";
import { ExamCountdown } from "@/components/dashboard/ExamCountdown";
import { DailyGoal } from "@/components/dashboard/DailyGoal";

export default function HomePage() {
  const hydrated = useProgressStore((s) => s.hydrated);
  const { user, loading: authLoading } = useAuth();

  const userInitial = user?.email?.charAt(0).toUpperCase() ?? "?";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚓</span>
          <div>
            <h1 className="text-2xl font-semibold">Leinen los!</h1>
            <p className="text-sm text-muted">SBF Binnen — Motor + Segel</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hydrated && <StreakBadge />}
          {user && (
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full bg-ocean text-xs font-semibold text-white"
              title={user.email ?? "Signed in"}
            >
              {userInitial}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <MasteryBar />
        <ReadinessIndicator />
        <ExamCountdown />
        <DailyGoal />
      </div>
      {!hydrated && authLoading && (
        <p className="mt-2 text-center text-xs text-muted">
          Syncing progress…
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        <Link
          href="/explore"
          className="flex items-center justify-center gap-2 rounded-xl border border-ocean px-6 py-3.5 text-sm font-semibold text-ocean transition-colors hover:bg-sky"
        >
          <Columns2 className="h-4 w-4" />
          Start Explore Session
        </Link>
        <Link
          href="/learn"
          className="flex items-center justify-center gap-2 rounded-xl bg-ocean px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
        >
          <BookOpen className="h-4 w-4" />
          Start Learn Session
        </Link>
        <Link
          href="/exam"
          className="flex items-center justify-center gap-2 rounded-xl border border-ocean px-6 py-3.5 text-sm font-semibold text-ocean transition-colors hover:bg-sky"
        >
          <ClipboardCheck className="h-4 w-4" />
          Practice Exam
        </Link>
      </div>
    </div>
  );
}
