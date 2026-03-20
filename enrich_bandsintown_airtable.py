import asyncio
from playwright.sync_api import sync_playwright
from playwright_stealth import stealth
import os
import csv
#!/usr/bin/env python3
"""
enrich_bandsintown_airtable.py

Reads records from the Bandsintown view in Airtable, scrapes each artist's
Bandsintown profile page, and bulk-updates the relevant columns.

Usage:
    python3 enrich_bandsintown_airtable.py --limit 10
    python3 enrich_bandsintown_airtable.py --all
"""

import sys
import argparse
import requests
import json
import time
import re
from datetime import date
from bs4 import BeautifulSoup



# ── Bypass Config (Bypass Akamai / Cloudflare via RapidAPI) ──────────────────
RAPID_API_KEY  = os.getenv("RAPID_API_KEY", "8f8ab324eamsh88b8de70b402e0cp1d7d0ajsn13c934eadbd9")
RAPID_API_HOST = "bypass-akamai-cloudflare.p.rapidapi.com"
RAPID_API_URL  = "https://bypass-akamai-cloudflare.p.rapidapi.com/paid/akamai"

# ── Airtable Config ────────────────────────────────────────────────────────────
AIRTABLE_API_KEY = os.getenv("AIRTABLE_API_KEY", "")
BASE_ID          = os.getenv("AIRTABLE_BASE_ID", "appDd05XXSHwDjlwC")
TABLE_ID         = os.getenv("AIRTABLE_TABLE_ID", "tblD8ox0IMVjMhf1x")
VIEW_ID          = os.getenv("AIRTABLE_VIEW_ID", "viwJiadmPvQUsSqUs")  # 'To Process' view

AIRTABLE_HEADERS = {
    "Authorization": f"Bearer {AIRTABLE_API_KEY}",
    "Content-Type": "application/json"
}


USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15",
]
import random

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

# ── Running Stat Helper ────────────────────────────────────────────────────────

def update_running_stat(existing_json_str, new_value, date_str):
    """Maintain a JSON array of running statistics with daily diffs."""
    try:
        new_val = int(new_value)
    except (TypeError, ValueError):
        return existing_json_str

    try:
        arr = json.loads(existing_json_str) if existing_json_str else []
    except Exception:
        arr = []

    if arr and arr[-1].get("date") == date_str:
        last_entry = arr[-2] if len(arr) > 1 else None
        last_val = last_entry.get("count", new_val) if last_entry else new_val
        diff = new_val - last_val
        percent = (diff / last_val * 100) if last_val > 0 else 0.0
        arr[-1] = {"date": date_str, "count": new_val, "diff": diff, "percent": round(percent, 2)}
        return json.dumps(arr)

    last_val = arr[-1].get("count", new_val) if arr else new_val
    diff = new_val - last_val
    percent = (diff / last_val * 100) if last_val > 0 else 0.0
    arr.append({"date": date_str, "count": new_val, "diff": diff, "percent": round(percent, 2)})
    return json.dumps(arr)


def fetch_page_with_playwright(url):
    """Use a real browser to fetch the page content and bypass Cloudflare."""
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context(
                user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800}
            )
            page = context.new_page()
            stealth(page)
            
            print(f"    [WEB] Navigating via Stealth Browser: {url}")
            page.goto(url, wait_until="domcontentloaded", timeout=45000)
            page.wait_for_timeout(2000) # Give it a moment to settle
            
            content = page.content()
            browser.close()
            return content
    except Exception as e:
        print(f"    [ERROR] Playwright failed: {e}")
        return None

# ── Bandsintown Scraper ────────────────────────────────────────────────────────


# Initialize a session globally to maintain cookies
session = requests.Session()
session.headers.update(SCRAPE_HEADERS)


def heal_bandsintown_url(artist_name):
    """Try to find the correct Bandsintown URL using the Artist API."""
    import urllib.parse
    # Using the app_id found in your logs
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


def scrape_bandsintown(url: str) -> dict:
    """Scrape an artist profile page using Playwright to bypass Cloudflare."""
    result = {}
    if url.startswith("http://"):
        url = url.replace("http://", "https://", 1)

    max_retries = 2
    html_content = None
    for attempt in range(max_retries):
        html_content = fetch_page_with_playwright(url)
        if html_content:
            break
        print(f"    [WARN] Attempt {attempt+1} failed for {url}")
        time.sleep(5)
    
    if not html_content:
        return result

    soup = BeautifulSoup(html_content, "html.parser")
    artist_data = {}
    events = []
    reviews = []

    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string or "")
            items = data if isinstance(data, list) else [data]
            for item in items:
                if not isinstance(item, dict): continue
                stype = item.get("@type", "")
                if stype == "MusicGroup": artist_data = item
                elif stype == "MusicEvent": events.append(item)
                elif stype == "Review": reviews.append(item)
        except: continue

    # ── Artist fields ─────────────────────────────────────────────────────────
    result["Soc BIT Name"]     = artist_data.get("name", "")
    result["Soc BIT Bio"]      = artist_data.get("description", "")
    result["Soc BIT Genre"]    = artist_data.get("genre", "")

    location = artist_data.get("location", {})
    result["Soc BIT Location"] = location.get("name", "") if isinstance(location, dict) else str(location)

    # Image — try JSON-LD first, fall back to og:image
    result["Soc BIT Image"] = artist_data.get("image", "")
    if not result["Soc BIT Image"]:
        og_img = soup.find("meta", property="og:image")
        result["Soc BIT Image"] = og_img["content"] if og_img and og_img.get("content") else ""

    # Social links — sameAs can be a string or list
    same_as = artist_data.get("sameAs", "")
    if isinstance(same_as, list):
        result["Soc BIT Socials"] = ", ".join(s for s in same_as if s)
    elif same_as:
        result["Soc BIT Socials"] = same_as
    else:
        result["Soc BIT Socials"] = ""

    # ── Followers ─────────────────────────────────────────────────────────────
    followers_raw = artist_data.get("interactionCount", "")
    # Format: "6543769 Followers"
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

    result["Soc BIT Followers"] = followers_num

    # ── Upcoming Events ───────────────────────────────────────────────────────
    # Filter to only future events
    today_str = date.today().isoformat()
    upcoming = []
    for ev in events:
        start = ev.get("startDate", "")
        if start and str(start)[:10] >= today_str:
            upcoming.append(ev)

    result["Soc BIT Upcoming Count"] = len(upcoming)

    if upcoming:
        # Sort ascending by startDate
        upcoming_sorted = sorted(upcoming, key=lambda e: e.get("startDate", ""))
        next_ev = upcoming_sorted[0]
        result["Soc BIT Next Event Date"]  = next_ev.get("startDate", "")[:10]
        ev_location = next_ev.get("location", {})
        result["Soc BIT Next Event Venue"] = ev_location.get("name", "") if isinstance(ev_location, dict) else ""
        ev_addr     = ev_location.get("address", {}) if isinstance(ev_location, dict) else {}
        city_parts  = [
            ev_addr.get("addressLocality", ev_location.get("name", "")),
            ev_addr.get("addressRegion", ""),
            ev_addr.get("addressCountry", ""),
        ] if isinstance(ev_addr, dict) else []
        result["Soc BIT Next Event City"] = ", ".join(p for p in city_parts if p)

        # Compact JSON for all upcoming events
        compact_events = []
        for ev in upcoming_sorted:
            loc  = ev.get("location", {})
            addr = loc.get("address", {}) if isinstance(loc, dict) else {}
            geo  = loc.get("geo", {}) if isinstance(loc, dict) else {}
            compact_events.append({
                "date":    ev.get("startDate", ""),
                "name":    ev.get("name", ""),
                "venue":   loc.get("name", "") if isinstance(loc, dict) else "",
                "city":    addr.get("addressLocality", "") if isinstance(addr, dict) else "",
                "region":  addr.get("addressRegion", "") if isinstance(addr, dict) else "",
                "country": addr.get("addressCountry", "") if isinstance(addr, dict) else "",
                "lat":     geo.get("latitude") if isinstance(geo, dict) else None,
                "lng":     geo.get("longitude") if isinstance(geo, dict) else None,
                "url":     ev.get("url", ""),
                "status":  ev.get("eventStatus", "").split("/")[-1],
                "tickets": ev.get("offers", {}).get("url", "") if isinstance(ev.get("offers"), dict) else "",
            })
        result["Soc BIT Events JSON"] = json.dumps(compact_events, ensure_ascii=False)
    else:
        result["Soc BIT Next Event Date"]  = ""
        result["Soc BIT Next Event Venue"] = ""
        result["Soc BIT Next Event City"]  = ""
        result["Soc BIT Events JSON"]      = ""

    # ── Reviews ───────────────────────────────────────────────────────────────
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


# ── Airtable Helpers ──────────────────────────────────────────────────────────

def update_records_bulk(records_batch: list):
    """PATCH up to 10 records at once."""
    if not records_batch:
        return True, {}
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}"
    r = requests.patch(url, headers=AIRTABLE_HEADERS, json={"records": records_batch}, timeout=20)
    return r.status_code == 200, r.json()


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Enrich Bandsintown profiles in Airtable.")
    parser.add_argument("--limit", type=int, default=None, help="Stop after N records")
    parser.add_argument("--all",   action="store_true",   help="Process all records in the view")
    args = parser.parse_args()

    if not args.all and args.limit is None:
        args.limit = 10  # Default safe run

    print(f"🎸 Starting Bandsintown enrichment (limit={args.limit or 'ALL'})...")

    ok_count   = 0
    err_count  = 0
    skip_count = 0
    processed  = 0
    batch_queue = []
    today_str   = date.today().isoformat()

    airtable_url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}"
    params = {"pageSize": 100, "view": VIEW_ID}

    while True:
        for retry in range(3):
            try:
                r = requests.get(airtable_url, headers=AIRTABLE_HEADERS, params=params, timeout=60)
                r.raise_for_status()
                break
            except Exception as e:
                if retry == 2: raise
                print(f"  [WARN] Airtable fetch failed ({e}), Retrying in 5s...")
                time.sleep(5)
        print(f"  [DEBUG] Airtable status: {r.status_code}")
        data = r.json()

        if "error" in data:
            print(f"[ERROR] Airtable: {data}")
            break

        page_records = data.get("records", [])
        print(f"  [DEBUG] Records in page: {len(page_records)}, offset: {data.get('offset', 'none')}")
        if not page_records:
            print("No records returned — done.")
            break

        print(f"\n--- Page of {len(page_records)} records ---")

        for record in page_records:
            if args.limit and processed >= args.limit:
                break

            rec_id = record["id"]
            fields = record.get("fields", {})
            name   = fields.get("Name", "Unknown")
            bit_url = fields.get("Soc Bandsintown", "").strip()

            processed += 1
            update_data = {} # Initialize payload here
            print(f"\n[{processed}] {name}")

            if not bit_url:
                print("  ⏭  Skipping — no Bandsintown URL")
                skip_count += 1
                continue

            print(f"  🌐 Scraping: {bit_url}")
            scraped = scrape_bandsintown(bit_url)

            if not scraped:
                print(f"  🔍 Link 404. Attempting to heal for {name}...")
                new_url = heal_bandsintown_url(name)
                if new_url:
                    bit_url = new_url
                    update_data["Soc Bandsintown"] = new_url # Update Airtable with correct link!
                    scraped = scrape_bandsintown(bit_url)
                
            if not scraped:
                with open("invalid_bandsintown_links.csv", "a") as f:
                    writer = csv.writer(f)
                    writer.writerow([name, bit_url])
                print(f"  ❌ Still 404 after healing attempt. Skip.")
                err_count += 1
                continue

            # Build update payload — only include non-empty / non-None fields
            

            str_fields = [
                "Soc BIT Name", "Soc BIT Bio", "Soc BIT Genre",
                "Soc BIT Location", "Soc BIT Image", "Soc BIT Socials",
                "Soc BIT Next Event Date", "Soc BIT Next Event Venue",
                "Soc BIT Next Event City", "Soc BIT Events JSON"
            ]
            for f in str_fields:
                val = scraped.get(f, "")
                if val:
                    update_data[f] = val

            # Numbers — stored as strings (text fields in Airtable)
            for f in ["Soc BIT Followers", "Soc BIT Upcoming Count", "Soc BIT Review"]:
                val = scraped.get(f)
                if val is not None:
                    update_data[f] = str(val)

            avg = scraped.get("Soc BIT Avg Rating")
            if avg is not None:
                update_data["Soc BIT Avg Rating"] = str(avg)

            # Running stat for followers
            followers_num = scraped.get("Soc BIT Followers")
            if followers_num is not None:
                update_data["Soc BIT Followers Running"] = update_running_stat(
                    fields.get("Soc BIT Followers Running", ""),
                    followers_num,
                    today_str
                )

            # Last Check
            update_data["Last Check"] = today_str

            # Print summary
            print(f"  ✅ Name: {scraped.get('Soc BIT Name')} | "
                  f"Followers: {scraped.get('Soc BIT Followers'):,}" if scraped.get('Soc BIT Followers') else
                  f"  ✅ Name: {scraped.get('Soc BIT Name')} | Followers: N/A")
            print(f"     Genre: {scraped.get('Soc BIT Genre')} | "
                  f"Location: {scraped.get('Soc BIT Location')} | "
                  f"Upcoming: {scraped.get('Soc BIT Upcoming Count')} | "
                  f"Reviews: {scraped.get('Soc BIT Review')} | "
                  f"Avg Rating: {scraped.get('Soc BIT Avg Rating')}")

            batch_queue.append({"id": rec_id, "fields": update_data})

            # Flush every 10 records
            if len(batch_queue) >= 10:
                print(f"\n  --> Sending bulk update ({len(batch_queue)} records)...")
                success, resp = update_records_bulk(batch_queue)
                if success:
                    print(f"  ✅ Batch saved.")
                    ok_count += len(batch_queue)
                else:
                    print(f"  ❌ Batch failed: {resp}")
                    err_count += len(batch_queue)
                batch_queue.clear()
                time.sleep(0.5)

            # Polite delay between scrapes to avoid rate limiting
            time.sleep(random.uniform(3, 7))

        # Flush remaining records from this page
        if batch_queue:
            print(f"\n  --> Final flush ({len(batch_queue)} records)...")
            success, resp = update_records_bulk(batch_queue)
            if success:
                print("  ✅ Batch saved.")
                ok_count += len(batch_queue)
            else:
                print(f"  ❌ Batch failed: {resp}")
                err_count += len(batch_queue)
            batch_queue.clear()
            time.sleep(0.5)

        if args.limit and processed >= args.limit:
            break

        offset = data.get("offset")
        if not offset:
            break
        params["offset"] = offset

    print(f"\n{'='*55}")
    print(f"🎸 Bandsintown Enrichment Complete!")
    print(f"   ✅ Updated : {ok_count}")
    print(f"   ⏭  Skipped : {skip_count}")
    print(f"   ❌ Failed  : {err_count}")
    print(f"{'='*55}")


if __name__ == "__main__":
    main()
