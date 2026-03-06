-- Add our internal processing status tracker
ALTER TABLE media_profiles ADD COLUMN IF NOT EXISTS mb_process_status TEXT DEFAULT 'Pending';

-- Create an index to make queueing super fast
CREATE INDEX IF NOT EXISTS idx_media_profiles_mb_process_status ON media_profiles(mb_process_status);

-- Set any existing records that have been checked already to 'Complete' or 'Not Found' based on if we saved an ID
UPDATE media_profiles
SET mb_process_status = CASE 
    WHEN mb_release_id IS NOT NULL AND mb_release_id != '' THEN 'Complete'
    ELSE 'Not Found'
END
WHERE mb_check IS NOT NULL AND (mb_process_status IS NULL OR mb_process_status = 'Pending');
