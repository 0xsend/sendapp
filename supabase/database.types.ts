import { MergeDeep } from 'type-fest'
import { Database as DatabaseGenerated } from './database-generated.types'
export type { Json } from './database-generated.types'
import { PostgrestError } from '@supabase/supabase-js'

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Tables: {
        chain_addresses: {
          Row: {
            address: `0x${string}`
          }
        }
        distribution_shares: {
          Row: {
            address: `0x${string}`
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
