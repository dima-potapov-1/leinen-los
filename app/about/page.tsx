import {
  Languages,
  MessageCircleQuestion,
  ClipboardCheck,
  TrendingUp,
  BookOpen,
  Bookmark,
  BarChart3,
  Columns2,
  Ship,
  Zap,
} from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Hero */}
      <section className="mb-10 text-center">
        <span className="mb-4 inline-block text-5xl">⚓</span>
        <h1 className="mb-3 text-2xl font-bold leading-tight sm:text-3xl">
          Need the German boat license —{" "}
          <span className="text-ocean">but the exam is only in German?</span>
        </h1>
        <p className="mx-auto mb-6 max-w-lg text-base leading-relaxed text-muted">
          Study all 300 official SBF Binnen questions in English, German, or
          Russian. Get a wrong answer? Learn exactly why — so you understand the
          rules, not just memorize them.
        </p>
        <Link
          href="/learn"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
        >
          <Ship className="h-4 w-4" />
          Start Studying — Free
        </Link>
        <p className="mt-2.5 text-xs text-muted">
          Sign in to sync your progress across all your devices.
        </p>
      </section>

      {/* The Problem */}
      <section className="mb-6 rounded-xl border border-sky bg-sky/30 p-5">
        <h2 className="mb-2 text-lg font-semibold">
          What is the SBF Binnen?
        </h2>
        <p className="text-sm leading-relaxed text-navy/80">
          The Sportbootführerschein Binnen (SBF Binnen) is required for
          motorboats over 15&nbsp;HP and sailboats over 6&nbsp;m² sail area on
          German inland waters. The official exam has 300 multiple-choice
          questions — all in German. If German isn&rsquo;t your first language,
          studying from the official catalog feels like solving two problems at
          once: learning the material <em>and</em> decoding the language.
        </p>
      </section>

      {/* How it works — 4 steps */}
      <section className="mb-6">
        <h2 className="mb-4 text-lg font-semibold">How it works</h2>
        <div className="flex flex-col gap-3">
          <div className="rounded-xl border border-sky bg-white p-5">
            <div className="mb-2 flex items-center gap-2.5">
              <Languages className="h-5 w-5 shrink-0 text-ocean" />
              <h3 className="text-sm font-semibold">Study in your language</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Every question available in German, English, and Russian. Toggle
              between languages instantly — without leaving the question.
            </p>
          </div>

          <div className="rounded-xl border border-sky bg-white p-5">
            <div className="mb-2 flex items-center gap-2.5">
              <Columns2 className="h-5 w-5 shrink-0 text-ocean" />
              <h3 className="text-sm font-semibold">Explore side-by-side</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Read every question in two languages at once — your primary on the
              left, your secondary on the right. The correct answer is
              pre-highlighted so you can absorb the material before you start
              answering.
            </p>
          </div>

          <div className="rounded-xl border border-sky bg-white p-5">
            <div className="mb-2 flex items-center gap-2.5">
              <MessageCircleQuestion className="h-5 w-5 shrink-0 text-ocean" />
              <h3 className="text-sm font-semibold">
                Understand, don&rsquo;t just memorize
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Pick the wrong answer? You&rsquo;ll see exactly why{" "}
              <em>that specific choice</em> was wrong — not a generic
              &ldquo;the correct answer is A.&rdquo; Each wrong option has its
              own explanation, so you build real understanding of the rules.
            </p>
          </div>

          <div className="rounded-xl border border-sky bg-white p-5">
            <div className="mb-2 flex items-center gap-2.5">
              <ClipboardCheck className="h-5 w-5 shrink-0 text-ocean" />
              <h3 className="text-sm font-semibold">
                Practice like the real exam
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Real Prüfungsbögen (exam papers), the same split pass thresholds
              across Basis, Binnen, and Segel categories, and a 60-minute timer.
            </p>
          </div>

          <div className="rounded-xl border border-sky bg-white p-5">
            <div className="mb-2 flex items-center gap-2.5">
              <TrendingUp className="h-5 w-5 shrink-0 text-ocean" />
              <h3 className="text-sm font-semibold">Know when you&rsquo;re ready</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted">
              Mastery tracking per category, readiness traffic lights that
              mirror the real pass thresholds, and a streak counter to keep you
              on track.
            </p>
          </div>
        </div>
      </section>

      {/* Exam format — credibility card */}
      <section className="mb-6 rounded-xl border border-sky bg-white p-5">
        <h2 className="mb-3 text-lg font-semibold">The exam at a glance</h2>
        <p className="mb-3 text-sm text-muted">
          Motor + Segel license — 37 questions, 60 minutes
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-sky/50 px-3 py-3">
            <p className="text-xs font-medium text-muted">Basis</p>
            <p className="text-lg font-bold text-navy">7</p>
            <p className="text-xs text-muted">pass: 5+</p>
          </div>
          <div className="rounded-lg bg-sky/50 px-3 py-3">
            <p className="text-xs font-medium text-muted">Binnen</p>
            <p className="text-lg font-bold text-navy">23</p>
            <p className="text-xs text-muted">pass: 18+</p>
          </div>
          <div className="rounded-lg bg-sky/50 px-3 py-3">
            <p className="text-xs font-medium text-muted">Segel</p>
            <p className="text-lg font-bold text-navy">7</p>
            <p className="text-xs text-muted">pass: 5+</p>
          </div>
        </div>
        <div className="mt-4 space-y-1.5 text-sm text-navy/80">
          <p>
            <span className="font-medium">All 300 questions from ELWIS</span>{" "}
            — the official government catalog.
          </p>
          <p>
            <span className="font-medium">15 real exam papers</span>{" "}
            (Prüfungsbögen) — identical to what you&rsquo;ll get on test day.
          </p>
        </div>
      </section>

      {/* Benefits */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">What you get</h2>
        <div className="flex flex-col gap-2.5">
          {[
            {
              icon: Zap,
              title: "Explanations for every wrong choice",
              text: 'Picked "2 seconds"? The app tells you why 2 seconds is too long for a short blast and what the correct duration is. Not a generic correction — a specific one for the answer you chose.',
            },
            {
              icon: BookOpen,
              title: "Smart review",
              text: "Mistakes auto-collect so you drill your weak spots, not waste time on what you already know.",
            },
            {
              icon: Bookmark,
              title: "Bookmarks",
              text: "Flag tricky questions for extra practice — independent of whether you got them right or wrong.",
            },
            {
              icon: BarChart3,
              title: "Progress dashboard",
              text: "See exactly how close you are to exam-ready, broken down per category with readiness traffic lights.",
            },
            {
              icon: Ship,
              title: "Sync across devices",
              text: "Sign in once and your progress follows you to any device — phone, tablet, or desktop.",
            },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3 rounded-xl border border-sky bg-white p-4">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ocean" />
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mb-4 text-center">
        <p className="mb-4 text-base font-medium leading-relaxed text-navy/80">
          300 questions. 3 languages.
          <br />
          The same exam you&rsquo;ll face — but in a language you understand.
        </p>
        <Link
          href="/learn"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-ocean px-8 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-ocean/90"
        >
          <Ship className="h-4 w-4" />
          Start Studying
        </Link>
      </section>
    </div>
  );
}
