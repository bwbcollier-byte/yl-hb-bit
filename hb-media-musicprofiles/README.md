# hb-media-musicprofiles

Comprehensive music media (albums, singles, EPs) enrichment pipeline.
Connects your Supabase `media_profiles` table to various music APIs, starting with MusicBrainz.

## Available Workflows

### 1. MusicBrainz Enrichment (`npm run musicbrainz`)

Looks up the Spotify Album URL against the MusicBrainz database to fetch the exact release version, barcode, label info, exact release dates, formats, tags, and genres.

- It respects the strict MusicBrainz rate limit of 1 request per second.
- It is set up via GitHub Actions to automatically run every 8 hours and process batches of 1000 items at a time.

## GitHub Actions setup

To run these scripts in GitHub Actions automatically without them failing, you need to add your environment variables as **Repository Secrets** in GitHub.

1. Go to your repository on GitHub: `yunikon-labs/hb-media-musicprofiles`
2. Click on **Settings** > **Secrets and variables** > **Actions** (in the left sidebar)
3. Click the green **New repository secret** button.

You need to create the following exact secrets:

- **`SUPABASE_URL`**: Your `https://[project-id].supabase.co` URL.
- **`SUPABASE_SERVICE_KEY`**: Your Supabase Service-Role key (usually starts with `eyJ...`).

That's it! Once you add those, the `MusicBrainz Media Enrichment` workflow will run automatically every 8 hours, and you can trigger it manually from the "Actions" tab whenever you want.
