import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
// Must use service role or anon key with RLS bypass if possible? The bucket creation might fail with anon key.
// Let's try anon key first.
const keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/) || envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)

async function setupBucket() {
  if (urlMatch && keyMatch) {
    const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim())
    const { data: buckets } = await supabase.storage.listBuckets()
    const avatarsExists = buckets?.some(b => b.name === 'avatars')
    
    if (!avatarsExists) {
      console.log("Creating avatars bucket...")
      const { data, error } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 2097152 // 2MB
      })
      if (error) console.error("Error creating bucket:", error)
      else console.log("Avatars bucket created successfully!")
    } else {
      console.log("Avatars bucket already exists.")
      
      // Update bucket to make sure it is public
      await supabase.storage.updateBucket('avatars', {
        public: true
      })
      console.log("Avatars bucket set to public.")
    }
  }
}

setupBucket().catch(console.error)
