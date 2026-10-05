"use client";

import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import type { Language } from "@/types";
import { cn } from "@/lib/utils";

const LANGUAGE_LABELS: Record<Language, string> = {
  de: "DE",
  en: "EN",
  ru: "RU",
};

interface LanguageToggleProps {
  showingSecondary: boolean;
  onToggle: () => void;
}

export function LanguageToggle({ showingSecondary, onToggle }: LanguageToggleProps) {
  const primary = usePreferencesStore((s) => s.primaryLanguage);
  const secondary = usePreferencesStore((s) => s.secondaryLanguage);

  const current = showingSecondary ? secondary : primary;
  const other = showingSecondary ? primary : secondary;

  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        "border-ocean/30 bg-white text-ocean hover:bg-sky"
      )}
      title={`Switch to ${LANGUAGE_LABELS[other]}`}
    >
      <span className="font-semibold">{LANGUAGE_LABELS[current]}</span>
      <span className="text-muted">→</span>
      <span className="text-muted">{LANGUAGE_LABELS[other]}</span>
    </button>
  );
}
