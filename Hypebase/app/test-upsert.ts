import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

async function run() {
  const r1 = await supa.from('users').select('*').limit(1)
  console.log("users table:", r1.data, r1.error)

  const { data: { users }, error } = await supa.auth.admin.listUsers() 
  // wait we only have anon key, let's just check the user we can login as

}
run()
