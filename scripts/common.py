"""
Shared utilities for Leinen los! data pipeline.
OpenRouter LLM client, file I/O helpers, progress logging, retry logic.
"""
from __future__ import annotations

import json
import os
import re
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from dotenv import load_dotenv
from openai import OpenAI
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

SCRIPTS_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPTS_DIR.parent
DATA_DIR = PROJECT_ROOT / "data"
SRC_DATA_DIR = PROJECT_ROOT / "src" / "data"
ELWIS_CACHE_DIR = DATA_DIR / "elwis-cache"
IMAGES_DIR = DATA_DIR / "images"

DATA_DIR.mkdir(exist_ok=True)
SRC_DATA_DIR.mkdir(parents=True, exist_ok=True)
ELWIS_CACHE_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)

# ---------------------------------------------------------------------------
# Environment
# ---------------------------------------------------------------------------

load_dotenv(SCRIPTS_DIR / ".env")
load_dotenv(PROJECT_ROOT / ".env")

console = Console()


def get_env(key: str) -> str:
    val = os.getenv(key)
    if not val:
        console.print(f"[red]Missing environment variable: {key}[/red]")
        console.print(f"Copy scripts/.env.example to scripts/.env and fill in your keys.")
        raise SystemExit(1)
    return val


# ---------------------------------------------------------------------------
# OpenRouter LLM Client
# ---------------------------------------------------------------------------

def get_openrouter_client() -> OpenAI:
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=get_env("OPENROUTER_API_KEY"),
    )


def llm_call(
    client: OpenAI,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    max_retries: int = 3,
    json_mode: bool = True,
) -> str:
    """
    Make an LLM call with exponential backoff retry.
    Returns the text content of the response.
    """
    for attempt in range(max_retries):
        try:
            kwargs: Any = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": temperature,
            }
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}

            response = client.chat.completions.create(**kwargs)
            content = response.choices[0].message.content
            if content is None:
                raise ValueError("Empty response from LLM")
            return content

        except Exception as e:
            if attempt == max_retries - 1:
                raise
            wait = 2 ** (attempt + 1)
            console.print(f"[yellow]Retry {attempt + 1}/{max_retries} after {wait}s: {e}[/yellow]")
            time.sleep(wait)

    raise RuntimeError("Unreachable")


_JSON_BLOCK_RE = re.compile(r'```(?:json)?\s*\n?(.*?)\n?```', re.DOTALL)

def extract_json(text: str) -> dict:
    """Extract JSON from LLM response, handling markdown code blocks."""
    text = text.strip()
    m = _JSON_BLOCK_RE.search(text)
    if m:
        text = m.group(1).strip()
    return json.loads(text)


def llm_call_json(
    client: OpenAI,
    model: str,
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.3,
    json_mode: bool = True,
) -> dict:
    """Make an LLM call and parse the JSON response."""
    raw = llm_call(client, model, system_prompt, user_prompt, temperature, json_mode=json_mode)
    return extract_json(raw)


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

MODEL_GPT4O = "openai/gpt-4o"
MODEL_GPT4O_MINI = "openai/gpt-4o-mini"
MODEL_CLAUDE_SONNET = "anthropic/claude-sonnet-4.6"

GENERATOR_MODEL = MODEL_GPT4O


# ---------------------------------------------------------------------------
# File I/O
# ---------------------------------------------------------------------------

def load_json(path: Path) -> Any:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data: Any, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    console.print(f"[green]Saved {path}[/green]")


_OPTION_PREFIX_RE = re.compile(r'^[a-dA-D]\)\s*')

def strip_option_prefix(text: str) -> str:
    """Remove leading letter prefix like 'a) ' from an option string."""
    return _OPTION_PREFIX_RE.sub('', text)


def strip_options(options: List[str]) -> List[str]:
    """Strip letter prefixes from a list of option strings."""
    return [strip_option_prefix(o) for o in options]


def load_glossary() -> List[Dict]:
    path = DATA_DIR / "nautical-glossary.json"
    if not path.exists():
        console.print("[yellow]Warning: nautical-glossary.json not found, using empty glossary[/yellow]")
        return []
    return load_json(path)


def glossary_to_prompt(glossary: List[Dict]) -> str:
    """Format the glossary for injection into system prompts."""
    if not glossary:
        return ""
    lines = ["## Nautical Glossary (use these exact translations)", ""]
    lines.append("| German | English | Russian |")
    lines.append("|--------|---------|---------|")
    for entry in glossary:
        de = entry.get("de", "")
        en = entry.get("en", "")
        ru = entry.get("ru", "")
        lines.append(f"| {de} | {en} | {ru} |")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Progress helpers
# ---------------------------------------------------------------------------

def make_progress() -> Progress:
    return Progress(
        SpinnerColumn(),
        TextColumn("[progress.description]{task.description}"),
        BarColumn(),
        TaskProgressColumn(),
        console=console,
    )


def check_existing_output(path: Path, expected_count: Optional[int] = None) -> bool:
    """Check if output already exists and is complete. Used for idempotency."""
    if not path.exists():
        return False
    try:
        data = load_json(path)
        if expected_count is not None:
            if isinstance(data, list):
                return len(data) >= expected_count
            if isinstance(data, dict):
                return len(data) >= expected_count
        return True
    except (json.JSONDecodeError, KeyError):
        return False
