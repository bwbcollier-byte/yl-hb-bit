import dotenv from 'dotenv';
import fetch from 'node-fetch';
import readline from 'readline';
import { getPendingSpotifyMedia, updateMediaSpotifyDataBatch } from './supabase';

dotenv.config();

const LIMIT_ENV = process.env.LIMIT || "";
const ENV_LIMIT = LIMIT_ENV.trim() !== "" ? parseInt(LIMIT_ENV, 10) : undefined;

// Rotating RapidAPI Keys (Only using the 500,000 requests/month keys)
const SPOTIFY_API_KEYS = [
  'c83516b3acmshdfd6347a5914a11p17e517jsn06a3c5de8b13',
  '7f039e9cd5msh7d53bf9623df131p1191ccjsnd5baa1efdd82',
  '0be625e0dbmshe3f58bae0a1b103p1a9cb4jsn8f4252e04b42',
  '4146451f26mshca24e2bfa13bff4p1aab81jsn84d33f841460',
  '8be5f006c9mshd812675480db254p1b653ejsn602cc9149241',
  'cea3641b50msh52581f483562ccdp186ee6jsn6759e8241393',
  '730a02e172msh79ca9cab92fe41dp1b34a2jsnd53411309cd7'
];

let currentKeyIndex = 0;

function getNextApiKey(): string {
  const key = SPOTIFY_API_KEYS[currentKeyIndex];
  currentKeyIndex = (currentKeyIndex + 1) % SPOTIFY_API_KEYS.length;
  return key;
}

// Ensure we stay within our request rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function fetchSpotifyAlbum(spotifyAlbumId: string, retryCount = 0): Promise<any | null> {
  const url = `https://spotify-api25.p.rapidapi.com/getalbum`;
  if (retryCount === 0) {
      console.log(`  🔍 Looking up Spotify for Album ID: ${spotifyAlbumId}`);
  }
  
  const apiKey = getNextApiKey();

  try {
    const res = await fetch(url, { 
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'spotify-api25.p.rapidapi.com',
            'x-rapidapi-key': apiKey
        },
        body: JSON.stringify({
            id: spotifyAlbumId,
            limit: 100 // Try to grab all tracks to calculate duration
        })
    });
    
    // Sleep a bit more to not overwhelm the RapidAPI proxy
    await sleep(400);

    if (res.status === 429) {
        if (retryCount >= SPOTIFY_API_KEYS.length) {
            console.log(`  ⚠️ API Error: Status 429 on all keys! Rate limited globally.`);
            return null;
        }
        console.log(`  ↻ Key rate limited (429). Rotating key and retrying...`);
        return await fetchSpotifyAlbum(spotifyAlbumId, retryCount + 1);
    }

    if (!res.ok) {
        console.log(`  ⚠️ API Error: Status ${res.status}`);
        return null;
    }
    
    const json = await res.json();
    
    if (json && json.data && json.data.albumUnion) {
       return json.data.albumUnion;
    }
    return null;
  } catch (err: any) {
    console.error(`  ⚠️ Error looking up Spotify:`, err.message);
    return null;
  }
}

async function enrichMedia(media: any) {
  const { id, album_name, artist_name, spotify_album_id } = media;
  
  console.log(`\n📋 Processing: "${album_name}" by "${artist_name}"`);
  
  if (!spotify_album_id) {
       console.log(`  ⚠️ No Spotify Album ID available.`);
       return {
            id: id,
            spotify_check: new Date().toISOString(),
            spotify_process_status: 'Not Found' 
       };     
  }

  const album = await fetchSpotifyAlbum(spotify_album_id);
  
  if (!album) {
      console.log(`  ⚠️ Could not find a Spotify Album for this ID.`);
      return {
        id: id,
        spotify_check: new Date().toISOString(),
        spotify_process_status: 'Not Found' 
      };
  }

  const updateFields: Record<string, any> = {
      id: id,
      spotify_check: new Date().toISOString(),
      spotify_process_status: 'Complete'
  };

  // Deep Data Extraction
  if (album.tracks && album.tracks.totalCount) {
      updateFields.spotify_track_count = album.tracks.totalCount;
  } else if (album.discs && album.discs.items && album.discs.items.length > 0) {
      let count = 0;
      album.discs.items.forEach((disc: any) => {
         if (disc.tracks && disc.tracks.totalCount) count += disc.tracks.totalCount;
      });
      if (count > 0) updateFields.spotify_track_count = count;
  }

  // Calculate Duration and Playcount
  if (album.tracks && album.tracks.items && album.tracks.items.length > 0) {
      let totalDurationMs = 0;
      let totalPlaycount = 0;

      album.tracks.items.forEach((item: any) => {
          if (item.track) {
              if (item.track.duration && item.track.duration.totalMilliseconds) {
                  totalDurationMs += parseInt(item.track.duration.totalMilliseconds);
              }
              if (item.track.playcount) {
                  totalPlaycount += parseInt(item.track.playcount);
              }
          }
      });

      if (totalDurationMs > 0) updateFields.spotify_duration_ms = totalDurationMs;
      if (totalPlaycount > 0) updateFields.spotify_total_playcount = totalPlaycount;
  }

  console.log(`  📊 Prepared Spotify fields to batch-save...`);
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
  console.log('🎵 Spotify Media Enrichment');
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
      
      const mediaItems = await getPendingSpotifyMedia(batchLimit);

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
         await updateMediaSpotifyDataBatch(batchUpdates);
         console.log(`✅ Batch saved successfully!`);
      }

      if (limit && totalProcessed >= limit) break;
    }

    console.log('\n==================================================');
    console.log('✨ Spotify Media Enrichment Complete!');
    console.log(`✅ Processed: ${totalProcessed}`);
    console.log('==================================================\n');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
