import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)

async function test() {
  const supabase = createClient(urlMatch![1].trim(), keyMatch![1].trim())
  const { data, error } = await supabase.storage.listBuckets()
  console.log("Buckets:", data?.map(b => b.name), error)
}
test().catch(console.error)
