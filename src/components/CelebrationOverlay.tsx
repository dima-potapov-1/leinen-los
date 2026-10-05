"use client";

import type { CelebrationEvent } from "@/hooks/useProgressStore";

const TITLES: Record<string, string> = {
  "category-complete": "Category Complete!",
  "readiness-green": "Ready!",
  "exam-passed": "Bestanden!",
};

const SUBTITLES: Record<string, (e: CelebrationEvent) => string> = {
  "category-complete": (e) =>
    `topic` in e
      ? `All ${e.topic.charAt(0).toUpperCase() + e.topic.slice(1)} questions completed!`
      : "",
  "readiness-green": (e) =>
    `topic` in e
      ? `${e.topic.charAt(0).toUpperCase() + e.topic.slice(1)}: Ready for the exam!`
      : "",
  "exam-passed": () => "You passed the practice exam!",
};

interface CelebrationOverlayProps {
  event: CelebrationEvent;
  onDismiss: () => void;
}

export function CelebrationOverlay({ event, onDismiss }: CelebrationOverlayProps) {
  const title = TITLES[event.type];
  const subtitle = SUBTITLES[event.type]?.(event) ?? "";

  if (!title) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy/80 p-4">
      <div className="animate-in zoom-in-95 max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 text-5xl">
          {event.type === "exam-passed" ? "🎉" : "⚓"}
        </div>
        <h2 className="mb-2 text-2xl font-bold text-navy">{title}</h2>
        <p className="mb-6 text-muted">{subtitle}</p>
        <button
          onClick={onDismiss}
          className="rounded-xl bg-ocean px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
