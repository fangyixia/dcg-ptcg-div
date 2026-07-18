#!/usr/bin/env python3
"""Fetch upcoming Pokémon Championship Series events from the official API."""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_URL = "https://championships.pokemon.com/api/events.json?locale=en-us"
SOURCE_URL = "https://championships.pokemon.com/en-us/events?status=upcoming"
BASE_URL = "https://championships.pokemon.com"

TYPE_LABELS = {
    "world": "World Championships",
    "regional": "Regional & Special Championships",
    "international": "International Championships",
    "online": "Online Tournaments",
}

REGION_LABELS = {
    "northamerica": "North America",
    "oceania": "Oceania",
    "europe": "Europe",
    "latinamerica": "Latin America",
    "virtual": "Virtual",
    "mea": "Middle East & South Africa",
}

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "data" / "events.json"


def normalize_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("http"):
        return url
    return f"{BASE_URL}{url}"


def fetch_raw_events() -> dict:
    request = urllib.request.Request(
        API_URL,
        headers={"User-Agent": "dcg-ptcg-div/1.0 (+github pages event tracker)"},
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def transform_events(raw: dict) -> list[dict]:
    events: list[dict] = []
    for item in raw.get("items", []):
        type_key = item.get("type_s", "")
        region_key = item.get("region_s", "")
        events.append(
            {
                "name": item.get("eventName_s", ""),
                "date": item.get("displayDateRange_s", ""),
                "type": TYPE_LABELS.get(type_key, type_key),
                "typeKey": type_key,
                "location": item.get("eventLocation_s", ""),
                "region": REGION_LABELS.get(region_key, region_key),
                "regionKey": region_key,
                "year": item.get("year_s", ""),
                "url": normalize_url(item.get("uRL_s", "")),
                "streaming": item.get("isStreaming_b") == "true",
            }
        )
    return events


def main() -> int:
    try:
        raw = fetch_raw_events()
    except urllib.error.URLError as exc:
        print(f"Failed to fetch events: {exc}", file=sys.stderr)
        return 1

    events = transform_events(raw)
    payload = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "source": SOURCE_URL,
        "api": API_URL,
        "count": len(events),
        "events": events,
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(events)} events to {OUTPUT_PATH}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
