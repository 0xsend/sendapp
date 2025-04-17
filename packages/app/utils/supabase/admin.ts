import type { Database } from '@my/supabase/database.types'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Export constants derived from environment variables if they exist,
// but don't throw errors here.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_SUBDOMAIN = SUPABASE_URL ? new URL(SUPABASE_URL).hostname.split('.')[0] : ''

/**
 * Creates a Supabase client configured for server-side admin access.
 * This function should be called each time an admin client is needed.
 * It will throw an error if the required environment variables are not set.
 * @returns {SupabaseClient<Database>} A new Supabase client instance.
 * @throws {Error} If NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE environment variables are not set.
 */
export function createSupabaseAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE

  // Check for environment variables inside the function
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set. Please update the environment variables.')
  }
  if (!supabaseServiceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE is not set. Please update the environment variables.')
  }

  // Use the validated environment variables to create the client
  return createClient<Database>(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false }, // Ensure client is stateless for server use
  })
}
