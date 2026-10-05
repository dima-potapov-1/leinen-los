"use client";

import Link from "next/link";
import { Settings as SettingsIcon, LogOut, LogIn } from "lucide-react";
import { usePreferencesStore, type QuestionOrder } from "@/hooks/usePreferencesStore";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/analytics";
import type { Language } from "@/types";

const QUESTION_ORDERS: { id: QuestionOrder; label: string }[] = [
  { id: "random", label: "Random" },
  { id: "sequential", label: "Sequential" },
  { id: "weakest-first", label: "Weakest First" },
];

const LANGUAGES: { id: Language; label: string }[] = [
  { id: "de", label: "Deutsch" },
  { id: "en", label: "English" },
  { id: "ru", label: "Русский" },
];

export default function SettingsPage() {
  const hydrated = usePreferencesStore((s) => s.hydrated);
  const { user, signOut } = useAuth();
  const primary = usePreferencesStore((s) => s.primaryLanguage);
  const secondary = usePreferencesStore((s) => s.secondaryLanguage);
  const sessionSize = usePreferencesStore((s) => s.sessionSize);
  const questionOrder = usePreferencesStore((s) => s.questionOrder);
  const shuffleAnswers = usePreferencesStore((s) => s.shuffleAnswers);
  const examDate = usePreferencesStore((s) => s.examDate);
  const setPrimary = usePreferencesStore((s) => s.setPrimaryLanguage);
  const setSecondary = usePreferencesStore((s) => s.setSecondaryLanguage);
  const setSessionSize = usePreferencesStore((s) => s.setSessionSize);
  const setQuestionOrder = usePreferencesStore((s) => s.setQuestionOrder);
  const setShuffleAnswers = usePreferencesStore((s) => s.setShuffleAnswers);
  const setExamDate = usePreferencesStore((s) => s.setExamDate);

  if (!hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-ocean" />
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="flex flex-col gap-4">
        {/* Primary language */}
        <div className="rounded-xl border border-sky bg-white p-5">
          <label className="mb-2 block text-sm font-medium">
            Primary language
          </label>
          <div className="flex gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  trackEvent("settings_change", { field: "primary_language", old_value: primary, new_value: lang.id });
                  setPrimary(lang.id);
                }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  primary === lang.id
                    ? "bg-ocean text-white"
                    : "border border-sky text-muted hover:border-ocean hover:text-navy"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary language */}
        <div className="rounded-xl border border-sky bg-white p-5">
          <label className="mb-2 block text-sm font-medium">
            Secondary language (toggle)
          </label>
          <div className="flex gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                onClick={() => {
                  trackEvent("settings_change", { field: "secondary_language", old_value: secondary, new_value: lang.id });
                  setSecondary(lang.id);
                }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  secondary === lang.id
                    ? "bg-ocean text-white"
                    : "border border-sky text-muted hover:border-ocean hover:text-navy"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Shown when you tap the language toggle on a question card.
          </p>
        </div>

        {/* Session size */}
        <div className="rounded-xl border border-sky bg-white p-5">
          <label className="mb-2 block text-sm font-medium">
            Questions per session
          </label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min={5}
              max={30}
              step={5}
              value={sessionSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                trackEvent("settings_change", { field: "session_size", old_value: sessionSize, new_value: newSize });
                setSessionSize(newSize);
              }}
              className="flex-1 accent-ocean"
            />
            <span className="w-8 text-center text-sm font-medium">
              {sessionSize}
            </span>
          </div>
        </div>

        {/* Question order */}
        <div className="rounded-xl border border-sky bg-white p-5">
          <label className="mb-2 block text-sm font-medium">
            Question order in Learn mode
          </label>
          <div className="flex gap-2">
            {QUESTION_ORDERS.map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  trackEvent("settings_change", { field: "question_order", old_value: questionOrder, new_value: o.id });
                  setQuestionOrder(o.id);
                }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  questionOrder === o.id
                    ? "bg-ocean text-white"
                    : "border border-sky text-muted hover:border-ocean hover:text-navy"
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            {questionOrder === "sequential"
              ? "Progresses through questions by number, resuming where you left off."
              : questionOrder === "weakest-first"
                ? "Only unmastered questions — skips familiar ones to speed up learning."
                : "Mixed from all mastery levels."}
          </p>
        </div>

        {/* Shuffle answer order */}
        <div className="rounded-xl border border-sky bg-white p-5">
          <label className="mb-2 block text-sm font-medium">
            Answer order
          </label>
          <div className="flex gap-2">
            {([false, true] as const).map((value) => (
              <button
                key={String(value)}
                onClick={() => {
                  trackEvent("settings_change", { field: "shuffle_answers", old_value: shuffleAnswers, new_value: value });
                  setShuffleAnswers(value);
                }}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  shuffleAnswers === value
                    ? "bg-ocean text-white"
                    : "border border-sky text-muted hover:border-ocean hover:text-navy"
                }`}
              >
                {value ? "Shuffled" : "Fixed"}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs text-muted">
            Randomize answer positions in Learn, Review, and Exam modes.
          </p>
        </div>

        {/* Exam date */}
        <div className="rounded-xl border border-sky bg-white p-5">
          <label className="mb-2 block text-sm font-medium">Exam date</label>
          <input
            type="date"
            value={examDate ?? ""}
            onChange={(e) => {
              const newDate = e.target.value || null;
              trackEvent("settings_change", { field: "exam_date", old_value: examDate, new_value: newDate });
              setExamDate(newDate);
            }}
            className="w-full rounded-lg border border-sky px-4 py-2.5 text-sm focus:border-ocean focus:outline-none"
          />
          <p className="mt-1.5 text-xs text-muted">
            Enables the countdown on the home screen.
          </p>
        </div>

        {/* Account */}
        <div className="rounded-xl border border-sky bg-white p-5">
          <label className="mb-2 block text-sm font-medium">Account</label>
          {user ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{user.email}</span>
              <button
                onClick={() => {
                  trackEvent("sign_out");
                  signOut();
                }}
                className="flex items-center gap-1.5 rounded-lg border border-sky px-3 py-2 text-sm font-medium text-muted transition-colors hover:border-wrong hover:text-wrong"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-sm text-muted">
                Sign in to sync progress across your devices.
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 rounded-lg bg-ocean px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
              >
                <LogIn className="h-4 w-4" />
                Sign in or create account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
