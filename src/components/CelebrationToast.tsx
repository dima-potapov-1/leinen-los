"use client";

import { useEffect, useState } from "react";
import type { CelebrationEvent } from "@/hooks/useProgressStore";

const MESSAGES: Record<string, string> = {
  "first-answer": "You're on your way! 🚢",
  "correct-streak-10": "10 in a row! 🌊",
};

interface CelebrationToastProps {
  event: CelebrationEvent;
  onDismiss: () => void;
}

export function CelebrationToast({ event, onDismiss }: CelebrationToastProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const message = MESSAGES[event.type] ?? "";
  if (!message) return null;

  return (
    <div
      className={`fixed left-1/2 top-6 z-50 -translate-x-1/2 rounded-xl bg-navy px-5 py-3 text-sm font-medium text-white shadow-lg transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
      }`}
    >
      {message}
    </div>
  );
}
