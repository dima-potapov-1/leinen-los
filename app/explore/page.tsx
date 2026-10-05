"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Columns2, ChevronLeft, ChevronRight, Bookmark } from "lucide-react";
import type { Question, Topic } from "@/types";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import { useProgressStore } from "@/hooks/useProgressStore";
import { getQuestions } from "@/lib/data-layer";
import { trackEvent } from "@/lib/analytics";
import { ExploreCard } from "@/components/ExploreCard";
import { cn } from "@/lib/utils";

type Phase = "topic-select" | "exploring";

const TOPICS: { id: Topic | "all"; label: string; count: number }[] = [
  { id: "all", label: "All Questions", count: 300 },
  { id: "basis", label: "Basis", count: 72 },
  { id: "binnen", label: "Binnen", count: 181 },
  { id: "segeln", label: "Segel", count: 47 },
];

export default function ExplorePage() {
  const hydrated = useProgressStore((s) => s.hydrated);
  const primaryLang = usePreferencesStore((s) => s.primaryLanguage);
  const secondaryLang = usePreferencesStore((s) => s.secondaryLanguage);
  const getExplorePosition = usePreferencesStore((s) => s.getExplorePosition);
  const setExplorePosition = usePreferencesStore((s) => s.setExplorePosition);
  const progress = useProgressStore((s) => s.progress);
  const toggleBookmark = useProgressStore((s) => s.toggleBookmark);

  const [phase, setPhase] = useState<Phase>("topic-select");
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | "all">("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(orientation: landscape) and (max-height: 500px)");
    setIsLandscape(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    getQuestions().then(setAllQuestions);
  }, []);

  const filtered = useMemo(() => {
    if (activeTopic === "all") return allQuestions;
    return allQuestions.filter((q) => q.topic === activeTopic);
  }, [allQuestions, activeTopic]);

  const bookmarkCount = useMemo(() => {
    return filtered.filter((q) => progress[q.id]?.bookmarked).length;
  }, [filtered, progress]);

  const currentBookmarked = useMemo(() => {
    if (filtered.length === 0) return false;
    const q = filtered[Math.min(currentIndex, filtered.length - 1)];
    return !!progress[q.id]?.bookmarked;
  }, [filtered, currentIndex, progress]);

  const startExploring = useCallback(
    (topicId: Topic | "all") => {
      setActiveTopic(topicId);
      const savedPos = getExplorePosition(topicId);
      setCurrentIndex(savedPos);
      setPhase("exploring");
      trackEvent("explore_session_start", {
        category: topicId,
        resumed_at: savedPos,
      });
    },
    [getExplorePosition]
  );

  const goTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, filtered.length - 1));
      setCurrentIndex(clamped);
      setExplorePosition(activeTopic, clamped);
    },
    [filtered.length, activeTopic, setExplorePosition]
  );

  useEffect(() => {
    if (phase !== "exploring") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        e.preventDefault();
        goTo(currentIndex + 1);
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goTo(currentIndex - 1);
      }
      if (e.key === "Escape") {
        setPhase("topic-select");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, currentIndex, goTo]);

  if (!hydrated || allQuestions.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  if (phase === "exploring" && filtered.length > 0) {
    const question = filtered[Math.min(currentIndex, filtered.length - 1)];
    const isFirst = currentIndex === 0;
    const isLast = currentIndex >= filtered.length - 1;

    return (
      <div className={`mx-auto max-w-6xl px-4 py-4 ${isLandscape ? "-mb-20" : ""}`}>
        {/* Top bar */}
        <div className="mb-3 flex items-center justify-between">
          <button
            onClick={() => setPhase("topic-select")}
            className="flex items-center gap-1 text-sm font-medium text-ocean transition-colors hover:text-ocean/80"
          >
            <ChevronLeft className="h-4 w-4" />
            Topics
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const q = filtered[Math.min(currentIndex, filtered.length - 1)];
                if (q) toggleBookmark(q.id);
              }}
              className={cn(
                "flex items-center gap-1 rounded-full px-2 py-1 text-xs transition-colors",
                currentBookmarked
                  ? "bg-learning/10 text-learning"
                  : "text-muted hover:text-navy"
              )}
              title={currentBookmarked ? "Remove bookmark" : "Bookmark this question"}
            >
              <Bookmark
                className="h-3.5 w-3.5"
                fill={currentBookmarked ? "currentColor" : "none"}
              />
              {bookmarkCount}
            </button>
            <span className="text-sm font-medium">
              {currentIndex + 1}{" "}
              <span className="text-muted">/ {filtered.length}</span>
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-sky">
          <div
            className="h-full rounded-full bg-ocean transition-all"
            style={{
              width: `${((currentIndex + 1) / filtered.length) * 100}%`,
            }}
          />
        </div>

        <ExploreCard
          key={question.id}
          question={question}
          primaryLang={primaryLang}
          secondaryLang={secondaryLang}
        />

        {/* Navigation */}
        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => goTo(currentIndex - 1)}
            disabled={isFirst}
            className="flex items-center gap-1 rounded-lg border border-sky px-4 py-2.5 text-sm font-medium transition-colors hover:bg-sky/50 disabled:opacity-30 disabled:cursor-default"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>
          <button
            onClick={() => goTo(currentIndex + 1)}
            disabled={isLast}
            className="flex items-center gap-1 rounded-lg bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean/90 disabled:opacity-30 disabled:cursor-default"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <Columns2 className="h-5 w-5 text-ocean" />
        <h1 className="text-xl font-semibold">Explore</h1>
      </div>

      <p className="mb-6 text-sm text-muted">
        Read questions side-by-side in two languages before you start answering.
      </p>

      <div className="flex flex-col gap-3">
        {TOPICS.map((t) => {
          const savedPos = getExplorePosition(t.id);
          const hasProgress = savedPos > 0;
          return (
            <button
              key={t.id}
              onClick={() => startExploring(t.id)}
              className="flex items-center justify-between rounded-xl border border-sky bg-white px-5 py-4 text-left transition-colors hover:border-ocean hover:bg-sky/50"
            >
              <div>
                <span className="font-medium">{t.label}</span>
                {hasProgress && (
                  <span className="ml-2 text-xs text-ocean">
                    resumed at #{savedPos + 1}
                  </span>
                )}
              </div>
              <span className="text-sm text-muted">{t.count} questions</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
