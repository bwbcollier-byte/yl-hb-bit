-- =====================================================================
-- MusicBrainz Enrichment Schema Updates
-- Note: Split into individual statements to prevent transaction timeouts
-- =====================================================================

-- Core Tracking
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_check TIMESTAMP WITH TIME ZONE;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Todo';

-- MusicBrainz Fields
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_release_id TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_release_group_id TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_disambiguation TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_date TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_release_country TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_barcode TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_status TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_label_info TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_track_count TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_media TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_genres TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_tags TEXT;

-- Index for fast queue queries
CREATE INDEX IF NOT EXISTS idx_media_profiles_mb_check ON media_profiles(mb_check);
