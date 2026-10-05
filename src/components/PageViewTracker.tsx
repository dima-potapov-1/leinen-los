"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

const DEPTH_KEY = "leinen-los-session-depth";

function getAndIncrementDepth(): number {
  const current = parseInt(sessionStorage.getItem(DEPTH_KEY) ?? "0", 10);
  const next = current + 1;
  sessionStorage.setItem(DEPTH_KEY, String(next));
  return next;
}

export function PageViewTracker() {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    trackEvent("page_view", {
      path: pathname,
      referrer: document.referrer || null,
      session_depth: getAndIncrementDepth(),
    });
  }, [pathname]);

  return null;
}
