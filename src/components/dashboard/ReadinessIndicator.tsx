"use client";

import { useMemo } from "react";
import { useProgressStore } from "@/hooks/useProgressStore";
import type { Topic } from "@/types";

const TOPICS: { id: Topic; label: string }[] = [
  { id: "basis", label: "Basis" },
  { id: "binnen", label: "Binnen" },
  { id: "segeln", label: "Segel" },
];

const TOPIC_RANGES: Record<Topic, [number, number]> = {
  basis: [1, 72],
  binnen: [73, 253],
  segeln: [254, 300],
};

const COLOR_MAP = {
  red: "bg-wrong",
  amber: "bg-learning",
  green: "bg-correct",
};

const LABEL_MAP = {
  red: "Not ready",
  amber: "Getting there",
  green: "Ready",
};

function computeTopicReadiness(
  progress: Record<number, { mastery: string }>,
  topic: Topic
) {
  const [start, end] = TOPIC_RANGES[topic];
  const total = end - start + 1;
  let familiar = 0;
  for (let id = start; id <= end; id++) {
    if (progress[id]?.mastery === "familiar") familiar++;
  }
  const ratio = familiar / total;
  let readiness: "red" | "amber" | "green" = "red";
  if (ratio >= 0.9) readiness = "green";
  else if (ratio >= (topic === "binnen" ? 0.75 : 0.7)) readiness = "amber";
  return { familiar, total, readiness };
}

export function ReadinessIndicator() {
  const progress = useProgressStore((s) => s.progress);

  const topicData = useMemo(
    () => TOPICS.map(({ id, label }) => ({
      id,
      label,
      ...computeTopicReadiness(progress, id),
    })),
    [progress]
  );

  return (
    <div className="rounded-xl border border-sky bg-white p-5">
      <h2 className="mb-3 text-sm font-medium">Exam Readiness</h2>
      <div className="flex flex-col gap-2 text-sm">
        {topicData.map(({ id, label, familiar, total, readiness }) => (
          <div key={id} className="flex items-center gap-2">
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${COLOR_MAP[readiness]}`}
            />
            <span className="flex-1 font-medium">{label}</span>
            <span className="text-muted">
              {familiar}/{total} — {LABEL_MAP[readiness]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
