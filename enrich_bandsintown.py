#!/usr/bin/env python3
"""
enrich_bandsintown.py

Reads artist Bandsintown profile URLs from hb_socials in Supabase, scrapes
each artist's Bandsintown profile page (Playwright + stealth), and writes
back to hb_socials and hb_events.

READ:  hb_socials  — rows where type='Bandsintown', ordered by check_bandsintown_events
                     ascending (nulls first) so stalest records are processed first.
WRITE: hb_socials  — name, description, image, followers, check_bandsintown_events
       hb_events   — upsert upcoming events by bit_id (dedup)

Usage:
    python3 enrich_bandsintown.py --limit 10
    python3 enrich_bandsintown.py --all
"""

import sys
import argparse
import requests
import json
import time
import re
import random
import csv
import asyncio
from datetime import datetime, date

from playwright.sync_api import sync_playwright
from playwright_stealth import stealth
from bs4 import BeautifulSoup
from supabase import create_client
import os

# ── Supabase client ──────────────────────────────────────────────────────────
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Bypass config (Cloudflare / Akamai via RapidAPI) ────────────────────────
RAPID_API_KEY  = os.getenv("RAPID_API_KEY", "8f8ab324eamsh88b8de70b402e0cp1d7d0ajsn13c934eadbd9")
RAPID_API_HOST = "bypass-akamai-cloudflare.p.rapidapi.com"
RAPID_API_URL  = "https://bypass-akamai-cloudflare.p.rapidapi.com/paid/akamai"

# ── User-Agent pool ──────────────────────────────────────────────────────────
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
]

SCRAPE_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Referer": "https://www.google.com/"
}

# Persistent session for requests (maintains cookies)
session = requests.Session()
session.headers.update(SCRAPE_HEADERS)


# ── Playwright scrape helper ─────────────────────────────────────────────────

def fetch_page_with_playwright(url: str) -> str | None:
    """Launch a stealth headless browser, navigate to url, return raw HTML."""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800}
            )
            page = context.new_page()
            stealth(page)

            print(f"    [WEB] Stealth browser: {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(2000)  # let JS settle

            content = page.content()
            browser.close()
            return content
    except Exception as e:
        print(f"    [ERROR] Playwright failed: {e}")
        return None


# ── URL heal helper ──────────────────────────────────────────────────────────

def heal_bandsintown_url(artist_name: str) -> str | None:
    """Query the Bandsintown public REST API to find the canonical artist URL."""
    import urllib.parse
    APP_ID = "ROSTRb561edcacfa949de9eea035febe236da"
    safe_name = urllib.parse.quote(artist_name)
    search_url = f"https://rest.bandsintown.com/artists/{safe_name}?app_id={APP_ID}"
    try:
        r = requests.get(search_url, timeout=10)
        if r.status_code == 200:
            data = r.json()
            if data and "url" in data:
                new_url = data["url"]
                print(f"    [HEALED] Found new URL for {artist_name}: {new_url}")
                return new_url
    except Exception as e:
        print(f"    [ERROR] Healing failed for {artist_name}: {e}")
    return None


# ── Core scraper ─────────────────────────────────────────────────────────────

def scrape_bandsintown(url: str) -> dict:
    """
    Scrape an artist profile page via stealth Playwright.

    Returns a dict with keys:
        Soc BIT Name, Soc BIT Bio, Soc BIT Genre, Soc BIT Location,
        Soc BIT Image, Soc BIT Socials, Soc BIT Followers,
        Soc BIT Upcoming Count, Soc BIT Next Event Date,
        Soc BIT Next Event Venue, Soc BIT Next Event City,
        Soc BIT Events JSON, Soc BIT Review, Soc BIT Avg Rating
    Returns an empty dict on total failure.
    """
    result = {}
    if url.startswith("http://"):
        url = url.replace("http://", "https://", 1)

    # Retry up to 2 times
    html_content = None
    for attempt in range(2):
        html_content = fetch_page_with_playwright(url)
        if html_content:
            break
        print(f"    [WARN] Attempt {attempt + 1} failed for {url}")
        time.sleep(5)

    if not html_content:
        return result

    soup = BeautifulSoup(html_content, "html.parser")
    artist_data: dict = {}
    events: list = []
    reviews: list = []

    # Parse JSON-LD structured data blocks
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            items = data if isinstance(data, list) else [data]
            for item in items:
                if not isinstance(item, dict):
                    continue
                stype = item.get("@type", "")
                if stype == "MusicGroup":
                    artist_data = item
                elif stype == "MusicEvent":
                    events.append(item)
                elif stype == "Review":
                    reviews.append(item)
        except Exception:
            continue

    # ── Artist fields ────────────────────────────────────────────────────────
    result["Soc BIT Name"]     = artist_data.get("name", "")
    result["Soc BIT Bio"]      = artist_data.get("description", "")
    result["Soc BIT Genre"]    = artist_data.get("genre", "")

    location = artist_data.get("location", {})
    result["Soc BIT Location"] = (
        location.get("name", "") if isinstance(location, dict) else str(location)
    )

    # Image: JSON-LD first, then og:image fallback
    result["Soc BIT Image"] = artist_data.get("image", "")
    if not result["Soc BIT Image"]:
        og_img = soup.find("meta", property="og:image")
        result["Soc BIT Image"] = (
            og_img["content"] if og_img and og_img.get("content") else ""
        )

    # Social links (sameAs can be str or list)
    same_as = artist_data.get("sameAs", "")
    if isinstance(same_as, list):
        result["Soc BIT Socials"] = ", ".join(s for s in same_as if s)
    elif same_as:
        result["Soc BIT Socials"] = same_as
    else:
        result["Soc BIT Socials"] = ""

    # ── Followers ────────────────────────────────────────────────────────────
    followers_raw = artist_data.get("interactionCount", "")
    followers_num = None
    if followers_raw:
        match = re.search(r"(\d[\d,]*)", str(followers_raw))
        if match:
            followers_num = int(match.group(1).replace(",", ""))

    # Fallback: scan page text
    if followers_num is None:
        page_text = soup.get_text()
        match = re.search(r"(\d[\d,]+)\s*[Ff]ollowers?", page_text)
        if match:
            followers_num = int(match.group(1).replace(",", ""))

    result["Soc BIT Followers"] = followers_num  # int or None

    # ── Upcoming events ──────────────────────────────────────────────────────
    today_str = date.today().isoformat()
    upcoming = [
        ev for ev in events
        if ev.get("startDate", "") and str(ev.get("startDate", ""))[:10] >= today_str
    ]

    result["Soc BIT Upcoming Count"] = len(upcoming)

    if upcoming:
        upcoming_sorted = sorted(upcoming, key=lambda e: e.get("startDate", ""))
        next_ev = upcoming_sorted[0]

        result["Soc BIT Next Event Date"]  = next_ev.get("startDate", "")[:10]
        ev_location = next_ev.get("location", {})
        result["Soc BIT Next Event Venue"] = (
            ev_location.get("name", "") if isinstance(ev_location, dict) else ""
        )
        ev_addr    = ev_location.get("address", {}) if isinstance(ev_location, dict) else {}
        city_parts = (
            [
                ev_addr.get("addressLocality", ev_location.get("name", "")),
                ev_addr.get("addressRegion", ""),
                ev_addr.get("addressCountry", ""),
            ]
            if isinstance(ev_addr, dict) else []
        )
        result["Soc BIT Next Event City"] = ", ".join(p for p in city_parts if p)

        # Compact JSON for all upcoming events
        compact_events = []
        for ev in upcoming_sorted:
            loc  = ev.get("location", {})
            addr = loc.get("address", {}) if isinstance(loc, dict) else {}
            geo  = loc.get("geo", {})     if isinstance(loc, dict) else {}
            compact_events.append({
                "id":      ev.get("identifier", ev.get("url", "").split("/")[-1]),
                "date":    ev.get("startDate", ""),
                "name":    ev.get("name", ""),
                "venue":   loc.get("name", "") if isinstance(loc, dict) else "",
                "city":    addr.get("addressLocality", "") if isinstance(addr, dict) else "",
                "region":  addr.get("addressRegion", "")  if isinstance(addr, dict) else "",
                "country": addr.get("addressCountry", "") if isinstance(addr, dict) else "",
                "lat":     geo.get("latitude")            if isinstance(geo, dict) else None,
                "lng":     geo.get("longitude")           if isinstance(geo, dict) else None,
                "url":     ev.get("url", ""),
                "status":  ev.get("eventStatus", "").split("/")[-1],
                "tickets": (
                    ev.get("offers", {}).get("url", "")
                    if isinstance(ev.get("offers"), dict) else ""
                ),
            })
        result["Soc BIT Events JSON"] = json.dumps(compact_events, ensure_ascii=False)
    else:
        result["Soc BIT Next Event Date"]  = ""
        result["Soc BIT Next Event Venue"] = ""
        result["Soc BIT Next Event City"]  = ""
        result["Soc BIT Events JSON"]      = ""

    # ── Reviews ──────────────────────────────────────────────────────────────
    result["Soc BIT Review"] = len(reviews)
    if reviews:
        ratings = []
        for rv in reviews:
            rating_obj = rv.get("reviewRating", {})
            val = rating_obj.get("ratingValue") if isinstance(rating_obj, dict) else None
            if val is not None:
                try:
                    ratings.append(float(val))
                except (TypeError, ValueError):
                    pass
        result["Soc BIT Avg Rating"] = round(sum(ratings) / len(ratings), 2) if ratings else None
    else:
        result["Soc BIT Avg Rating"] = None

    return result


# ── Supabase write helpers ───────────────────────────────────────────────────

def update_social_row(social_id: str, scraped: dict) -> None:
    """Write scraped artist data back to the hb_socials row."""
    now = datetime.utcnow().isoformat()
    payload = {
        "check_bandsintown_events": now,
        "updated_at": now,
    }

    if scraped.get("Soc BIT Name"):
        payload["name"] = scraped["Soc BIT Name"]
    if scraped.get("Soc BIT Bio"):
        payload["description"] = scraped["Soc BIT Bio"]
    if scraped.get("Soc BIT Image"):
        payload["image"] = scraped["Soc BIT Image"]
    if scraped.get("Soc BIT Followers") is not None:
        payload["followers"] = int(scraped["Soc BIT Followers"])

    supabase.table("hb_socials").update(payload).eq("id", social_id).execute()


def upsert_events(scraped: dict, social_url: str, linked_talent: str | None) -> int:
    """
    Parse upcoming events from scraped JSON and upsert each to hb_events.
    Deduplication key: bit_id.
    Returns count of events processed.
    """
    events_json = scraped.get("Soc BIT Events JSON", "")
    if not events_json:
        return 0

    try:
        events = json.loads(events_json)
    except json.JSONDecodeError:
        print("    [WARN] Could not parse Soc BIT Events JSON")
        return 0

    now = datetime.utcnow().isoformat()
    count = 0

    for ev in events:
        bit_id = ev.get("id") or None

        # Build location display name: prefer city, fall back to venue
        location_parts = [ev.get("city", ""), ev.get("region", ""), ev.get("country", "")]
        location_name = ", ".join(p for p in location_parts if p) or ev.get("venue", "")

        row = {
            "name":            ev.get("name") or None,
            "date_start":      ev.get("date") or None,
            "location_name":   location_name or None,
            "location_venue":  ev.get("venue") or None,
            "country":         ev.get("country") or None,
            "soc_bandsintown": ev.get("url") or social_url or None,
            "bit_id":          bit_id,
            "status":          ev.get("status") or None,
            "updated_at":      now,
        }

        # Attach talent link if available
        if linked_talent:
            row["linked_talent"] = [linked_talent]

        # Remove None values to avoid overwriting existing data with nulls
        row = {k: v for k, v in row.items() if v is not None}

        if bit_id:
            # Check for existing row before upsert to avoid silent overwrite issues
            existing = (
                supabase.table("hb_events")
                .select("id")
                .eq("bit_id", bit_id)
                .limit(1)
                .execute()
            )
            if existing.data:
                # Update existing record
                supabase.table("hb_events").update(row).eq("bit_id", bit_id).execute()
            else:
                # Insert new record
                supabase.table("hb_events").insert(row).execute()
        else:
            # No bit_id — insert without dedup (can't reliably deduplicate)
            supabase.table("hb_events").insert(row).execute()

        count += 1

    return count


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Enrich Bandsintown profiles — read from hb_socials, write to hb_socials + hb_events."
    )
    parser.add_argument("--limit", type=int, default=None, help="Stop after N records")
    parser.add_argument("--all",   action="store_true",   help="Process all eligible records")
    args = parser.parse_args()

    if not args.all and args.limit is None:
        args.limit = 10  # safe default

    LIMIT = args.limit or 10000  # large cap when --all

    print(f"Starting Bandsintown enrichment (limit={args.limit or 'ALL'})...")

    # ── Fetch records from Supabase ──────────────────────────────────────────
    records_resp = (
        supabase.table("hb_socials")
        .select("id, social_url, name, linked_talent")
        .eq("type", "BANDSINTOWN")
        .not_.is_("social_url", "null")
        .order("check_bandsintown_events", desc=False, nullsfirst=True)
        .limit(LIMIT)
        .execute()
    )
    records = records_resp.data or []
    print(f"  Fetched {len(records)} hb_socials rows to process.")

    if not records:
        print("No records returned — nothing to do.")
        return

    ok_count   = 0
    err_count  = 0
    skip_count = 0

    for i, record in enumerate(records, start=1):
        social_id     = record["id"]
        social_url    = (record.get("social_url") or "").strip()
        name          = record.get("name") or "Unknown"
        linked_talent = record.get("linked_talent")  # uuid or None

        print(f"\n[{i}/{len(records)}] {name}")

        if not social_url:
            print("  Skipping — no Bandsintown URL")
            skip_count += 1
            continue

        print(f"  Scraping: {social_url}")
        scraped = scrape_bandsintown(social_url)

        # Attempt URL healing if scrape returned nothing
        if not scraped:
            print(f"  Link 404. Attempting to heal for '{name}'...")
            healed_url = heal_bandsintown_url(name)
            if healed_url:
                social_url = healed_url
                # Persist the corrected URL back to hb_socials
                supabase.table("hb_socials").update({
                    "social_url": healed_url,
                    "updated_at": datetime.utcnow().isoformat(),
                }).eq("id", social_id).execute()
                scraped = scrape_bandsintown(social_url)

        if not scraped:
            # Log the bad link for manual review
            with open("invalid_bandsintown_links.csv", "a") as f:
                csv.writer(f).writerow([name, social_url])
            print(f"  Still 404 after healing. Skipping.")
            err_count += 1
            continue

        # ── Write back to Supabase ───────────────────────────────────────────
        try:
            update_social_row(social_id, scraped)
        except Exception as e:
            print(f"  [ERROR] hb_socials update failed: {e}")
            err_count += 1
            continue

        event_count = 0
        try:
            event_count = upsert_events(scraped, social_url, linked_talent)
        except Exception as e:
            print(f"  [WARN] hb_events upsert failed: {e}")

        # ── Summary line ─────────────────────────────────────────────────────
        followers = scraped.get("Soc BIT Followers")
        followers_fmt = f"{followers:,}" if followers is not None else "N/A"
        print(
            f"  OK — Name: {scraped.get('Soc BIT Name')} | "
            f"Followers: {followers_fmt} | "
            f"Upcoming: {scraped.get('Soc BIT Upcoming Count')} | "
            f"Events upserted: {event_count}"
        )

        ok_count += 1

        # Polite delay between scrapes to avoid triggering Cloudflare
        time.sleep(random.uniform(3, 7))

    print(f"\n{'=' * 55}")
    print(f"Bandsintown enrichment complete.")
    print(f"  Updated : {ok_count}")
    print(f"  Skipped : {skip_count}")
    print(f"  Failed  : {err_count}")
    print(f"{'=' * 55}")


if __name__ == "__main__":
    main()
