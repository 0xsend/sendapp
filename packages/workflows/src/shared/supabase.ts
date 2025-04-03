import type { PostgrestError } from '@supabase/supabase-js'

export function isRetryableDBError(error: PostgrestError) {
  // Network related errors should be retried
  const retryableCodes = [
    '08000', // Connection error
    '08006', // Connection failure
    '08001', // SQL client unable to establish connection
    '08004', // Rejected by server
    '57P01', // Admin shutdown
    '57P02', // Crash shutdown
    '40001', // Serialization failure
    '40P01', // Deadlock detected
  ]

  return retryableCodes.includes(error.code)
}
