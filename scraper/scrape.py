#!/usr/bin/env python3
"""Scrape notable people with photos from Wikidata for each Asian country."""

import sqlite3
import time
import requests
import os
from config import COUNTRIES, SPARQL_ENDPOINT, DB_PATH, REQUEST_TIMEOUT, REQUEST_DELAY, BATCH_SIZE

def get_sparql_query(country_qid: str, limit: int = BATCH_SIZE, offset: int = 0) -> str:
    return f"""
    SELECT DISTINCT ?person ?personLabel ?personDescription ?image WHERE {{
      ?person wdt:P31 wd:Q5 ;
              wdt:P27 wd:{country_qid} ;
              wdt:P18 ?image .
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }}
    }}
    LIMIT {limit}
    OFFSET {offset}
    """

def init_db(db_path: str) -> sqlite3.Connection:
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    conn = sqlite3.connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS people (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wikidata_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            country TEXT NOT NULL,
            image_url TEXT NOT NULL
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_country ON people(country)")
    conn.commit()
    return conn

def fetch_people(country_name: str, country_qid: str) -> list[dict]:
    """Fetch all people with photos from a country via SPARQL."""
    all_results = []
    offset = 0

    while True:
        query = get_sparql_query(country_qid, BATCH_SIZE, offset)
        headers = {
            "Accept": "application/sparql-results+json",
            "User-Agent": "GuessTheAsian/1.0 (Educational game project)"
        }

        print(f"  Fetching offset {offset}...")
        try:
            resp = requests.get(
                SPARQL_ENDPOINT,
                params={"query": query},
                headers=headers,
                timeout=REQUEST_TIMEOUT
            )
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"  Error at offset {offset}: {e}")
            break

        bindings = data.get("results", {}).get("bindings", [])
        if not bindings:
            break

        for b in bindings:
            wikidata_id = b["person"]["value"].split("/")[-1]
            name = b.get("personLabel", {}).get("value", "")
            description = b.get("personDescription", {}).get("value", "")
            image_url = b.get("image", {}).get("value", "")

            # Skip entries where the label is just the Q-ID
            if name.startswith("Q") and name[1:].isdigit():
                continue
            if not image_url:
                continue

            all_results.append({
                "wikidata_id": wikidata_id,
                "name": name,
                "description": description or "",
                "country": country_name,
                "image_url": image_url,
            })

        if len(bindings) < BATCH_SIZE:
            break

        offset += BATCH_SIZE
        time.sleep(REQUEST_DELAY)

    return all_results

def main():
    db_path = os.path.join(os.path.dirname(__file__), DB_PATH)
    conn = init_db(db_path)

    total = 0
    for country_name, country_qid in COUNTRIES.items():
        print(f"\n=== {country_name} ({country_qid}) ===")
        people = fetch_people(country_name, country_qid)
        print(f"  Found {len(people)} people with photos")

        inserted = 0
        for p in people:
            try:
                conn.execute(
                    "INSERT OR IGNORE INTO people (wikidata_id, name, description, country, image_url) VALUES (?, ?, ?, ?, ?)",
                    (p["wikidata_id"], p["name"], p["description"], p["country"], p["image_url"])
                )
                inserted += 1
            except sqlite3.Error:
                pass

        conn.commit()
        print(f"  Inserted {inserted} new entries")
        total += inserted
        time.sleep(REQUEST_DELAY)

    # Print summary
    print(f"\n{'='*40}")
    print(f"Total inserted: {total}")
    cursor = conn.execute("SELECT country, COUNT(*) FROM people GROUP BY country ORDER BY COUNT(*) DESC")
    for row in cursor:
        print(f"  {row[0]}: {row[1]}")
    print(f"  TOTAL: {conn.execute('SELECT COUNT(*) FROM people').fetchone()[0]}")

    conn.close()

if __name__ == "__main__":
    main()
