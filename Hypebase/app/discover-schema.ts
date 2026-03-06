import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)

async function listTables() {
  if (urlMatch && keyMatch) {
    const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim())
    const { data, error } = await supabase.rpc('get_tables'); // Checking if a custom RPC exists, otherwise standard query
    
    if (error) {
      // Fallback to querying public schema via a common table if possible, 
      // but usually we can't query information_schema directly via PostgREST 
      // unless it's exposed. Let's try a different approach.
      console.log('Error or no RPC:', error.message)
      
      // Let's try to just select from common table names I suspect
      const tables = [
        'event_profiles', 'clubs', 'teams', 'contacts', 
        'companies', 'news_articles', 'news_sources', 
        'tasks', 'messages', 'users'
      ]
      
      for (const table of tables) {
        const { count, error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!tableError) {
          console.log(`Table found: ${table} (Count: ${count})`)
          // Fetch one record to see schema
          const { data: sample } = await supabase.from(table).select('*').limit(1)
          if (sample && sample.length > 0) {
            console.log(`Schema for ${table}:`, Object.keys(sample[0]))
          }
        } else {
          console.log(`Table not found or inaccessible: ${table}`)
        }
      }
    } else {
      console.log('Tables:', data)
    }
  }
}

listTables().catch(console.error)
