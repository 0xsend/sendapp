import type { Database } from '@my/supabase/database.types'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is not set. Please update the root .env.local and restart the server.'
  )
}
if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE is not set. Please update the root .env.local and restart the server.'
  )
}

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL

// @note see how Supabase does it here: https://github.com/supabase/supabase-js/blob/f6bf008d8017ae013450ecd3fa806acad735bacc/src/SupabaseClient.ts#L95
export const SUPABASE_SUBDOMAIN = new URL(SUPABASE_URL).hostname.split('.')[0]

const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE

/**
 * only meant to be used on the server side.
 */
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE, {
  auth: { persistSession: false },
})
