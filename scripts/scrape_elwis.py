"""
Step 1: Scrape ELWIS official SBF Binnen question catalog.
Extracts 300 questions (72 Basis + 181 Binnen + 47 Segel) with images.

Usage:
    python scripts/scrape_elwis.py [--force]
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from typing import Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    DATA_DIR, ELWIS_CACHE_DIR, IMAGES_DIR,
    check_existing_output, console, load_json, make_progress, save_json,
)

ELWIS_PAGES = {
    "basis": {
        "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Basisfragen/Basisfragen-node.html",
        "topic": "basis",
        "range": (1, 72),
    },
    "binnen": {
        "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Spezifische-Fragen-Binnen/Spezifische-Fragen-Binnen-node.html",
        "topic": "binnen",
        "range": (73, 253),
    },
    "segeln": {
        "url": "https://www.elwis.de/DE/Sportschifffahrt/Sportbootfuehrerscheine/Fragenkatalog-Binnen/Spezifische-Fragen-Segeln/Spezifische-Fragen-Segeln-node.html",
        "topic": "segeln",
        "range": (254, 300),
    },
}

QUESTION_RE = re.compile(r"^(\d+)\.\s+(.+)")

OUTPUT_PATH = DATA_DIR / "questions-de.json"


def fetch_page(url: str, cache_name: str) -> str:
    cache_path = ELWIS_CACHE_DIR / f"{cache_name}.html"
    if cache_path.exists():
        console.print(f"[dim]Using cached {cache_path}[/dim]")
        return cache_path.read_text(encoding="utf-8")

    console.print(f"Fetching {url}")
    r = httpx.get(url, follow_redirects=True, timeout=30)
    r.raise_for_status()
    cache_path.write_text(r.text, encoding="utf-8")
    return r.text


def download_image(url: str, client: httpx.Client) -> Optional[str]:
    """Download an image and return the local filename."""
    filename = url.split("/")[-1].split("?")[0]
    local_path = IMAGES_DIR / filename
    if local_path.exists():
        return filename
    try:
        r = client.get(url, follow_redirects=True, timeout=30)
        r.raise_for_status()
        local_path.write_bytes(r.content)
        return filename
    except Exception as e:
        console.print(f"[yellow]Failed to download {url}: {e}[/yellow]")
        return None


def parse_questions(html: str, topic: str, base_url: str, client: httpx.Client) -> list[dict]:
    """Parse questions from an ELWIS HTML page."""
    soup = BeautifulSoup(html, "lxml")
    content = soup.find(id="content")
    if not content:
        console.print("[red]Could not find #content div[/red]")
        return []

    questions = []
    elements = list(content.children)
    i = 0

    while i < len(elements):
        el = elements[i]
        if not hasattr(el, "name") or el.name != "p":
            i += 1
            continue

        text = el.get_text(strip=True)
        m = QUESTION_RE.match(text)
        if not m:
            i += 1
            continue

        q_num = int(m.group(1))
        q_text = m.group(2)
        image_url = None
        image_file = None
        i += 1

        # Look for image and options after the question paragraph
        while i < len(elements):
            el2 = elements[i]
            if not hasattr(el2, "name"):
                i += 1
                continue

            # Image paragraph
            if el2.name == "p" and el2.get("class") and "picture" in el2.get("class", []):
                img_tag = el2.find("img")
                if img_tag and img_tag.get("src"):
                    image_url = img_tag["src"]
                    if not image_url.startswith("http"):
                        image_url = urljoin(base_url, image_url)
                    image_file = download_image(image_url, client)
                i += 1
                continue

            # Options list
            if el2.name == "ol":
                lis = el2.find_all("li", recursive=False)
                options = [li.get_text(strip=True) for li in lis]
                if len(options) == 4:
                    # In ELWIS, answer "a" (first li) is always correct.
                    # We store them in the original ELWIS order — shuffling happens at seed time.
                    questions.append({
                        "id": q_num,
                        "topic": topic,
                        "question_de": q_text,
                        "options_de": options,
                        "correct_option": 0,
                        "image_file": image_file,
                        "image_url_original": image_url,
                    })
                else:
                    console.print(f"[yellow]Q{q_num}: expected 4 options, got {len(options)}[/yellow]")
                i += 1
                break

            # Separator or next question — break
            if el2.name == "p":
                cls = el2.get("class", [])
                if "line" in cls:
                    i += 1
                    continue
                # Check if it's the next question (some questions have extra paragraphs that
                # are part of the question text — e.g., text continuing after an image)
                if QUESTION_RE.match(el2.get_text(strip=True)):
                    break
                # It might be an inline image or extra text — append to question if before options
                extra_text = el2.get_text(strip=True)
                if extra_text and not image_url:
                    img_tag = el2.find("img")
                    if img_tag and img_tag.get("src"):
                        image_url = img_tag["src"]
                        if not image_url.startswith("http"):
                            image_url = urljoin(base_url, image_url)
                        image_file = download_image(image_url, client)
                i += 1
                continue

            i += 1

    return questions


def scrape_all(force: bool = False) -> list[dict]:
    if not force and check_existing_output(OUTPUT_PATH, expected_count=300):
        console.print("[green]questions-de.json already exists with 300 questions, skipping.[/green]")
        console.print("Use --force to re-scrape.")
        return load_json(OUTPUT_PATH)

    all_questions = []
    client = httpx.Client(timeout=30, follow_redirects=True)

    try:
        with make_progress() as progress:
            task = progress.add_task("Scraping ELWIS", total=3)
            for name, cfg in ELWIS_PAGES.items():
                html = fetch_page(cfg["url"], name)
                questions = parse_questions(html, cfg["topic"], cfg["url"], client)
                expected = cfg["range"][1] - cfg["range"][0] + 1
                console.print(f"  {name}: {len(questions)}/{expected} questions parsed")
                if len(questions) != expected:
                    console.print(f"  [yellow]Warning: expected {expected}, got {len(questions)}[/yellow]")
                all_questions.extend(questions)
                progress.advance(task)
    finally:
        client.close()

    all_questions.sort(key=lambda q: q["id"])
    save_json(all_questions, OUTPUT_PATH)
    console.print(f"\n[bold green]Total: {len(all_questions)} questions scraped[/bold green]")

    # Summary
    topics = {}
    images = 0
    for q in all_questions:
        topics[q["topic"]] = topics.get(q["topic"], 0) + 1
        if q["image_file"]:
            images += 1
    for t, c in topics.items():
        console.print(f"  {t}: {c} questions")
    console.print(f"  Images: {images}")

    return all_questions


def main():
    parser = argparse.ArgumentParser(description="Scrape ELWIS SBF Binnen question catalog")
    parser.add_argument("--force", action="store_true", help="Force re-scrape even if output exists")
    args = parser.parse_args()

    questions = scrape_all(force=args.force)

    if len(questions) < 300:
        console.print(f"\n[red]ERROR: Only {len(questions)}/300 questions scraped. Check parser.[/red]")
        sys.exit(1)


if __name__ == "__main__":
    main()
