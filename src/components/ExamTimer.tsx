"use client";

import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamTimerProps {
  startedAt: number;
  timeLimitSec: number;
  onTimeUp: () => void;
}

export function ExamTimer({ startedAt, timeLimitSec, onTimeUp }: ExamTimerProps) {
  const [remaining, setRemaining] = useState(timeLimitSec);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
  }, [startedAt]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const left = Math.max(0, timeLimitSec - elapsed);
      setRemaining(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        if (interval) clearInterval(interval);
        onTimeUp();
      }
    };

    tick();
    if (!firedRef.current) {
      interval = setInterval(tick, 1000);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [startedAt, timeLimitSec, onTimeUp]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const urgent = remaining <= 300;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
        urgent ? "bg-wrong-bg text-wrong" : "bg-sky text-navy"
      )}
    >
      <Clock className="h-3.5 w-3.5" />
      {minutes}:{seconds.toString().padStart(2, "0")}
    </div>
  );
}
