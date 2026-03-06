ALTER TABLE media_profiles
ADD COLUMN IF NOT EXISTS spotify_track_count INTEGER,
ADD COLUMN IF NOT EXISTS spotify_duration_ms BIGINT,
ADD COLUMN IF NOT EXISTS spotify_total_playcount BIGINT,
ADD COLUMN IF NOT EXISTS spotify_check TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS spotify_process_status TEXT;

-- Initialize status to Pending for all existing records
UPDATE media_profiles 
SET spotify_process_status = 'Pending' 
WHERE spotify_process_status IS NULL;
