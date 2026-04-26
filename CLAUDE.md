# CLAUDE.md — `yl-hb-bit` (Bandsintown enrichment)

Conventions shared across the `yl-hb-*` fleet live in
[`SCRAPER-CLAUDE-TEMPLATE.md`](../SCRAPER-CLAUDE-TEMPLATE.md) — read both.

## ⚠️ READ FIRST: this repo is a tangle

The repo root contains **two unrelated kinds of content**:

1. **The actual Bandsintown scraper** — a Python script
   (`enrich_bandsintown_airtable.py`). The accompanying GitHub Actions
   workflow `enrich_bandsintown.yml` was deleted in commit `370ace4`
   ("Remove Bandsintown enrichment workflow"), so the script is
   currently **manual-invocation only** with no scheduled runs.
2. **Several legacy / nested sub-projects** that look like accidental
   inclusions:
   - `Hypebase/app/` — a Next.js app (likely a stale snapshot of the
     work now in `~/workflows/hb_app_build/`).
   - `HB-Data-MusicArtists/`, `hb-media-musicprofiles/`,
     `hb-talent-filmprofiles/` — separate data / ingest sub-repos.
   - `yl-hb-dz/`, `yl-hb-ig/`, `yl-hb-ml/` — copies of sibling fleet
     repos. The canonical versions live one directory up at
     `~/workflows/yl-hb-dz/` etc. Do not edit the copies inside this
     repo as if they were authoritative.

The misleading `package.json` at the repo root has
`"name": "fanspro-nfl-players-enrichment"` — leftover boilerplate from
the scaffold this repo was forked from. Ignore it.

The schema-mismatch warning that applies to the embedded sub-projects
(`talent_profiles` / `social_profiles` references) does **not** apply
to the canonical Bandsintown Python flow — that one writes directly to
Airtable.

## What this repo does (the canonical flow only)

Pulls events from the **Bandsintown** API for artist records in
Airtable, deduplicates upcoming gigs, and bulk-PATCHes results back.
Single Python script. As of commit `370ace4` the scheduled workflow
was removed; the script must now be run manually (or by some
external trigger that isn't in this repo).

## Stack

**Mixed.** The canonical Bandsintown flow is **Python**. The embedded
sub-projects are TypeScript / JavaScript / Next.js — separate stacks
that should not be confused with this repo's primary purpose.

## Repo layout

```
enrich_bandsintown_airtable.py        # ← canonical entry point (manual invocation only)
.github/                              # workflows/ dir was removed in 370ace4
README.md
package.json                          # ← misleading "fanspro-nfl-players-enrichment" name; ignore
tsconfig.json                         # ← also leftover scaffold
.

# embedded sub-projects (NOT canonical content of this repo):
Hypebase/                             # stale Next.js snapshot
HB-Data-MusicArtists/                 # separate sub-repo
hb-media-musicprofiles/               # separate sub-repo (audiodb / musicbrainz / spotify)
hb-talent-filmprofiles/               # separate sub-repo
yl-hb-dz/                             # copy of ~/workflows/yl-hb-dz
yl-hb-ig/                             # copy of ~/workflows/yl-hb-ig
yl-hb-ml/                             # copy of ~/workflows/yl-hb-ml
```

> Treat anything under `Hypebase/`, `HB-Data-MusicArtists/`,
> `hb-media-musicprofiles/`, `hb-talent-filmprofiles/`, `yl-hb-dz/`,
> `yl-hb-ig/`, `yl-hb-ml/` as **out of scope for this repo's CLAUDE.md**.
> Edit them only in their canonical locations.

## Auth (canonical Bandsintown flow)

> Convention divergence: the canonical flow uses Airtable + Bandsintown
> public API. No Supabase service-role key.

```
AIRTABLE_API_KEY        # required
AIRTABLE_BASE_ID        # in-script default
AIRTABLE_TABLE_ID       # in-script default
AIRTABLE_VIEW_ID        # in-script default
```

Bandsintown's public API doesn't require auth for read access — the
script identifies itself via an `app_id` query param.

## Workflow lifecycle convention

> Convention divergence: there is no scheduled workflow at all (it was
> removed in `370ace4`). The dashboard won't see any runs. If/when
> the schedule is re-added, retrofit the standard `log_workflow_run`
> start + result blocks per template.

## Tables this repo touches (canonical flow only)

Airtable only. No Supabase tables touched by the canonical Python
script.

## Running locally

```bash
pip install requests              # only dep for the canonical Python script
export AIRTABLE_API_KEY=...
python3 enrich_bandsintown_airtable.py --limit 25
python3 enrich_bandsintown_airtable.py --all
```

## Per-repo gotchas

- **The `package.json` at the root is misleading.** It identifies as
  `fanspro-nfl-players-enrichment` and pulls in `puppeteer` — neither
  of which is used by the canonical flow. Don't try to "fix" it
  without first establishing whether anything in CI relies on it.
- **The embedded `Hypebase/app/` Next.js snapshot is stale.** The
  canonical Hypebase app lives at `~/workflows/hb_app_build/`. Don't
  fix bugs in this snapshot — fix them in `hb_app_build` and re-snapshot
  if needed.
- **The embedded `yl-hb-dz`, `yl-hb-ig`, `yl-hb-ml` directories are
  copies.** The canonical versions are at `~/workflows/<name>/`.
- **`hb-media-musicprofiles/` is its own thing** — it has its own
  workflows for AudioDB / MusicBrainz / Spotify enrichment that
  *do* write to Supabase using the current `hb_*` schema. It's
  arguably the canonical successor to `yl-hb-tadb` for AudioDB.
- **Bandsintown rate limits.** Keep concurrency at 1; the API
  returns 429 quickly otherwise.

## Conventions Claude should follow when editing this repo

- **Edit the canonical Python script and its workflow only.**
- **Do not edit the embedded sub-projects** — go to their canonical
  locations.
- **If you find yourself adding a Supabase client to the canonical
  Python flow,** that's probably a sign the scope has crept and the
  work belongs in `hb-media-musicprofiles/` instead.

## Related repos

- `yl-hb-ig`, `yl-hb-sk`, `yl-hb-sc`, `yl-hb-tw` — sibling
  Airtable-only enrichers.
- `hb-media-musicprofiles/` — embedded sub-repo writing music metadata
  to Supabase via the current `hb_*` schema.
