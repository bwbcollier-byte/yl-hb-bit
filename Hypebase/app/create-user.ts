import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)
const keyMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)

async function createTestUser() {
  if (urlMatch && keyMatch) {
    const supabaseUrl = urlMatch[1].trim()
    const supabaseKey = keyMatch[1].trim()
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    const email = "ben@hypebase.com"
    const password = "password123!"
    
    console.log(`Attempting to create/login user: ${email}`)

    // 1. Try to sign up the user
    let user = null
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })
    
    if (signUpError) {
      console.log("Signup failed (might already exist):", signUpError.message)
      // 2. Try signing in if already exists
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        console.error("Login also failed:", signInError.message)
        return
      }
      user = signInData.user
      console.log("Successfully logged in existing user ID:", user?.id)
    } else {
      user = signUpData.user
      console.log("Successfully created new auth user ID:", user?.id)
    }

    if (user) {
      console.log("Ensuring user record exists in the public `users` table...")
      // 3. Upsert record in public.users
      const { data, error } = await supabase.from('users').upsert({
        id: user.id,
        email: email,
        name_first: "Ben",
        name_last: "Collier",
        location: "Sydney"
      }).select()

      if (error) {
         console.error("Error creating public users record:", error.message)
         console.log("Note: If RLS is preventing upsert, you may need to disable RLS on 'users' table or use a service_role key.")
      } else {
         console.log("Public 'users' record setup successfully!")
      }
    }
  } else {
    console.error("Could not find Supabase credentials in .env.local")
  }
}

createTestUser().catch(console.error)
