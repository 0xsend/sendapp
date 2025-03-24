import type { Merge, MergeDeep } from 'type-fest'
import type { Database as DatabaseGenerated } from './database-generated.types'
export type { Json } from './database-generated.types'
import type { PostgrestError } from '@supabase/supabase-js'

/**
 * @see https://www.postgresql.org/docs/16/functions-binarystring.html#ENCODE-FORMAT-HEX
 **/
export type PgBytea = `\\x${string}`
type Hex = `0x${string}`

type ProfileLookupRow =
  DatabaseGenerated['public']['Functions']['profile_lookup']['Returns'][number]
type ProfileLookup = {
  [K in keyof ProfileLookupRow]: K extends 'address' ? Hex | null : ProfileLookupRow[K] | null
}

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
        chain_addresses: {
          Row: {
            address: Hex
          }
          Insert: {
            address: Hex
          }
          Update: {
            address: Hex
          }
        }
        distribution_shares: {
          Row: {
            address: Hex
          }
          Insert: {
            address: Hex
          }
          Update: {
            address: Hex
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
            address: Hex
            init_code: PgBytea
          }
          Insert: {
            address: Hex
            init_code: PgBytea
          }
          Update: {
            address: Hex
            init_code: PgBytea
          }
        }
        sendtag_checkout_receipts: {
          Row: {
            tx_hash: PgBytea
            sender: PgBytea
            referrer: PgBytea
          }
        }
        send_earn_new_affiliate: {
          Row: {
            log_addr: PgBytea
            tx_hash: PgBytea
            affiliate: PgBytea
            send_earn_affiliate: PgBytea
          }
        }
        send_earn_create: {
          Row: {
            log_addr: PgBytea
            tx_hash: PgBytea
            send_earn: PgBytea
            caller: PgBytea
            initial_owner: PgBytea
            vault: PgBytea
            fee_recipient: PgBytea
            collections: PgBytea
            salt: PgBytea
          }
        }
        send_earn_deposit: {
          Row: {
            log_addr: PgBytea
            owner: PgBytea
            sender: PgBytea
          }
        }
      }
      Functions: {
        distribution_hodler_addresses: {
          Returns: {
            address: Hex
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
        referrer: {
          Row: ProfileLookup
        }
        send_earn_balances: {
          Row: {
            log_addr: PgBytea
            owner: PgBytea
          }
        }
        send_earn_activity: {
          Row: {
            log_addr: PgBytea
            owner: PgBytea
            tx_hash: PgBytea
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
