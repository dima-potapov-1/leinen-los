"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useProgressStore } from "@/hooks/useProgressStore";
import { usePreferencesStore } from "@/hooks/usePreferencesStore";
import { createSupabaseBrowser } from "@/lib/supabase-client";
import { setAnalyticsUser } from "@/lib/analytics";
import { trackEvent } from "@/lib/analytics";
import type { Mastery } from "@/types";

interface LocalStorageProgress {
  state: {
    progress: Record<
      string,
      {
        mastery: Mastery;
        consecutiveCorrect: number;
        attempts: number;
        correctCount: number;
        bookmarked: boolean;
      }
    >;
  };
}

interface LocalStoragePreferences {
  state: {
    primaryLanguage: string;
    secondaryLanguage: string;
    sessionSize: number;
    examDate: string | null;
    streakCount: number;
    lastStudyDate: string | null;
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const [migrationToast, setMigrationToast] = useState<string | null>(null);
  const hydrationDone = useRef(false);

  useEffect(() => {
    if (loading || hydrationDone.current) return;
    if (!user) return;

    hydrationDone.current = true;
    setAnalyticsUser(user.id);

    (async () => {
      const userId = user.id;
      const isNewUser =
        user.created_at &&
        Date.now() - new Date(user.created_at).getTime() < 60_000;

      trackEvent(isNewUser ? "sign_up" : "sign_in", {
        method: user.app_metadata?.provider ?? "email",
      });

      await Promise.all([
        useProgressStore.getState().hydrateFromServer(userId),
        usePreferencesStore.getState().hydrateFromServer(userId),
      ]);

      const serverProgress = useProgressStore.getState().progress;
      const hasServerProgress = Object.keys(serverProgress).length > 0;

      if (!hasServerProgress) {
        const migrated = await migrateLocalProgress(userId);
        await migrateLocalPreferences(userId);

        if (migrated > 0) {
          await useProgressStore.getState().hydrateFromServer(userId);
          trackEvent("progress_migrated", { questions_count: migrated });
          setMigrationToast(
            `Your local progress (${migrated} questions) has been uploaded. It will now sync across all your devices.`
          );
        }
      }
    })();
  }, [user, loading]);

  useEffect(() => {
    if (!user && !loading && hydrationDone.current) {
      hydrationDone.current = false;
      setAnalyticsUser(null);
      useProgressStore.getState().clearForLogout();
      usePreferencesStore.getState().clearForLogout();
    }
  }, [user, loading]);

  useEffect(() => {
    if (loading || user) return;
    useProgressStore.setState({ hydrated: true });
    usePreferencesStore.setState({ hydrated: true });
  }, [user, loading]);

  return (
    <>
      {children}
      {migrationToast && (
        <div className="fixed bottom-24 left-1/2 z-[100] w-[90%] max-w-md -translate-x-1/2 animate-fade-in rounded-xl border border-correct/30 bg-correct-bg px-4 py-3 text-sm text-navy shadow-lg md:bottom-6">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-correct">✓</span>
            <p>{migrationToast}</p>
          </div>
          <button
            onClick={() => setMigrationToast(null)}
            className="absolute right-2 top-2 text-muted hover:text-navy"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}

async function migrateLocalProgress(userId: string): Promise<number> {
  try {
    const raw = localStorage.getItem("leinen-los-progress");
    if (!raw) return 0;

    const parsed: LocalStorageProgress = JSON.parse(raw);
    const entries = parsed?.state?.progress;
    if (!entries || Object.keys(entries).length === 0) return 0;

    const supabase = createSupabaseBrowser();
    const rows = Object.entries(entries)
      .filter(([, p]) => p.attempts > 0)
      .map(([questionId, p]) => ({
        user_id: userId,
        question_id: Number(questionId),
        mastery: p.mastery,
        consecutive_correct: p.consecutiveCorrect,
        attempts: p.attempts,
        correct_count: p.correctCount,
        bookmarked: p.bookmarked,
      }));

    if (rows.length === 0) return 0;

    const { error } = await supabase.from("user_progress").upsert(rows, {
      onConflict: "user_id,question_id",
    });

    if (error) {
      console.error("Failed to migrate local progress:", error);
      return 0;
    }

    localStorage.removeItem("leinen-los-progress");
    return rows.length;
  } catch (e) {
    console.error("Error migrating local progress:", e);
    return 0;
  }
}

async function migrateLocalPreferences(userId: string) {
  try {
    const raw = localStorage.getItem("leinen-los-preferences");
    if (!raw) return;

    const parsed: LocalStoragePreferences = JSON.parse(raw);
    const prefs = parsed?.state;
    if (!prefs) return;

    const supabase = createSupabaseBrowser();
    const { error } = await supabase
      .from("profiles")
      .update({
        preferences: {
          primary_language: prefs.primaryLanguage ?? "de",
          secondary_language: prefs.secondaryLanguage ?? "en",
          session_size: prefs.sessionSize ?? 10,
          exam_date: prefs.examDate ?? null,
          streak_count: prefs.streakCount ?? 0,
          last_study_date: prefs.lastStudyDate ?? null,
        },
      })
      .eq("id", userId);

    if (error) {
      console.error("Failed to migrate local preferences:", error);
      return;
    }

    localStorage.removeItem("leinen-los-preferences");
    await usePreferencesStore.getState().hydrateFromServer(userId);
  } catch (e) {
    console.error("Error migrating local preferences:", e);
  }
}
