import type { Merge, MergeDeep } from 'type-fest'
import type { Database as DatabaseGenerated } from './database-generated.types'
export type { Json } from './database-generated.types'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * @see https://www.postgresql.org/docs/16/functions-binarystring.html#ENCODE-FORMAT-HEX
 **/
export type PgBytea = `\\x${string}`

type ProfileLookupRow =
  DatabaseGenerated['public']['Functions']['profile_lookup']['Returns'][number]
type ProfileLookup = {
  [K in keyof ProfileLookupRow]: ProfileLookupRow[K] | null | undefined
}

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
        chain_addresses: {
          Row: {
            address: `0x${string}`
          }
          Insert: {
            address: `0x${string}`
          }
          Update: {
            address: `0x${string}`
          }
        }
        distribution_shares: {
          Row: {
            address: `0x${string}`
          }
          Insert: {
            address: `0x${string}`
          }
          Update: {
            address: `0x${string}`
          }
        }
        webauthn_credentials: {
          Row: {
            raw_credential_id: PgBytea
            public_key: PgBytea
            attestation_object: PgBytea
          }
          Insert: {
            raw_credential_id: PgBytea
            public_key: PgBytea
            attestation_object: PgBytea
          }
          Update: {
            raw_credential_id: PgBytea
            public_key: PgBytea
            attestation_object: PgBytea
          }
        }
        send_accounts: {
          Row: {
            address: `0x${string}`
            init_code: PgBytea
          }
          Insert: {
            address: `0x${string}`
            init_code: PgBytea
          }
          Update: {
            address: `0x${string}`
            init_code: PgBytea
          }
        }
      }
      Functions: {
        distribution_hodler_addresses: {
          Returns: {
            address: `0x${string}`
            created_at: string
            user_id: string
          }[]
        }
        profile_lookup: {
          Returns: ProfileLookup[]
        }
      }
      Views: {
        activity_feed: {
          Row: {
            created_at: string
            event_name: string
            from_user: Merge<
              DatabaseGenerated['public']['CompositeTypes']['activity_feed_user'],
              { tags: string[] }
            > | null
            to_user: Merge<
              DatabaseGenerated['public']['CompositeTypes']['activity_feed_user'],
              { tags: string[] }
            > | null
          }
        }
      }
    }
  }
>

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type Views<T extends keyof Database['public']['Views']> =
  Database['public']['Views'][T]['Row']
export type Functions<T extends keyof Database['public']['Functions']> =
  Database['public']['Functions'][T]['Returns']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

export type DbResult<T> = T extends PromiseLike<infer U> ? U : never
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never
export type DbResultErr = PostgrestError
