import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)

async function test() {
  if (urlMatch && keyMatch) {
    const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim())
    
    console.time('query-exact-count')
    const res1 = await supabase.from('talent_profiles').select('*', { count: 'exact' }).order('created_at').limit(1);
    console.timeEnd('query-exact-count')
    console.log('Error exact count:', res1.error?.message)

    console.time('query-no-count')
    const res2 = await supabase.from('talent_profiles').select('*').order('created_at').limit(1);
    console.timeEnd('query-no-count')
    console.log('Error no count:', res2.error?.message)
  }
}
test().catch(console.error)
