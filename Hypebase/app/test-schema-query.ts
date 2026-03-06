import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)

async function test() {
  if (urlMatch && keyMatch) {
    const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim())
    const { data, error } = await supabase.from('talent_profiles').select('*').order("id").limit(1);
    console.log('Error output for query:', JSON.stringify(error, null, 2))
    console.log('Data count for query:', data?.length)
    if (data && data.length > 0) {
      console.log('Sample record:', JSON.stringify(data[0], null, 2))
    }
  }
}
test().catch(console.error)
