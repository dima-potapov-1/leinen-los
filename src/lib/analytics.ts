import { getAnonymousId } from "./anonymous-id";

interface PendingEvent {
  event_type: string;
  payload: Record<string, unknown>;
}

interface DeviceContext {
  screen_resolution: string;
  viewport: string;
  language: string;
  timezone: string;
}

let queue: PendingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;
let cachedContext: DeviceContext | null = null;
let currentUserId: string | null = null;

export function setAnalyticsUser(userId: string | null) {
  currentUserId = userId;
}

function getDeviceContext(): DeviceContext {
  if (cachedContext) return cachedContext;

  cachedContext = {
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
  return cachedContext;
}

function flush() {
  if (queue.length === 0) return;

  const batch = queue;
  queue = [];
  flushTimer = null;

  const body = JSON.stringify({
    anonymous_id: getAnonymousId(),
    user_id: currentUserId,
    context: getDeviceContext(),
    events: batch,
  });

  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", body);
  } else {
    fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }
}

function ensureListeners() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });

  window.addEventListener("beforeunload", flush);
}

export function trackEvent(
  eventType: string,
  payload: Record<string, unknown> = {}
) {
  if (typeof window === "undefined") return;

  ensureListeners();
  queue.push({ event_type: eventType, payload });

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flush, 500);
}
