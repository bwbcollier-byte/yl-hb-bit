import dotenv from 'dotenv';
import fetch from 'node-fetch';
import readline from 'readline';
import {
  getPendingMusicBrainzMedia,
  updateMediaMusicBrainzDataBatch,
} from './supabase';

dotenv.config();

const LIMIT_ENV = process.env.LIMIT || "";
const ENV_LIMIT = LIMIT_ENV.trim() !== "" ? parseInt(LIMIT_ENV, 10) : undefined;
const USER_AGENT = 'MusicBrainzMediaEnrichment/1.0 (contact@example.com)';

// MusicBrainz strictly allows ONLY 1 request per second without a commercial key
// We use 1200ms to be safely under the limit, as TLS connections can overlap slightly.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, options: any, retries = 3): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      return res;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.log(`    ↻ Connection issue, retrying (${i + 1}/${retries})...`);
      await sleep(2000); // Back off before retrying
    }
  }
}

function titleCase(str: string): string {
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

// MusicBrainz search is strict with extra noise. Strip out Spotify's junk.
function cleanName(str: string): string {
    if (!str) return '';
    return str
        .replace(/\s*\(.*?\)\s*/g, ' ') // Remove anything in parentheses (e.g. "(Estate)", "(Expanded Edition)")
        .replace(/\s*\[.*?\]\s*/g, ' ') // Remove anything in brackets
        .replace(/ - Single$/i, '')     // Remove " - Single"
        .replace(/ - EP$/i, '')         // Remove " - EP"
        .trim();
}

/**
 * 1. Find the Release ID using the unique Spotify URL Mapping
 */
async function fetchReleaseIdFromUrl(spotifyUrl: string): Promise<string | null> {
  const url = `https://musicbrainz.org/ws/2/url?resource=${spotifyUrl}&fmt=json&inc=release-rels`;
  console.log(`  🔍 Looking up Spotify URL in MusicBrainz...`);
  try {
    const res = await fetchWithRetry(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' } });
    await sleep(1200); // Mandatory MB rate limit
    
    if (!res.ok) {
        if (res.status === 404) console.log(`  🔎 No Spotify URL relationship found in MB yet.`);
        return null;
    }
    const data = await res.json();
    
    if (data.relations && data.relations.length > 0) {
      // Find the specific free-streaming relation
      const relation = data.relations.find((r: any) => 
        (r.type === 'free streaming' || r.type === 'streaming') && 
        r['target-type'] === 'release' && 
        r.release
      );
      if (relation && relation.release) {
        return relation.release.id;
      }
      
      // Fallback: any release relation attached to this URL
      const anyReleaseRel = data.relations.find((r: any) => r['target-type'] === 'release' && r.release);
      if (anyReleaseRel) {
         return anyReleaseRel.release.id;
      }
    }
    return null;
  } catch (err: any) {
    console.error(`  ⚠️ Error looking up URL:`, err.message);
    return null;
  }
}

/**
 * 2. Fallback: Search MusicBrainz by Album and Artist name
 */
async function fetchReleaseIdFromSearch(albumName: string, artistName: string | null | undefined): Promise<string | null> {
  let query = `release:"${albumName}"`;
  if (artistName && artistName.toLowerCase() !== 'null' && artistName.trim() !== '') {
      query += ` AND artist:"${artistName}"`;
  }
  
  const url = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json`;
  console.log(`  🔍 Falling back to Search: ${query}`);
  try {
    const res = await fetchWithRetry(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' } });
    await sleep(1200); // Mandatory MB rate limit
    
    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data.releases && data.releases.length > 0) {
      // Top result is usually the best match
      return data.releases[0].id;
    }
    return null;
  } catch (err: any) {
    console.error(`  ⚠️ Error searching MB:`, err.message);
    return null;
  }
}

/**
 * 3. Fetch the rich details of the specific Release
 */
async function fetchReleaseDetails(releaseId: string): Promise<any | null> {
  console.log(`  💿 Fetching deep metadata for Release: ${releaseId}`);
  const url = `https://musicbrainz.org/ws/2/release/${releaseId}?inc=labels+recordings+artist-credits+genres+tags+release-groups+url-rels&fmt=json`;
  try {
    const res = await fetchWithRetry(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' } });
    await sleep(1200); // Mandatory MB rate limit
    if (!res.ok) return null;
    return await res.json();
  } catch (err: any) {
    return null;
  }
}

/**
 * 4. Fetch the URL relations and deep types from the Release Group
 */
async function fetchReleaseGroupDetails(releaseGroupId: string): Promise<any | null> {
  console.log(`  📂 Fetching deep metadata for Release Group: ${releaseGroupId}`);
  const url = `https://musicbrainz.org/ws/2/release-group/${releaseGroupId}?inc=url-rels&fmt=json`;
  try {
    const res = await fetchWithRetry(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' } });
    await sleep(1200); // Additional MB rate limit
    if (!res.ok) return null;
    return await res.json();
  } catch (err: any) {
    return null;
  }
}

// Helper to safely parse and assign URL relationships
function extractUrlRelations(relations: any[], updateFields: Record<string, any>) {
  if (!relations || !Array.isArray(relations)) return;
  for (const rel of relations) {
    if (!rel.url || !rel.url.resource) continue;
    const href = rel.url.resource;
    
    // Streaming Links
    if (href.includes('music.apple.com')) {
      updateFields.apple_music_url = href;
      const match = href.match(/album\/.*?([0-9]+)$/);
      if (match) updateFields.apple_music_id = match[1];
    }
    else if (href.includes('music.youtube.com')) updateFields.youtube_music_url = href;
    else if (href.includes('deezer.com')) updateFields.deezer_url = href;
    else if (href.includes('tidal.com')) updateFields.tidal_url = href;
    else if (href.includes('soundcloud.com')) updateFields.soundcloud_url = href;
    else if (href.includes('music.amazon.com')) updateFields.amazon_music_url = href;
    
    // Purchase Links
    else if (href.includes('bandcamp.com')) updateFields.bandcamp_url = href;
    else if (href.includes('itunes.apple.com')) updateFields.itunes_url = href;

    // Database Links
    else if (href.includes('discogs.com')) updateFields.discogs_url = href;
    else if (href.includes('allmusic.com')) {
      updateFields.allmusic_url = href;
      const match = href.match(/mw([0-9]+)$/);
      if (match) updateFields.allmusic_id = 'mw' + match[1];
    }
    else if (href.includes('wikidata.org')) updateFields.wikidata_url = href;
    else if (href.includes('wikipedia.org')) updateFields.wikipedia_url = href;
  }
}

async function enrichMedia(media: any) {
  const { spotify_album_id, album_name, artist_name, spotify_album_url } = media;
  
  console.log(`\n📋 Processing: "${album_name}" by "${artist_name}"`);
  
  // Step 1: Look up the Spotify URL to get the MusicBrainz Release ID
  let mbReleaseId = await fetchReleaseIdFromUrl(spotify_album_url);
  
  if (!mbReleaseId) {
      // Step 1b: Fallback to searching by album and artist name
      const cleanAlbum = cleanName(album_name);
      const cleanArtist = cleanName(artist_name);

      if (cleanAlbum !== album_name || cleanArtist !== artist_name) {
          console.log(`  🧹 Cleaned to: "${cleanAlbum}" by "${cleanArtist}"`);
      }
      
      mbReleaseId = await fetchReleaseIdFromSearch(cleanAlbum, cleanArtist);
  }

  if (!mbReleaseId) {
      console.log(`  ⚠️ Could not find a MusicBrainz Release mapped to this Spotify URL or via Search.`);
      return {
        id: media.id,
        mb_check: new Date().toISOString(),
        mb_process_status: 'Not Found' 
      };
  }

  // Step 2: Grab the comprehensive data payload
  const fullRelease = await fetchReleaseDetails(mbReleaseId);
  
  if (!fullRelease) {
      console.log(`  ⚠️ Could not fetch deep release details.`);
      return {
        id: media.id,
        mb_check: new Date().toISOString(),
        mb_process_status: 'Error Fetching Deep Search' 
      };
  }

  // Map the fields
  const updateFields: Record<string, any> = {
      id: media.id,
      mb_check: new Date().toISOString(),
      mb_process_status: 'Complete',
      mb_release_id: fullRelease.id,
      mb_release_group_id: fullRelease['release-group']?.id || '',
  };

  // Advanced Original Release Date and Types from embedded rg
  const rgEmbedded = fullRelease['release-group'];
  if (rgEmbedded) {
      if (rgEmbedded['first-release-date']) updateFields.mb_first_release_date = rgEmbedded['first-release-date'];
      if (rgEmbedded['primary-type']) updateFields.mb_primary_type = rgEmbedded['primary-type'];
      if (rgEmbedded['secondary-types']?.length > 0) {
          updateFields.mb_secondary_types = rgEmbedded['secondary-types'].join(', ');
      }
  }

  // Cover Art Status and ASIN
  if (fullRelease.asin) updateFields.mb_asin = fullRelease.asin;
  if (fullRelease['cover-art-archive']?.front) updateFields.mb_cover_art_exists = true;

  // Extract Relations strictly off the Release
  extractUrlRelations(fullRelease.relations, updateFields);

  // Deep API query for the Release Group to get those cross-platform links
  if (updateFields.mb_release_group_id) {
     const rgDetails = await fetchReleaseGroupDetails(updateFields.mb_release_group_id);
     if (rgDetails) {
         extractUrlRelations(rgDetails.relations, updateFields);
     }
  }

  if (fullRelease.date) updateFields.mb_date = fullRelease.date;
  if (fullRelease.country) updateFields.mb_release_country = fullRelease.country;
  if (fullRelease.barcode) updateFields.mb_barcode = fullRelease.barcode;
  if (fullRelease.status) updateFields.mb_status = fullRelease.status;
  if (fullRelease.disambiguation) updateFields.mb_disambiguation = fullRelease.disambiguation;

  // Labels
  if (fullRelease['label-info']?.length > 0) {
      const labels = fullRelease['label-info'].map((li: any) => li.label?.name).filter(Boolean).join(', ');
      if (labels) updateFields.mb_label_info = labels;
  }

  // Formats and Tracks
  if (fullRelease.media?.length > 0) {
      const totalTracks = fullRelease.media.reduce((sum: number, m: any) => sum + (m['track-count'] || 0), 0);
      if (totalTracks > 0) updateFields.mb_track_count = totalTracks.toString();

      const formats = fullRelease.media.map((m: any) => m.format).filter(Boolean).join(', ');
      if (formats) updateFields.mb_media = formats;
  }

  // Genres (Usually attached to the release-group, but they can be on releases)
  const genresSource = fullRelease.genres?.length > 0 ? fullRelease.genres : fullRelease['release-group']?.genres;
  if (genresSource?.length > 0) {
      updateFields.mb_genres = genresSource
          .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
          .slice(0, 10)
          .map((g: any) => titleCase(g.name))
          .join(', ');
  }

  // Tags 
  const tagsSource = fullRelease.tags?.length > 0 ? fullRelease.tags : fullRelease['release-group']?.tags;
  if (tagsSource?.length > 0) {
      const genreNames = genresSource?.map((g: any) => g.name.toLowerCase()) || [];
      updateFields.mb_tags = tagsSource
          .filter((t: any) => !genreNames.includes(t.name.toLowerCase())) // Exclude tags that are already genres
          .sort((a: any, b: any) => (b.count || 0) - (a.count || 0))
          .slice(0, 15)
          .map((t: any) => titleCase(t.name))
          .join(', ');
  }

  console.log(`  📊 Prepared ${Object.keys(updateFields).length} MusicBrainz fields to batch-save...`);
  return updateFields;
}

function promptForLimit(): Promise<number | undefined> {
  return new Promise((resolve) => {
    if ((typeof ENV_LIMIT === 'number' && !isNaN(ENV_LIMIT)) || process.env.CI) {
      resolve(typeof ENV_LIMIT === 'number' && !isNaN(ENV_LIMIT) ? ENV_LIMIT : undefined);
      return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('\n🔢 How many media items to process? (press Enter for all): ', (answer) => {
      rl.close();
      if (!answer || answer.trim() === '') resolve(undefined);
      else resolve(parseInt(answer.trim(), 10) || undefined);
    });
  });
}

async function main() {
  console.log('🎵 MusicBrainz Media Enrichment');
  console.log('==================================================\n');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
  }

  const limit = await promptForLimit();
  let totalProcessed = 0;

  try {
    while (true) {
      const remainingLimit = limit ? limit - totalProcessed : 1000;
      if (limit && remainingLimit <= 0) break;
      const batchLimit = limit ? Math.min(remainingLimit, 100) : 100;
      
      const mediaItems = await getPendingMusicBrainzMedia(batchLimit);

      if (mediaItems.length === 0) {
         console.log('\n✅ No more items found to process or all caught up!');
         break;
      }

      console.log(`\n📦 Loaded batch of ${mediaItems.length} media items...`);

      const batchUpdates: any[] = [];

      for (const item of mediaItems) {
        const updateObject = await enrichMedia(item);
        if (updateObject) {
           batchUpdates.push(updateObject);
        }
        totalProcessed++;

        if (limit && totalProcessed >= limit) break;
      }

      if (batchUpdates.length > 0) {
         console.log(`\n💾 Connecting to Supabase to save batch of ${batchUpdates.length} records...`);
         await updateMediaMusicBrainzDataBatch(batchUpdates);
         console.log(`✅ Batch saved successfully!`);
      }

      if (limit && totalProcessed >= limit) break;
    }

    console.log('\n==================================================');
    console.log('✨ MusicBrainz Media Enrichment Complete!');
    console.log(`✅ Processed: ${totalProcessed}`);
    console.log('==================================================\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
