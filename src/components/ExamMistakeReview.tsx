"use client";

import { useState } from "react";
import { ArrowLeft, Bookmark } from "lucide-react";
import type { Question, Language } from "@/types";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import { useProgressStore } from "@/hooks/useProgressStore";
import { useShuffledOptions } from "@/hooks/useShuffledOptions";
import { LanguageToggle } from "./LanguageToggle";
import { ImageViewer } from "./ImageViewer";
import { cn } from "@/lib/utils";

const OPTION_LETTERS = ["a", "b", "c", "d"];

interface ExamMistakeReviewProps {
  mistakes: { question: Question; userAnswer: number | undefined }[];
  sessionSeed: number;
  onBack: () => void;
}

export function ExamMistakeReview({
  mistakes,
  sessionSeed,
  onBack,
}: ExamMistakeReviewProps) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 text-sm font-medium text-ocean transition-colors hover:text-ocean/70"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Results
      </button>

      <h2 className="mb-4 text-lg font-semibold">
        {mistakes.length} Mistake{mistakes.length !== 1 ? "s" : ""}
      </h2>

      <div className="flex flex-col gap-4">
        {mistakes.map(({ question, userAnswer }) => (
          <MistakeCard
            key={question.id}
            question={question}
            userAnswer={userAnswer}
            sessionSeed={sessionSeed}
          />
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-6 w-full rounded-xl border border-sky px-6 py-3 text-sm font-semibold text-navy transition-colors hover:bg-sky/50"
      >
        Back to Results
      </button>
    </div>
  );
}

function MistakeCard({
  question,
  userAnswer,
  sessionSeed,
}: {
  question: Question;
  userAnswer: number | undefined;
  sessionSeed: number;
}) {
  const [showingSecondary, setShowingSecondary] = useState(false);
  const primaryLang = usePreferencesStore((s) => s.primaryLanguage);
  const secondaryLang = usePreferencesStore((s) => s.secondaryLanguage);
  const currentLang = showingSecondary ? secondaryLang : primaryLang;
  const progress = useProgressStore((s) => s.getProgress(question.id));
  const toggleBookmark = useProgressStore((s) => s.toggleBookmark);

  const { displayOptions, toOriginalIndex, toDisplayIndexSafe } =
    useShuffledOptions(question, sessionSeed);

  const userDisplayIdx = toDisplayIndexSafe(userAnswer);
  const correctDisplayIdx = toDisplayIndexSafe(question.correct_option);

  const topicLabel =
    question[`topic_name_${currentLang}` as keyof Question] as string;
  const questionText =
    question[`question_${currentLang}` as keyof Question] as string;

  function getOptionState(
    displayIdx: number
  ): "default" | "selected-correct" | "selected-wrong" | "revealed-correct" {
    const isCorrect = displayIdx === correctDisplayIdx;
    const isUserPick = displayIdx === userDisplayIdx;

    if (isCorrect) return "revealed-correct";
    if (isUserPick) return "selected-wrong";
    return "default";
  }

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
          {questionText}
        </p>

        {userAnswer === undefined && (
          <p className="mb-2 text-xs font-medium text-wrong">Not answered</p>
        )}

        <div className="flex flex-col gap-2">
          {displayOptions.map((opt, displayIdx) => {
            const state = getOptionState(displayIdx);
            return (
              <div
                key={displayIdx}
                className={cn(
                  "w-full rounded-lg border-l-4 px-4 py-3 text-left text-sm",
                  state === "default" && "border-transparent bg-white opacity-60",
                  state === "selected-wrong" && "border-wrong bg-wrong-bg",
                  state === "revealed-correct" && "border-correct bg-correct-bg"
                )}
              >
                <span className="mr-2 font-medium text-muted">
                  {OPTION_LETTERS[displayIdx]}.
                </span>
                {opt[currentLang]}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
