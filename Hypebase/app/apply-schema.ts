import { Client } from 'pg'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
// For local supabase, usually the connection string is standard.
// postgresql://postgres:postgres@localhost:54322/postgres

async function apply() {
  const client = new Client({
    connectionString: "postgresql://postgres:postgres@localhost:54322/postgres"
  })

  try {
    await client.connect()
    console.log('Connected to database')
    
    const sql = fs.readFileSync('schema-expansion.sql', 'utf-8')
    console.log('Reading schema-expansion.sql...')
    
    await client.query(sql)
    console.log('SQL applied successfully')
  } catch (err) {
    console.error('Error applying SQL:', err)
  } finally {
    await client.end()
  }
}

apply().catch(console.error)
