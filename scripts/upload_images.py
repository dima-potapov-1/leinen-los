"""
Step 9: Upload scraped images to Supabase Storage.
Records public URLs back into the question data.

Usage:
    python scripts/upload_images.py [--dry-run]
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from common import (
    DATA_DIR, IMAGES_DIR,
    console, load_json, make_progress, save_json,
)

DE_PATH = DATA_DIR / "questions-de.json"
BUCKET_NAME = "question-images"


def main():
    parser = argparse.ArgumentParser(description="Upload images to Supabase Storage")
    parser.add_argument("--dry-run", action="store_true", help="List images without uploading")
    args = parser.parse_args()

    if not DE_PATH.exists():
        console.print("[red]questions-de.json not found.[/red]")
        sys.exit(1)

    questions = load_json(DE_PATH)
    images = [q for q in questions if q.get("image_file")]
    console.print(f"Found {len(images)} questions with images")

    if args.dry_run:
        for q in images:
            path = IMAGES_DIR / q["image_file"]
            exists = path.exists()
            size = path.stat().st_size if exists else 0
            console.print(f"  Q{q['id']}: {q['image_file']} ({'exists' if exists else 'MISSING'}, {size} bytes)")
        return

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        console.print("[yellow]Supabase credentials not found. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.[/yellow]")
        console.print("Images are available locally in data/images/")
        return

    from supabase import create_client
    client = create_client(url, key)

    uploaded = 0
    with make_progress() as progress:
        task = progress.add_task("Uploading images", total=len(images))
        for q in images:
            local_path = IMAGES_DIR / q["image_file"]
            if not local_path.exists():
                console.print(f"[yellow]Q{q['id']}: {q['image_file']} not found locally[/yellow]")
                progress.advance(task)
                continue

            remote_path = f"questions/{q['image_file']}"
            try:
                with open(local_path, "rb") as f:
                    client.storage.from_(BUCKET_NAME).upload(
                        remote_path, f.read(),
                        file_options={"content-type": "image/gif", "upsert": "true"}
                    )
                uploaded += 1
            except Exception as e:
                console.print(f"[yellow]Q{q['id']}: upload failed: {e}[/yellow]")
            progress.advance(task)

    console.print(f"\n[bold green]Uploaded {uploaded}/{len(images)} images[/bold green]")


if __name__ == "__main__":
    main()
