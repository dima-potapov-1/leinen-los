"use client";

import type { QuestionExplanation, Language } from "@/types";

interface ExplanationPanelProps {
  explanation: QuestionExplanation;
  language: Language;
}

export function ExplanationPanel({ explanation, language }: ExplanationPanelProps) {
  const text = explanation[language];
  if (!text) return null;

  return (
    <div className="animate-in slide-in-from-bottom-2 mt-3 rounded-lg border border-wrong/20 bg-wrong-bg px-4 py-3">
      <p className="text-sm leading-relaxed text-navy/80">{text}</p>
    </div>
  );
}
