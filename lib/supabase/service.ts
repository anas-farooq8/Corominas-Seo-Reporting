import { createClient } from "@supabase/supabase-js"

/**
 * Create a Supabase client with service role access
 * This bypasses RLS and should ONLY be used on the server for:
 * - Accessing KVS (API keys/tokens)
 * - Writing to dashboard_cache
 * - Backend operations that need privileged access
 * 
 * NEVER expose this client to the frontend
 * NEVER use this for user-facing queries
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
