import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { UAParser } from "ua-parser-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminPassword = process.env.ADMIN_PASSWORD!;

const BOT_UA_PATTERNS = /bot|crawl|spider|slurp|facebookexternalhit|linkedinbot|twitterbot|whatsapp|telegram|preview|fetch|headless|phantom|selenium|puppeteer|lighthouse|pagespeed|pingdom|uptimerobot|monitor|check|scan|probe|curl|wget|python|java\/|go-http|node-fetch|undici|vercel|prerender/i;

function isBot(ua: string, parsed: UAParser.IResult): boolean {
  if (!ua || ua.length < 20) return true;
  if (BOT_UA_PATTERNS.test(ua)) return true;
  if (!parsed.browser.name) return true;
  return false;
}

function classifyDevice(type: string | undefined): string {
  if (!type) return "desktop";
  if (type === "mobile" || type === "tablet" || type === "wearable") return type;
  return "desktop";
}

// POST — public ingestion (uses anon key, RLS allows inserts)
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";

    let body: unknown;
    if (contentType.includes("application/json")) {
      body = await request.json();
    } else {
      const text = await request.text();
      body = JSON.parse(text);
    }

    const { anonymous_id, user_id, context, events } = body as {
      anonymous_id?: string;
      user_id?: string | null;
      context?: {
        screen_resolution?: string;
        viewport?: string;
        language?: string;
        timezone?: string;
      };
      events?: { event_type: string; payload: Record<string, unknown> }[];
    };

    if (!anonymous_id || !Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const ua = request.headers.get("user-agent") ?? "";
    const parsed = new UAParser(ua);

    if (isBot(ua, parsed.getResult())) {
      return NextResponse.json({ ok: true });
    }

    const country = request.headers.get("x-vercel-ip-country") ?? null;
    const city = request.headers.get("x-vercel-ip-city") ?? null;
    const region = request.headers.get("x-vercel-ip-region") ?? null;

    const browser = [parsed.getBrowser().name, parsed.getBrowser().version]
      .filter(Boolean)
      .join(" ");
    const os = [parsed.getOS().name, parsed.getOS().version]
      .filter(Boolean)
      .join(" ");
    const deviceType = classifyDevice(parsed.getDevice().type);

    const enrichment = {
      country,
      city: city ? decodeURIComponent(city) : null,
      region,
      device_type: deviceType,
      os: os || null,
      browser: browser || null,
      screen_resolution: context?.screen_resolution ?? null,
      viewport: context?.viewport ?? null,
      language: context?.language ?? null,
      timezone: context?.timezone ?? null,
    };

    const rows = events.map((e) => ({
      anonymous_id,
      user_id: user_id ?? null,
      event_type: e.event_type,
      payload: e.payload ?? {},
      ...enrichment,
    }));

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.from("analytics_events").insert(rows);

    if (error) {
      console.error("Analytics insert error:", error);
      return NextResponse.json({ error: "Insert failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

interface ChartRow {
  anonymous_id: string;
  user_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function toWeekKey(iso: string): string {
  const d = new Date(iso);
  const jan1 = new Date(d.getFullYear(), 0, 1);
  const dayOfYear = Math.ceil((d.getTime() - jan1.getTime()) / 86400000);
  const week = Math.ceil((dayOfYear + jan1.getDay()) / 7);
  return `${d.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

function buildChartData(rows: ChartRow[]) {
  const regRows = rows.filter((r) => r.user_id);

  const dailyMap = new Map<string, { users: Set<string>; sessions: number; views: number }>();
  const weeklyMap = new Map<string, { users: Set<string>; sessions: number; views: number }>();

  const sessionTypes = new Set([
    "learning_session_start", "learning_session_complete",
    "review_session_start", "review_session_complete",
    "exam_session_start", "exam_session_complete",
  ]);

  for (const r of regRows) {
    const dayKey = toDateKey(r.created_at);
    const weekKey = toWeekKey(r.created_at);

    for (const [key, map] of [[dayKey, dailyMap], [weekKey, weeklyMap]] as const) {
      let bucket = map.get(key);
      if (!bucket) {
        bucket = { users: new Set(), sessions: 0, views: 0 };
        map.set(key, bucket);
      }
      bucket.users.add(r.user_id!);
      if (r.event_type === "page_view") bucket.views++;
      if (sessionTypes.has(r.event_type)) bucket.sessions++;
    }
  }

  const toArray = (map: Map<string, { users: Set<string>; sessions: number; views: number }>) =>
    Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, users: v.users.size, sessions: v.sessions, views: v.views }));

  return { daily: toArray(dailyMap), weekly: toArray(weeklyMap) };
}

// GET — admin query (requires Authorization header, uses service role key)
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${adminPassword}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const [summaryResult, perUserResult, recentResult] = await Promise.all([
    supabase.rpc("analytics_summary").single(),
    supabase.rpc("analytics_per_user"),
    supabase
      .from("analytics_events")
      .select("id, anonymous_id, user_id, event_type, payload, created_at, country, city, region, device_type, os, browser, screen_resolution, viewport, language, timezone")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (summaryResult.error || perUserResult.error || recentResult.error) {
    const fallbackSummary = await supabase
      .from("analytics_events")
      .select("anonymous_id, user_id, event_type, payload, created_at, country, city, device_type, os, browser");

    if (fallbackSummary.error) {
      return NextResponse.json(
        { error: "Query failed", details: fallbackSummary.error.message },
        { status: 500 }
      );
    }

    const rows = fallbackSummary.data ?? [];
    const uniqueUsers = new Set(rows.map((r) => r.anonymous_id)).size;

    const count = (type: string, filter?: (r: typeof rows[0]) => boolean) =>
      rows.filter((r) => r.event_type === type && (!filter || filter(r))).length;

    const summary = {
      unique_users: uniqueUsers,
      total_page_views: count("page_view"),
      learning_sessions: count("learning_session_complete"),
      review_sessions: count("review_session_complete"),
      exam_sessions: count("exam_session_complete"),
      exams_passed: count("exam_session_complete", (r) =>
        (r.payload as Record<string, unknown>)?.passed === true
      ),
    };

    const userMap = new Map<string, typeof rows>();
    for (const r of rows) {
      const list = userMap.get(r.anonymous_id) ?? [];
      list.push(r);
      userMap.set(r.anonymous_id, list);
    }

    const per_user = Array.from(userMap.entries())
      .map(([aid, events]) => {
        const sorted = [...events].sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const latest = sorted[0] as Record<string, unknown>;
        const latestUserId = events.find((e) => e.user_id)?.user_id ?? null;
        return {
          anonymous_id: aid,
          user_id: latestUserId,
          first_seen: sorted[sorted.length - 1].created_at,
          last_seen: sorted[0].created_at,
          page_views: events.filter((e) => e.event_type === "page_view").length,
          learning_sessions: events.filter(
            (e) => e.event_type === "learning_session_complete"
          ).length,
          review_sessions: events.filter(
            (e) => e.event_type === "review_session_complete"
          ).length,
          exam_sessions: events.filter(
            (e) => e.event_type === "exam_session_complete"
          ).length,
          exams_passed: events.filter(
            (e) =>
              e.event_type === "exam_session_complete" &&
              (e.payload as Record<string, unknown>)?.passed === true
          ).length,
          country: (latest.country as string) ?? null,
          city: (latest.city as string) ?? null,
          device_type: (latest.device_type as string) ?? null,
          os: (latest.os as string) ?? null,
          browser: (latest.browser as string) ?? null,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime()
      );

    const recent_events = rows
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 50);

    const charts = buildChartData(rows);
    return NextResponse.json({ summary, per_user, recent_events, charts });
  }

  const allEventsResult = await supabase
    .from("analytics_events")
    .select("anonymous_id, user_id, event_type, payload, created_at");

  const charts = buildChartData(allEventsResult.data ?? []);

  return NextResponse.json({
    summary: summaryResult.data,
    per_user: perUserResult.data,
    recent_events: recentResult.data,
    charts,
  });
}
