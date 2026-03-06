import dotenv from 'dotenv';
import fetch from 'node-fetch';
import readline from 'readline';
import { getPendingAudioDBMedia, updateMediaAudioDBDataBatch } from './supabase';

dotenv.config();

const LIMIT_ENV = process.env.LIMIT || "";
const ENV_LIMIT = LIMIT_ENV.trim() !== "" ? parseInt(LIMIT_ENV, 10) : undefined;
const AUDIODB_API_KEY = process.env.AUDIODB_API_KEY || '925704'; // Default to user's provided key or env

// Premium AudioDB allows 100 requests per minute (~1 request every 600ms).
// We'll use 650ms to be safe and avoid hitting the exact threshold.
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// AudioDB is extremely strict with exact name matching. Strip out Spotify's junk.
function cleanName(str: string): string {
    if (!str) return '';
    return str
        .replace(/\s*\(.*?\)\s*/g, ' ') // Remove anything in parentheses (e.g. "(Estate)", "(Deluxe Edition)")
        .replace(/\s*\[.*?\]\s*/g, ' ') // Remove anything in brackets
        .replace(/ - Single$/i, '')     // Remove " - Single"
        .replace(/ - EP$/i, '')         // Remove " - EP"
        .trim();
}

async function fetchAudioDBAlbum(albumName: string, artistName: string, mbGroupId: string, mbId: string): Promise<any | null> {
  // 1. Try v2 lookup by MBID (Release Group)
  if (mbGroupId) {
      console.log(`  🔍 Looking up AudioDB for MB Group ID: ${mbGroupId}`);
      try {
          const url = `https://www.theaudiodb.com/api/v2/json/lookup/album_mb/${mbGroupId}`;
          const res = await fetch(url, { headers: { 'X-API-KEY': AUDIODB_API_KEY, 'Accept': 'application/json' }});
          await sleep(650);
          if (res.ok) {
              const data = await res.json();
              if (data?.album?.length > 0) return data.album[0];
          }
      } catch (err: any) {
          console.error(`  ⚠️ Error looking up AudioDB by v2 MB Group:`, err.message);
      }
  }

  // 2. Try v1 lookup by MBID (Release Group)
  if (mbGroupId) {
      console.log(`  🔍 Looking up AudioDB for MB Group ID (v1 API fallback): ${mbGroupId}`);
      try {
          const url = `https://www.theaudiodb.com/api/v1/json/${AUDIODB_API_KEY}/album-mb.php?i=${mbGroupId}`;
          const res = await fetch(url);
          await sleep(650);
          if (res.ok) {
              const data = await res.json();
              if (data?.album?.length > 0) return data.album[0];
          }
      } catch (err: any) {
          console.error(`  ⚠️ Error looking up AudioDB by v1 MB Group:`, err.message);
      }
  }

  // 3. Fallback to v1 String Search
  const url = `https://www.theaudiodb.com/api/v1/json/${AUDIODB_API_KEY}/searchalbum.php?s=${encodeURIComponent(artistName)}&a=${encodeURIComponent(albumName)}`;
  console.log(`  🔍 Falling back to Search AudioDB for: "${albumName}" by "${artistName}"`);
  
  try {
    const res = await fetch(url);
    
    await sleep(650); // Premium rate limit: 100 per minute

    if (!res.ok) return null;
    
    const data = await res.json();
    
    if (data && data.album && data.album.length > 0) {
       return data.album[0]; // AudioDB returns an array of matches (usually 1 for deep IDs)
    }
    return null;
  } catch (err: any) {
    console.error(`  ⚠️ Error looking up AudioDB:`, err.message);
    return null;
  }
}

async function enrichMedia(media: any) {
  const { id, album_name, artist_name, mb_release_group_id, mb_release_id } = media;
  
  const cleanAlbum = cleanName(album_name);
  const cleanArtist = cleanName(artist_name);

  console.log(`\n📋 Processing: "${album_name}" by "${artist_name}"`);
  if (cleanAlbum !== album_name || cleanArtist !== artist_name) {
      console.log(`  🧹 Cleaned to: "${cleanAlbum}" by "${cleanArtist}"`);
  }
  
  const album = await fetchAudioDBAlbum(cleanAlbum, cleanArtist, mb_release_group_id, mb_release_id);
  
  if (!album) {
      console.log(`  ⚠️ Could not find an AudioDB Album mapped to this name/artist.`);
      return {
        id: id,
        adb_check: new Date().toISOString(),
        adb_process_status: 'Not Found' 
      };
  }

  // Map the basic IDs
  const updateFields: Record<string, any> = {
      id: id,
      adb_check: new Date().toISOString(),
      adb_process_status: 'Complete',
      adb_album_id: album.idAlbum,
      adb_artist_id: album.idArtist,
  };

  // Map the deep data if it exists
  if (album.strAlbumThumb) updateFields.adb_album_thumb = album.strAlbumThumb;
  if (album.strAlbumThumbHQ) updateFields.adb_album_thumb_hq = album.strAlbumThumbHQ;
  if (album.strAlbumThumbBack) updateFields.adb_album_thumb_back = album.strAlbumThumbBack;
  if (album.strAlbumCDart) updateFields.adb_album_cdart = album.strAlbumCDart;
  if (album.strAlbumSpine) updateFields.adb_album_spine = album.strAlbumSpine;
  
  if (album.strDescriptionEN) updateFields.adb_description = album.strDescriptionEN;
  
  // AudioDB returns scores / votes as strings but they represent integers
  if (album.intScore && album.intScore !== '0') updateFields.adb_score = album.intScore;
  if (album.intScoreVotes && album.intScoreVotes !== '0') updateFields.adb_score_votes = album.intScoreVotes;
  if (album.strReview && album.strReview.trim() !== '') updateFields.adb_review = album.strReview;
  
  if (album.strStyle) updateFields.adb_style = album.strStyle;
  if (album.strGenre) updateFields.adb_genre = album.strGenre;

  console.log(`  📊 Prepared ${Object.keys(updateFields).length - 3} AudioDB fields to batch-save...`);
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
  console.log('🎵 AudioDB Media Enrichment');
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
      
      const mediaItems = await getPendingAudioDBMedia(batchLimit);

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
         await updateMediaAudioDBDataBatch(batchUpdates);
         console.log(`✅ Batch saved successfully!`);
      }

      if (limit && totalProcessed >= limit) break;
    }

    console.log('\n==================================================');
    console.log('✨ AudioDB Media Enrichment Complete!');
    console.log(`✅ Processed: ${totalProcessed}`);
    console.log('==================================================\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
