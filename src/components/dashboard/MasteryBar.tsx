"use client";

import { useMemo } from "react";
import { useProgressStore } from "@/hooks/useProgressStore";

export function MasteryBar() {
  const progress = useProgressStore((s) => s.progress);
  const total = 300;

  const { unseen, learning, familiar } = useMemo(() => {
    let fam = 0;
    let learn = 0;
    for (const p of Object.values(progress)) {
      if (p.mastery === "familiar") fam++;
      else if (p.mastery === "learning") learn++;
    }
    return { unseen: total - fam - learn, learning: learn, familiar: fam };
  }, [progress]);

  return (
    <div className="rounded-xl border border-sky bg-white p-5">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-medium">Progress</span>
        <span className="text-muted">{familiar} / {total}</span>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-sky">
        {familiar > 0 && (
          <div
            className="h-full bg-correct transition-all"
            style={{ width: `${(familiar / total) * 100}%` }}
          />
        )}
        {learning > 0 && (
          <div
            className="h-full bg-learning transition-all"
            style={{ width: `${(learning / total) * 100}%` }}
          />
        )}
      </div>
      <div className="mt-2 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-correct" />
          Familiar ({familiar})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-learning" />
          Learning ({learning})
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full border border-muted" />
          Unseen ({unseen})
        </span>
      </div>
    </div>
  );
}
