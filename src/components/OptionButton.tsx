"use client";

import { cn } from "@/lib/utils";
import { splitByHighlights } from "@/lib/highlights";
import type { Language } from "@/types";

type OptionState = "default" | "selected-correct" | "selected-wrong" | "revealed-correct";

interface OptionButtonProps {
  label: string;
  index: number;
  state: OptionState;
  highlights: string[];
  showHighlights: boolean;
  disabled: boolean;
  onSelect: () => void;
}

const OPTION_LETTERS = ["a", "b", "c", "d"];

export function OptionButton({
  label,
  index,
  state,
  highlights,
  showHighlights,
  disabled,
  onSelect,
}: OptionButtonProps) {
  const segments =
    showHighlights && highlights.length > 0
      ? splitByHighlights(label, highlights)
      : [{ text: label, highlighted: false }];

  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full rounded-lg border-l-4 px-4 py-3 text-left text-sm transition-colors",
        state === "default" &&
          "border-transparent bg-white hover:bg-sky/50",
        state === "selected-correct" &&
          "border-correct bg-correct-bg",
        state === "selected-wrong" &&
          "border-wrong bg-wrong-bg",
        state === "revealed-correct" &&
          "border-correct bg-correct-bg",
        disabled && state === "default" && "opacity-60 cursor-default"
      )}
    >
      <span className="mr-2 font-medium text-muted">
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
    </button>
  );
}
