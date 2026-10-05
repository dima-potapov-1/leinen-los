"use client";

import { useState, useCallback, useMemo } from "react";
import { Lock, RefreshCw, Users, Eye, BookOpen, RotateCcw, ClipboardCheck, Trophy, Globe, Monitor, Smartphone, Tablet } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface Summary {
  unique_users: number;
  total_page_views: number;
  learning_sessions: number;
  review_sessions: number;
  exam_sessions: number;
  exams_passed: number;
}

interface PerUser {
  anonymous_id: string;
  user_id: string | null;
  first_seen: string;
  last_seen: string;
  page_views: number;
  learning_sessions: number;
  review_sessions: number;
  exam_sessions: number;
  exams_passed: number;
  country: string | null;
  city: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
}

interface AnalyticsEvent {
  id: number;
  anonymous_id: string;
  user_id: string | null;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
  country: string | null;
  city: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
}

interface ChartPoint {
  date: string;
  users: number;
  sessions: number;
  views: number;
}

interface ChartData {
  daily: ChartPoint[];
  weekly: ChartPoint[];
}

interface DashboardData {
  summary: Summary;
  per_user: PerUser[];
  recent_events: AnalyticsEvent[];
  charts?: ChartData;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CopyableId({ id, className }: { id: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      title={id}
      className={`cursor-pointer hover:underline ${className ?? ""}`}
      onClick={() => {
        navigator.clipboard.writeText(id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
    >
      {copied ? "Copied!" : id.slice(0, 10) + "…"}
    </button>
  );
}

function eventLabel(type: string): string {
  const labels: Record<string, string> = {
    page_view: "Page View",
    sign_in: "Sign In",
    sign_up: "Sign Up",
    sign_out: "Sign Out",
    progress_migrated: "Progress Migrated",
    explore_session_start: "Explore Start",
    learning_session_start: "Learning Start",
    learning_session_complete: "Learning Complete",
    review_session_start: "Review Start",
    review_session_complete: "Review Complete",
    exam_session_start: "Exam Start",
    exam_session_complete: "Exam Complete",
    settings_change: "Settings Change",
  };
  return labels[type] ?? type;
}

function ChartCard({
  title,
  dataKey,
  color,
  data,
}: {
  title: string;
  dataKey: string;
  color: string;
  data: ChartPoint[];
}) {
  const maxVal = useMemo(
    () => Math.max(...data.map((d) => d[dataKey as keyof ChartPoint] as number), 0),
    [data, dataKey]
  );

  return (
    <div className="rounded-xl border border-sky bg-white p-4">
      <p className="mb-2 text-xs font-medium text-muted">{title}</p>
      <ResponsiveContainer width="100%" height={160}>
        {data.length <= 14 ? (
          <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              allowDecimals={false}
              domain={[0, Math.max(maxVal, 1)]}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              labelFormatter={(v) => String(v)}
            />
            <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10 }}
              tickFormatter={(v: string) => v.slice(5)}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              allowDecimals={false}
              domain={[0, Math.max(maxVal, 1)]}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              labelFormatter={(v) => String(v)}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [storedPassword, setStoredPassword] = useState("");
  const [chartMode, setChartMode] = useState<"daily" | "weekly">("daily");

  const fetchData = useCallback(async (pw: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${pw}` },
      });
      if (res.status === 401) {
        setError("Wrong password.");
        setAuthed(false);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Failed to load data.");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setData(json);
      setAuthed(true);
      setStoredPassword(pw);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(password);
  };

  if (!authed) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-sm rounded-xl border border-sky bg-white p-6"
        >
          <div className="mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-ocean" />
            <h1 className="text-lg font-semibold">Admin Dashboard</h1>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter admin password"
            className="mb-3 w-full rounded-lg border border-sky px-4 py-2.5 text-sm focus:border-ocean focus:outline-none"
            autoFocus
          />
          {error && (
            <p className="mb-3 text-sm text-wrong">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-xl bg-ocean px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean/90 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Sign In"}
          </button>
        </form>
      </div>
    );
  }

  if (!data) return null;

  const { summary, per_user, recent_events, charts } = data;

  const statCards = [
    { label: "Unique Users", value: summary.unique_users, icon: Users },
    { label: "Page Views", value: summary.total_page_views, icon: Eye },
    { label: "Learning Sessions", value: summary.learning_sessions, icon: BookOpen },
    { label: "Review Sessions", value: summary.review_sessions, icon: RotateCcw },
    { label: "Exam Sessions", value: summary.exam_sessions, icon: ClipboardCheck },
    { label: "Exams Passed", value: summary.exams_passed, icon: Trophy },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin Dashboard</h1>
        <button
          onClick={() => fetchData(storedPassword)}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-sky px-3 py-1.5 text-sm text-muted transition-colors hover:border-ocean hover:text-navy disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {statCards.map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-sky bg-white p-4"
          >
            <div className="mb-1 flex items-center gap-2">
              <Icon className="h-4 w-4 text-ocean" />
              <span className="text-xs font-medium text-muted">{label}</span>
            </div>
            <p className="text-2xl font-bold text-navy">{value}</p>
          </div>
        ))}
      </div>

      {/* Charts — registered users only */}
      {charts && (charts.daily.length > 0 || charts.weekly.length > 0) && (
        <div className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Registered Users Activity</h2>
            <div className="flex rounded-lg border border-sky text-xs font-medium">
              <button
                onClick={() => setChartMode("daily")}
                className={`px-3 py-1.5 transition-colors ${chartMode === "daily" ? "bg-ocean text-white" : "text-muted hover:text-navy"}`}
              >
                Daily
              </button>
              <button
                onClick={() => setChartMode("weekly")}
                className={`px-3 py-1.5 transition-colors ${chartMode === "weekly" ? "bg-ocean text-white" : "text-muted hover:text-navy"}`}
              >
                Weekly
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <ChartCard title="Active Users" dataKey="users" color="#0074D9" data={charts[chartMode]} />
            <ChartCard title="Sessions" dataKey="sessions" color="#2ECC40" data={charts[chartMode]} />
            <ChartCard title="Page Views" dataKey="views" color="#FF851B" data={charts[chartMode]} />
          </div>
        </div>
      )}

      {/* Per-user table */}
      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Users</h2>
        <div className="overflow-x-auto rounded-xl border border-sky bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sky bg-sky/30">
                <th className="px-4 py-2.5 font-medium">ID</th>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Location</th>
                <th className="px-4 py-2.5 font-medium">Device</th>
                <th className="px-4 py-2.5 font-medium">First Seen</th>
                <th className="px-4 py-2.5 font-medium">Last Seen</th>
                <th className="px-4 py-2.5 font-medium text-right">Views</th>
                <th className="px-4 py-2.5 font-medium text-right">Learn</th>
                <th className="px-4 py-2.5 font-medium text-right">Review</th>
                <th className="px-4 py-2.5 font-medium text-right">Exams</th>
                <th className="px-4 py-2.5 font-medium text-right">Passed</th>
              </tr>
            </thead>
            <tbody>
              {per_user.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-muted">
                    No users yet.
                  </td>
                </tr>
              ) : (
                per_user.map((u) => {
                  const DeviceIcon =
                    u.device_type === "mobile" ? Smartphone :
                    u.device_type === "tablet" ? Tablet : Monitor;
                  const location = [u.city, u.country].filter(Boolean).join(", ");
                  const device = [u.os, u.browser].filter(Boolean).join(" · ");

                  return (
                    <tr
                      key={u.anonymous_id}
                      className="border-b border-sky/50 last:border-0"
                    >
                      <td className="px-4 py-2.5 font-mono text-xs text-ocean">
                        <CopyableId id={u.anonymous_id} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {u.user_id ? (
                          <span className="rounded bg-ocean/10 px-1.5 py-0.5 text-ocean">
                            <CopyableId id={u.user_id} />
                          </span>
                        ) : (
                          <span className="text-muted">anon</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {location ? (
                          <span className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 text-muted" />
                            <span className="text-xs">{location}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {device ? (
                          <span className="flex items-center gap-1.5">
                            <DeviceIcon className="h-3.5 w-3.5 text-muted" />
                            <span className="text-xs">{device}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-muted">
                        {formatDate(u.first_seen)}
                      </td>
                      <td className="px-4 py-2.5 text-muted">
                        {formatDate(u.last_seen)}
                      </td>
                      <td className="px-4 py-2.5 text-right">{u.page_views}</td>
                      <td className="px-4 py-2.5 text-right">
                        {u.learning_sessions}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {u.review_sessions}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {u.exam_sessions}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium text-correct">
                        {u.exams_passed}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent events */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Recent Events</h2>
        <div className="overflow-x-auto rounded-xl border border-sky bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sky bg-sky/30">
                <th className="px-4 py-2.5 font-medium">Time</th>
                <th className="px-4 py-2.5 font-medium">Anon ID</th>
                <th className="px-4 py-2.5 font-medium">User</th>
                <th className="px-4 py-2.5 font-medium">Event</th>
                <th className="px-4 py-2.5 font-medium">Location</th>
                <th className="px-4 py-2.5 font-medium">Device</th>
                <th className="px-4 py-2.5 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {recent_events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted">
                    No events yet.
                  </td>
                </tr>
              ) : (
                recent_events.map((e) => {
                  const loc = [e.city, e.country].filter(Boolean).join(", ");
                  const dev = [e.device_type, e.os].filter(Boolean).join(" · ");
                  return (
                    <tr
                      key={e.id}
                      className="border-b border-sky/50 last:border-0"
                    >
                      <td className="px-4 py-2.5 text-muted">
                        {formatDate(e.created_at)}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-ocean">
                        <CopyableId id={e.anonymous_id} />
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs">
                        {e.user_id ? (
                          <span className="rounded bg-ocean/10 px-1.5 py-0.5 text-ocean">
                            <CopyableId id={e.user_id} />
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 font-medium">
                        {eventLabel(e.event_type)}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {loc || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted">
                        {dev || "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-muted">
                        {Object.keys(e.payload).length > 0
                          ? JSON.stringify(e.payload)
                          : "—"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
