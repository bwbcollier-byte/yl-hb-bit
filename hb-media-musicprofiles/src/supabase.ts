import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export async function getPendingMusicBrainzMedia(limit?: number) {
  try {
    console.log(`⏳ Fetching media for MusicBrainz enrichment...`);

    const { data, error } = await supabase
      .from('media_profiles')
      .select('id, spotify_album_id, album_name, artist_name, spotify_album_url')
      .not('spotify_album_id', 'is', null) // Ensure we have a Spotify ID
      .is('mb_check', null)
      .limit(limit || 100); // Small default batch size to respect MB limits

    if (error) throw error;
    
    // Default the URL if missing, as Spotify URLs are highly predictable
    return (data || []).map((album: any) => ({
      ...album,
      spotify_album_url: album.spotify_album_url || `https://open.spotify.com/album/${album.spotify_album_id}`
    }));
  } catch (err: any) {
    console.error('❌ Error fetching pending MB profiles:', err.message);
    return [];
  }
}

export async function updateMediaMusicBrainzData(spotifyAlbumId: string, updates: Record<string, any>) {
  const { error } = await supabase
    .from('media_profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('spotify_album_id', spotifyAlbumId);

  if (error) {
    throw new Error(`Failed to update MB data for ${spotifyAlbumId}: ${error.message}`);
  }
}
