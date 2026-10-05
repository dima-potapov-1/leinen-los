"use client";

import { Bookmark } from "lucide-react";
import type { Question, Language } from "@/types";
import { useProgressStore } from "@/hooks/useProgressStore";
import { ImageViewer } from "./ImageViewer";
import { splitByHighlights } from "@/lib/highlights";
import { cn } from "@/lib/utils";

interface ExploreCardProps {
  question: Question;
  primaryLang: Language;
  secondaryLang: Language;
}

function getQuestionText(q: Question, lang: Language): string {
  return q[`question_${lang}` as keyof Question] as string;
}

function getTopicName(q: Question, lang: Language): string {
  return q[`topic_name_${lang}` as keyof Question] as string;
}

function getOptionText(opt: Question["options"][0], lang: Language): string {
  return opt[lang];
}

function getHighlights(opt: Question["options"][0], lang: Language): string[] {
  return (opt[`highlights_${lang}` as keyof typeof opt] as string[]) ?? [];
}

const OPTION_LETTERS = ["a", "b", "c", "d"];

const LANG_LABELS: Record<Language, string> = {
  de: "DE",
  en: "EN",
  ru: "RU",
};

function OptionDisplay({
  opt,
  index,
  isCorrect,
  lang,
}: {
  opt: Question["options"][0];
  index: number;
  isCorrect: boolean;
  lang: Language;
}) {
  const text = getOptionText(opt, lang);
  const highlights = getHighlights(opt, lang);
  const segments =
    isCorrect && highlights.length > 0
      ? splitByHighlights(text, highlights)
      : [{ text, highlighted: false }];

  return (
    <div
      className={cn(
        "rounded-lg border-l-4 px-3 py-2 text-sm break-words",
        isCorrect
          ? "border-correct bg-correct-bg"
          : "border-transparent bg-white opacity-60"
      )}
    >
      <span className="mr-1.5 font-medium text-muted">
        {OPTION_LETTERS[index]}.
      </span>
      {segments.map((seg, i) =>
        seg.highlighted ? (
          <mark
            key={i}
            className="rounded-sm bg-trigger-bg px-0.5 text-trigger"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </div>
  );
}

function LanguagePanel({
  question,
  lang,
  label,
}: {
  question: Question;
  lang: Language;
  label: string;
}) {
  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="rounded bg-ocean/10 px-1.5 py-0.5 text-xs font-semibold text-ocean">
          {label}
        </span>
        <span className="truncate text-xs text-muted">
          {getTopicName(question, lang)}
        </span>
      </div>

      {question.image_url && (
        <div className="mb-3 flex justify-center">
          <ImageViewer
            src={question.image_url}
            alt={`Question ${question.id}`}
            compact
          />
        </div>
      )}

      <p className="mb-3 break-words text-base font-semibold leading-snug">
        {getQuestionText(question, lang)}
      </p>

      <div className="flex flex-col gap-1.5">
        {question.options.map((opt, idx) => (
          <OptionDisplay
            key={idx}
            opt={opt}
            index={idx}
            isCorrect={idx === question.correct_option}
            lang={lang}
          />
        ))}
      </div>
    </div>
  );
}

export function ExploreCard({
  question,
  primaryLang,
  secondaryLang,
}: ExploreCardProps) {
  const progress = useProgressStore((s) => s.getProgress(question.id));
  const toggleBookmark = useProgressStore((s) => s.toggleBookmark);

  return (
    <div className="rounded-xl border border-sky bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-sky px-4 py-2.5">
        <span className="text-sm font-medium">Q.{question.id}</span>
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
      </div>

      {/* Side-by-side on wide screens, stacked on narrow portrait */}
      <div className="flex flex-col gap-4 p-4 sm:flex-row">
        <LanguagePanel
          question={question}
          lang={primaryLang}
          label={LANG_LABELS[primaryLang]}
        />
        <div className="h-px w-full shrink-0 bg-sky sm:h-auto sm:w-px" />
        <LanguagePanel
          question={question}
          lang={secondaryLang}
          label={LANG_LABELS[secondaryLang]}
        />
      </div>
    </div>
  );
}
