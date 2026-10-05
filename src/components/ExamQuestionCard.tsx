"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import type { Question, Language } from "@/types";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import { useProgressStore } from "@/hooks/useProgressStore";
import { useShuffledOptions } from "@/hooks/useShuffledOptions";
import { LanguageToggle } from "./LanguageToggle";
import { ImageViewer } from "./ImageViewer";
import { cn } from "@/lib/utils";

const OPTION_LETTERS = ["a", "b", "c", "d"];

interface ExamQuestionCardProps {
  question: Question;
  index: number;
  total: number;
  /** Original-index of the currently selected option (from exam store) */
  selectedOption?: number;
  sessionSeed: number;
  /** Called with the ORIGINAL index so exam store stays in original-index space */
  onSelect: (optionIndex: number) => void;
}

function getLocalizedText(
  question: Question,
  field: "question",
  lang: Language
): string {
  return question[`${field}_${lang}` as keyof Question] as string;
}

export function ExamQuestionCard({
  question,
  index,
  total,
  selectedOption,
  sessionSeed,
  onSelect,
}: ExamQuestionCardProps) {
  const [showingSecondary, setShowingSecondary] = useState(false);
  const primaryLang = usePreferencesStore((s) => s.primaryLanguage);
  const secondaryLang = usePreferencesStore((s) => s.secondaryLanguage);
  const currentLang = showingSecondary ? secondaryLang : primaryLang;
  const progress = useProgressStore((s) => s.getProgress(question.id));
  const toggleBookmark = useProgressStore((s) => s.toggleBookmark);

  const { displayOptions, toOriginalIndex, toDisplayIndexSafe } =
    useShuffledOptions(question, sessionSeed);

  const selectedDisplayIdx = toDisplayIndexSafe(selectedOption);

  const topicLabel =
    question[`topic_name_${currentLang}` as keyof Question] as string;

  return (
    <div className="rounded-xl border border-sky bg-white">
      <div className="flex items-center justify-between border-b border-sky px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Q.{question.id}</span>
          <span className="rounded bg-sky px-1.5 py-0.5 text-xs text-muted">
            {topicLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleBookmark(question.id)}
            className={cn(
              "rounded-full p-1.5 transition-colors",
              progress.bookmarked
                ? "text-learning"
                : "text-muted hover:text-navy"
            )}
            title={progress.bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark
              className="h-4 w-4"
              fill={progress.bookmarked ? "currentColor" : "none"}
            />
          </button>
          <LanguageToggle
            showingSecondary={showingSecondary}
            onToggle={() => setShowingSecondary(!showingSecondary)}
          />
        </div>
      </div>

      <div className="px-4 py-4">
        {question.image_url && (
          <div className="mb-4">
            <ImageViewer
              src={question.image_url}
              alt={`Question ${question.id}`}
            />
          </div>
        )}

        <p className="mb-4 text-lg font-semibold leading-snug">
          {getLocalizedText(question, "question", currentLang)}
        </p>

        <div className="flex flex-col gap-2">
          {displayOptions.map((opt, displayIdx) => (
            <button
              key={displayIdx}
              onClick={() => onSelect(toOriginalIndex(displayIdx))}
              className={cn(
                "w-full rounded-lg border-l-4 px-4 py-3 text-left text-sm transition-colors",
                selectedDisplayIdx === displayIdx
                  ? "border-ocean bg-sky"
                  : "border-transparent bg-white hover:bg-sky/50"
              )}
            >
              <span className="mr-2 font-medium text-muted">
                {OPTION_LETTERS[displayIdx]}.
              </span>
              {opt[currentLang]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
