"""
Pipeline orchestrator for Leinen los! data pipeline.
Runs all steps in order with support for resuming, dry-run, and cost preview.

Usage:
    python scripts/run_pipeline.py              # full run
    python scripts/run_pipeline.py --from 4     # resume from step 4 (Russian translation)
    python scripts/run_pipeline.py --dry-run    # use GPT-4o-mini for all LLM steps
    python scripts/run_pipeline.py --cost-only  # preview LLM costs and exit
"""
from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import console, DATA_DIR

SCRIPTS_DIR = Path(__file__).parent
PYTHON = sys.executable

STEPS = [
    {
        "num": 1,
        "name": "Scrape ELWIS",
        "script": "scrape_elwis.py",
        "output": DATA_DIR / "questions-de.json",
        "llm": False,
    },
    {
        "num": 2,
        "name": "Translate to English",
        "script": "translate_english.py",
        "output": DATA_DIR / "questions-en.json",
        "llm": True,
    },
    {
        "num": 3,
        "name": "Generate highlights",
        "script": "generate_highlights.py",
        "output": DATA_DIR / "highlights.json",
        "llm": True,
    },
    {
        "num": 4,
        "name": "Translate to Russian",
        "script": "translate_russian.py",
        "output": DATA_DIR / "questions-ru.json",
        "llm": True,
    },
    {
        "num": 5,
        "name": "Generate explanations",
        "script": "generate_explanations.py",
        "output": DATA_DIR / "explanations.json",
        "llm": True,
    },
    {
        "num": 6,
        "name": "Judge quality",
        "script": "judge_quality.py",
        "output": DATA_DIR / "judge-report.json",
        "llm": True,
    },
    {
        "num": 9,
        "name": "Upload images",
        "script": "upload_images.py",
        "output": None,
        "llm": False,
    },
    {
        "num": 10,
        "name": "Seed database",
        "script": "seed_database.py",
        "output": DATA_DIR / "questions-final.json",
        "llm": False,
    },
]


COST_ESTIMATES = """
LLM Cost Estimates (GPT-4o for generation, Claude Sonnet 4.6 for judging):

  Step 2 — English translation:    ~$0.32
  Step 3 — Highlights:             ~$0.21
  Step 4 — Russian translation:    ~$0.36
  Step 5 — Explanations:           ~$2.50
  Step 6 — Quality judge:          ~$3.18
  ─────────────────────────────────────────
  Total (GPT-4o):                  ~$3.39
  Total (Claude judge):            ~$3.18
  Grand total:                     ~$6.57

  Dry-run with GPT-4o-mini:       ~$0.20 (steps 2-5 only)
"""


def run_step(step: dict, dry_run: bool = False, force: bool = False) -> bool:
    script_path = SCRIPTS_DIR / step["script"]
    cmd = [PYTHON, str(script_path)]
    if force:
        cmd.append("--force")
    if dry_run and step["llm"]:
        cmd.append("--dry-run")

    console.print(f"\n{'='*60}")
    console.print(f"[bold]Step {step['num']}: {step['name']}[/bold]")
    console.print(f"Running: {' '.join(cmd)}")
    console.print(f"{'='*60}\n")

    result = subprocess.run(cmd)
    if result.returncode != 0:
        console.print(f"\n[bold red]Step {step['num']} failed (exit code {result.returncode})[/bold red]")
        return False
    return True


def main():
    parser = argparse.ArgumentParser(description="Leinen los! data pipeline orchestrator")
    parser.add_argument("--from", dest="from_step", type=int, default=1,
                        help="Start from step N (1=scrape, 2=EN, 3=highlights, 4=RU, 5=explanations, 6=judge, 9=upload, 10=seed)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Use GPT-4o-mini for LLM steps (cheaper, for prompt validation)")
    parser.add_argument("--force", action="store_true",
                        help="Force re-run even if output exists")
    parser.add_argument("--cost-only", action="store_true",
                        help="Print cost estimates and exit")
    args = parser.parse_args()

    if args.cost_only:
        console.print(COST_ESTIMATES)
        return

    console.print("[bold]Leinen los! — Data Pipeline[/bold]")
    console.print(f"Mode: {'dry-run (GPT-4o-mini)' if args.dry_run else 'production (GPT-4o + Claude Sonnet 4.6)'}")
    console.print(f"Starting from step: {args.from_step}")
    console.print()

    steps_to_run = [s for s in STEPS if s["num"] >= args.from_step]

    if not steps_to_run:
        console.print("[yellow]No steps to run.[/yellow]")
        return

    for step in steps_to_run:
        success = run_step(step, dry_run=args.dry_run, force=args.force)
        if not success:
            console.print(f"\n[bold red]Pipeline stopped at step {step['num']}.[/bold red]")
            console.print(f"Fix the issue and resume: python scripts/run_pipeline.py --from {step['num']}")
            sys.exit(1)

    console.print(f"\n{'='*60}")
    console.print("[bold green]Pipeline complete![/bold green]")
    console.print(f"{'='*60}")


if __name__ == "__main__":
    main()
