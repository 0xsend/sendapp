import type { PostgrestError } from '@supabase/supabase-js'

/**
 * Checks if a PostgrestError indicates a potentially transient database issue
 * that might be resolved by retrying.
 */
export function isRetryableDBError(error: PostgrestError): boolean {
  // Network related errors or temporary server issues should be retried
  const retryableCodes = [
    '08000', // connection_exception
    '08003', // connection_does_not_exist
    '08006', // connection_failure
    '08001', // sqlclient_unable_to_establish_sqlconnection
    '08004', // sqlserver_rejected_establishment_of_sqlconnection
    '08007', // transaction_resolution_unknown
    '08P01', // protocol_violation (potentially transient)
    '53000', // insufficient_resources (e.g., out of memory, disk full - maybe retry)
    '53100', // disk_full
    '53200', // out_of_memory
    '53300', // too_many_connections
    '57P01', // admin_shutdown
    '57P02', // crash_shutdown
    '57P03', // cannot_connect_now (e.g., startup, recovery)
    '40001', // serialization_failure (optimistic lock failure, retryable)
    '40P01', // deadlock_detected (retryable)
    'XX000', // internal_error (potentially transient)
    'XX001', // data_corrupted
    'XX002', // index_corrupted
  ]

  // Check if the error code is in the list of retryable codes
  return retryableCodes.includes(error.code)
}
