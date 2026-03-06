import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)

async function test() {
  const response = await fetch(`${urlMatch![1].trim()}/rest/v1/?apikey=${keyMatch![1].trim()}`)
  const swagger = await response.json()
  console.log("Users table properties keys:", Object.keys(swagger.definitions.users.properties))
}
test().catch(console.error)
