#!/usr/bin/env python3
"""Validate image URLs in the database and remove broken entries."""

import sqlite3
import os
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from config import DB_PATH

def check_url(row: tuple) -> tuple[int, bool]:
    """Check if an image URL is accessible. Returns (id, is_valid)."""
    row_id, url = row
    try:
        resp = requests.head(url, timeout=10, allow_redirects=True,
                           headers={"User-Agent": "GuessTheAsian/1.0"})
        return (row_id, resp.status_code == 200)
    except Exception:
        return (row_id, False)

def main():
    db_path = os.path.join(os.path.dirname(__file__), DB_PATH)
    conn = sqlite3.connect(db_path)

    rows = conn.execute("SELECT id, image_url FROM people").fetchall()
    print(f"Validating {len(rows)} image URLs...")

    bad_ids = []
    checked = 0

    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(check_url, row): row for row in rows}
        for future in as_completed(futures):
            row_id, is_valid = future.result()
            checked += 1
            if not is_valid:
                bad_ids.append(row_id)
            if checked % 500 == 0:
                print(f"  Checked {checked}/{len(rows)} — {len(bad_ids)} bad so far")

    print(f"\nFound {len(bad_ids)} broken URLs out of {len(rows)}")

    if bad_ids:
        placeholders = ",".join("?" * len(bad_ids))
        conn.execute(f"DELETE FROM people WHERE id IN ({placeholders})", bad_ids)
        conn.commit()
        print(f"Removed {len(bad_ids)} entries")

    remaining = conn.execute("SELECT COUNT(*) FROM people").fetchone()[0]
    print(f"Remaining entries: {remaining}")
    conn.close()

if __name__ == "__main__":
    main()
