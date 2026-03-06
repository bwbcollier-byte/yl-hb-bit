import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)

async function test() {
  if (urlMatch && keyMatch) {
    const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim())
    
    // Testing the OR syntax
    const { data, error, count } = await supabase
      .from('talent_profiles')
      .select('id, name, profile_image, sp_image', { count: 'exact' })
      .or('profile_image.not.is.null,sp_image.not.is.null,tmdb_image.not.is.null,imdb_image.not.is.null')
      .limit(5);

    console.log('Error:', error);
    console.log('Count:', count);
    console.log('Data sample:', data);
  }
}
test().catch(console.error)
