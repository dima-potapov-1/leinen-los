"use client";

import { useState, useCallback, useEffect } from "react";
import { Bookmark } from "lucide-react";
import type { Question, Language } from "@/types";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import { useProgressStore } from "@/hooks/useProgressStore";
import { useShuffledOptions } from "@/hooks/useShuffledOptions";
import { OptionButton } from "./OptionButton";
import { LanguageToggle } from "./LanguageToggle";
import { ExplanationPanel } from "./ExplanationPanel";
import { ImageViewer } from "./ImageViewer";
import { cn } from "@/lib/utils";
import type { CelebrationEvent } from "@/hooks/useProgressStore";

type CardMode = "learning" | "exam";

interface QuestionCardProps {
  question: Question;
  index: number;
  total: number;
  mode?: CardMode;
  sessionSeed?: number;
  onAnswered?: (isCorrect: boolean, celebrations: CelebrationEvent[]) => void;
  onNext?: () => void;
}

const MASTERY_COLORS = {
  unseen: "border-muted bg-transparent",
  learning: "border-learning bg-learning",
  familiar: "border-correct bg-correct",
};

function getLocalizedText(
  question: Question,
  field: "question",
  lang: Language
): string {
  return question[`${field}_${lang}` as keyof Question] as string;
}

function getOptionText(
  option: Question["options"][0],
  lang: Language
): string {
  return option[lang];
}

function getHighlights(
  option: Question["options"][0],
  lang: Language
): string[] {
  return option[`highlights_${lang}` as keyof typeof option] as string[] ?? [];
}

export function QuestionCard({
  question,
  index,
  total,
  mode = "learning",
  sessionSeed = 0,
  onAnswered,
  onNext,
}: QuestionCardProps) {
  // selectedOption stores the ORIGINAL index (not display position)
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showingSecondary, setShowingSecondary] = useState(false);

  const primaryLang = usePreferencesStore((s) => s.primaryLanguage);
  const secondaryLang = usePreferencesStore((s) => s.secondaryLanguage);
  const currentLang = showingSecondary ? secondaryLang : primaryLang;

  const progress = useProgressStore((s) => s.getProgress(question.id));
  const recordAnswer = useProgressStore((s) => s.recordAnswer);
  const toggleBookmark = useProgressStore((s) => s.toggleBookmark);

  const { displayOptions, toOriginalIndex } =
    useShuffledOptions(question, sessionSeed);

  const answered = selectedOption !== null;
  const isCorrect = selectedOption === question.correct_option;

  const handleSelect = useCallback(
    (displayIdx: number) => {
      if (answered) return;
      const originalIdx = toOriginalIndex(displayIdx);
      setSelectedOption(originalIdx);
      const correct = originalIdx === question.correct_option;
      if (mode === "learning") {
        const celebrations = recordAnswer(question.id, correct);
        onAnswered?.(correct, celebrations);
      } else {
        onAnswered?.(correct, []);
      }
    },
    [answered, question.id, question.correct_option, mode, recordAnswer, onAnswered, toOriginalIndex]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (mode !== "learning") return;
      const keyMap: Record<string, number> = { "1": 0, "2": 1, "3": 2, "4": 3, a: 0, b: 1, c: 2, d: 3 };
      const optIdx = keyMap[e.key.toLowerCase()];
      if (optIdx !== undefined && !answered) {
        handleSelect(optIdx);
      }
      if ((e.key === "Enter" || e.key === " ") && answered && onNext) {
        e.preventDefault();
        onNext();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [answered, handleSelect, onNext, mode]);

  const getOptionState = (displayIdx: number) => {
    if (!answered) return "default" as const;
    const originalIdx = toOriginalIndex(displayIdx);
    if (originalIdx === selectedOption && isCorrect) return "selected-correct" as const;
    if (originalIdx === selectedOption && !isCorrect) return "selected-wrong" as const;
    if (originalIdx === question.correct_option && !isCorrect) return "revealed-correct" as const;
    return "default" as const;
  };

  const wrongExplanation =
    answered && !isCorrect && mode === "learning"
      ? question.explanations.find((e) => e.option === selectedOption)
      : null;

  const topicLabel =
    question[`topic_name_${currentLang}` as keyof Question] as string;

  return (
    <div className="rounded-xl border border-sky bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sky px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-block h-2.5 w-2.5 rounded-full border",
              MASTERY_COLORS[progress.mastery]
            )}
          />
          <span className="text-sm font-medium">
            Q.{question.id}
          </span>
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

      {/* Body */}
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
            <OptionButton
              key={displayIdx}
              label={getOptionText(opt, currentLang)}
              index={displayIdx}
              state={getOptionState(displayIdx)}
              highlights={getHighlights(opt, currentLang)}
              showHighlights={
                mode === "learning" &&
                answered &&
                toOriginalIndex(displayIdx) === question.correct_option
              }
              disabled={answered}
              onSelect={() => handleSelect(displayIdx)}
            />
          ))}
        </div>

        {wrongExplanation && (
          <ExplanationPanel
            explanation={wrongExplanation}
            language={currentLang}
          />
        )}
      </div>

      {/* Footer */}
      {answered && onNext && (
        <div className="border-t border-sky px-4 py-3">
          <button
            onClick={onNext}
            className="w-full rounded-lg bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
          >
            Next Question
          </button>
        </div>
      )}
    </div>
  );
}
