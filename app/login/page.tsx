"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, KeyRound, Chrome } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-client";

type AuthMode = "signin" | "signup" | "magic-link";

const supabase = createSupabaseBrowser();

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center">
          <div className="text-muted">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackError = searchParams.get("error");

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(
    callbackError ? "Authentication failed. Please try again." : null
  );

  const handleEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    }

    setLoading(false);
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for a magic link.");
    }

    setLoading(false);
  };

  const handleGoogle = () => {
    setLoading(true);
    setError(null);
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-white px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mb-3 inline-block text-4xl">⚓</span>
          <h1 className="text-2xl font-bold text-navy">Leinen los!</h1>
          <p className="mt-1 text-sm text-muted">
            SBF Binnen Trainer — Sign in to sync your progress
          </p>
        </div>

        {/* Google OAuth */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-sky px-4 py-3 text-sm font-medium text-navy transition-colors hover:bg-sky/50 disabled:opacity-50"
        >
          <Chrome className="h-4 w-4" />
          Continue with Google
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-sky" />
          <span className="text-xs text-muted">or</span>
          <div className="h-px flex-1 bg-sky" />
        </div>

        {/* Mode tabs */}
        <div className="mb-4 flex gap-1 rounded-lg bg-sky p-1">
          {(
            [
              { id: "signin", label: "Sign In" },
              { id: "signup", label: "Sign Up" },
              { id: "magic-link", label: "Magic Link" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setMode(tab.id);
                setError(null);
                setMessage(null);
              }}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                mode === tab.id
                  ? "bg-white text-navy shadow-sm"
                  : "text-muted hover:text-navy"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {mode === "magic-link" ? (
          <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-sky py-3 pl-10 pr-4 text-sm focus:border-ocean focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-ocean px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleEmailPassword} className="flex flex-col gap-3">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-sky py-3 pl-10 pr-4 text-sm focus:border-ocean focus:outline-none"
              />
            </div>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full rounded-xl border border-sky py-3 pl-10 pr-4 text-sm focus:border-ocean focus:outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-ocean px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ocean/90 disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : mode === "signup"
                  ? "Create Account"
                  : "Sign In"}
            </button>
          </form>
        )}

        {error && (
          <p className="mt-3 rounded-lg bg-wrong-bg px-3 py-2 text-xs text-wrong">
            {error}
          </p>
        )}
        {message && (
          <p className="mt-3 rounded-lg bg-correct-bg px-3 py-2 text-xs text-correct">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
