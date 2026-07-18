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
    "world": "世界錦標賽",
    "regional": "區域／特別錦標賽",
    "international": "國際錦標賽",
    "online": "線上賽事",
}

REGION_LABELS = {
    "northamerica": "北美",
    "oceania": "大洋洲",
    "europe": "歐洲",
    "latinamerica": "拉丁美洲",
    "virtual": "線上",
    "mea": "中東與非洲",
}

NAME_REPLACEMENTS = [
    ("Pokémon World Championships", "寶可夢世界錦標賽"),
    ("Pokémon North America International Championships", "寶可夢北美國際錦標賽"),
    ("Pokémon Europe International Championships", "寶可夢歐洲國際錦標賽"),
    ("Pokémon Latin America International Championships", "寶可夢拉丁美洲國際錦標賽"),
    ("Pokémon Special Championships", "寶可夢特別錦標賽"),
    ("Pokémon Regional Championships", "寶可夢區域錦標賽"),
]

MONTH_MAP = {
    "Jan.": "1 月",
    "Feb.": "2 月",
    "Mar.": "3 月",
    "Apr.": "4 月",
    "May": "5 月",
    "June": "6 月",
    "July": "7 月",
    "Aug.": "8 月",
    "Sept.": "9 月",
    "Oct.": "10 月",
    "Nov.": "11 月",
    "Dec.": "12 月",
}

ROOT = Path(__file__).resolve().parent.parent
OUTPUT_PATH = ROOT / "data" / "events.json"


def normalize_url(url: str) -> str:
    if not url:
        return ""
    if url.startswith("http"):
        return url
    return f"{BASE_URL}{url}"


def translate_event_name(name: str) -> str:
    result = name
    for english, chinese in NAME_REPLACEMENTS:
        result = result.replace(english, chinese)
    return result


def translate_date_range(date_range: str) -> str:
    if not date_range:
        return date_range

    result = date_range
    for english, chinese in MONTH_MAP.items():
        result = result.replace(english, chinese)

    result = result.replace(" – ", "－").replace(" - ", "－").replace("–", "－")
    return result


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
        english_name = item.get("eventName_s", "")
        events.append(
            {
                "name": translate_event_name(english_name),
                "nameEn": english_name,
                "date": translate_date_range(item.get("displayDateRange_s", "")),
                "dateEn": item.get("displayDateRange_s", ""),
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
