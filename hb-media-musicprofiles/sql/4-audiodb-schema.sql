-- AudioDB Enrichment Schema Updates
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_check TIMESTAMP WITH TIME ZONE;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_process_status TEXT DEFAULT 'Pending';

ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_album_id TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_artist_id TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_album_thumb TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_album_thumb_hq TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_album_thumb_back TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_album_cdart TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_album_spine TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_description TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_score TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_score_votes TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_review TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_style TEXT;
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS adb_genre TEXT;

-- Index for queue performance
CREATE INDEX IF NOT EXISTS idx_media_profiles_adb_process_status ON media_profiles(adb_process_status);
