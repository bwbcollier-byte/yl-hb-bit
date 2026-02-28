import dotenv from 'dotenv';
import fetch from 'node-fetch';
import readline from 'readline';
import {
  getPendingMusicBrainzMedia,
  updateMediaMusicBrainzData,
} from './supabase';

dotenv.config();

const LIMIT_ENV = process.env.LIMIT || "";
const ENV_LIMIT = LIMIT_ENV.trim() !== "" ? parseInt(LIMIT_ENV, 10) : undefined;
const USER_AGENT = 'MusicBrainzMediaEnrichment/1.0 (contact@example.com)';

// MusicBrainz strictly allows ONLY 1 request per second without a commercial key
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function titleCase(str: string): string {
  return str.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * 1. Find the Release ID using the unique Spotify URL Mapping
 */
async function fetchReleaseIdFromUrl(spotifyUrl: string): Promise<string | null> {
  const url = `https://musicbrainz.org/ws/2/url?resource=${encodeURIComponent(spotifyUrl)}&fmt=json&inc=release-rels`;
  console.log(`  🔍 Looking up Spotify URL in MusicBrainz...`);
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' } });
    await sleep(1000); // Mandatory MB rate limit
    
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
  } catch (err) {
    console.error(`  ⚠️ Error looking up URL:`, err.message);
    return null;
  }
}

/**
 * 2. Fetch the rich details of the specific Release
 */
async function fetchReleaseDetails(releaseId: string): Promise<any | null> {
  console.log(`  💿 Fetching deep metadata for Release: ${releaseId}`);
  const url = `https://musicbrainz.org/ws/2/release/${releaseId}?inc=labels+recordings+artist-credits+genres+tags+release-groups&fmt=json`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' } });
    await sleep(1000); // Mandatory MB rate limit
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

async function enrichMedia(media: any) {
  const { spotify_album_id, album_name, artist_name, spotify_album_url } = media;
  
  console.log(`\n📋 Processing: "${album_name}" by "${artist_name}"`);
  
  // Step 1: Look up the Spotify URL to get the MusicBrainz Release ID
  const mbReleaseId = await fetchReleaseIdFromUrl(spotify_album_url);
  
  if (!mbReleaseId) {
      // If we implement a fallback search by name/artist, it would go here.
      console.log(`  ⚠️ Could not find a MusicBrainz Release mapped to this Spotify URL.`);
      await updateMediaMusicBrainzData(spotify_album_id, { mb_check: 'Not Found via URL' });
      return;
  }

  // Step 2: Grab the comprehensive data payload
  const fullRelease = await fetchReleaseDetails(mbReleaseId);
  
  if (!fullRelease) {
      console.log(`  ⚠️ Could not fetch deep release details.`);
      await updateMediaMusicBrainzData(spotify_album_id, { mb_check: `Found URL, missing API response` });
      return;
  }

  // Map the fields
  const updateFields: Record<string, any> = {
      mb_check: new Date().toISOString(),
      mb_release_id: fullRelease.id,
      mb_release_group_id: fullRelease['release-group']?.id || '',
  };

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

  await updateMediaMusicBrainzData(spotify_album_id, updateFields);
  console.log(`  💾 Saved ${Object.keys(updateFields).length} MusicBrainz fields to Supabase ✅`);
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

      for (const item of mediaItems) {
        await enrichMedia(item);
        totalProcessed++;

        if (limit && totalProcessed >= limit) break;
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
