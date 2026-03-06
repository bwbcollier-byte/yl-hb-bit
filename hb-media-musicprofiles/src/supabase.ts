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
      .or('mb_process_status.is.null,mb_process_status.eq.Pending')
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

export async function updateMediaMusicBrainzDataBatch(updates: Record<string, any>[]) {
  if (updates.length === 0) return;

  // We map the array to include updated_at timestamp
  const mappedUpdates = updates.map(u => ({
    ...u,
    updated_at: new Date().toISOString()
  }));

  // Upsert requires the primary key 'id' to be present in the update object to work as a true batch update.
  const { error } = await supabase
    .from('media_profiles')
    .upsert(mappedUpdates, { onConflict: 'id' });

  if (error) {
    throw new Error(`Failed to batch update MB data: ${error.message}`);
  }
}

export async function getPendingAudioDBMedia(limit?: number) {
  try {
    console.log(`⏳ Fetching media for AudioDB enrichment...`);

      const { data, error } = await supabase
      .from('media_profiles')
      .select('id, album_name, artist_name, mb_release_group_id, mb_release_id')
      .or('adb_process_status.is.null,adb_process_status.eq.Pending')
      .limit(limit || 100);

    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error('❌ Error fetching pending AudioDB profiles:', err.message);
    return [];
  }
}

export async function updateMediaAudioDBDataBatch(updates: Record<string, any>[]) {
  if (updates.length === 0) return;

  const mappedUpdates = updates.map(u => ({
    ...u,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('media_profiles')
    .upsert(mappedUpdates, { onConflict: 'id' });

  if (error) {
    throw new Error(`Failed to batch update AudioDB data: ${error.message}`);
  }
}
export async function getPendingSpotifyMedia(limit = 100) {
    const { data, error } = await supabase
      .from('media_profiles')
      .select('id, album_name, artist_name, spotify_album_id')
      .not('spotify_album_id', 'is', null)
      .neq('spotify_album_id', '')
      .eq('spotify_process_status', 'Pending')
      .limit(limit);
  
    if (error) {
      console.error('❌ Error fetching pending Spotify profiles:', error.message);
      return [];
    }
    return data || [];
  }
  
  export async function updateMediaSpotifyDataBatch(mediaArray: any[]) {
    const { data, error } = await supabase
      .from('media_profiles')
      .upsert(mediaArray);
      
    if (error) {
      console.error('❌ Error updating Spotify data batch in Supabase:', error.message);
    }
    return data;
  }
