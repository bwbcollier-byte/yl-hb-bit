-- Advanced MusicBrainz Metadata
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_first_release_date TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_primary_type TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_secondary_types TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_asin TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_cover_art_exists BOOLEAN;

-- Streaming & Store URLs
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS apple_music_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS apple_music_id TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS youtube_music_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS deezer_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS tidal_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS soundcloud_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS amazon_music_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS bandcamp_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS itunes_url TEXT;

-- Database URLs
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS discogs_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS allmusic_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS allmusic_id TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS wikidata_url TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS wikipedia_url TEXT;
