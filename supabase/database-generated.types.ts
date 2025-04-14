export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity: {
        Row: {
          created_at: string
          data: Json | null
          event_id: string
          event_name: string
          from_user_id: string | null
          id: number
          to_user_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          event_id: string
          event_name: string
          from_user_id?: string | null
          id?: number
          to_user_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          event_id?: string
          event_name?: string
          from_user_id?: string | null
          id?: number
          to_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_stats: {
        Row: {
          created_at: string
          id: string
          send_plus_minus: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          send_plus_minus?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          send_plus_minus?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      chain_addresses: {
        Row: {
          address: string
          created_at: string
          user_id: string
        }
        Insert: {
          address: string
          created_at?: string
          user_id: string
        }
        Update: {
          address?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chain_addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: number
        }
        Insert: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: number
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: number
        }
        Relationships: []
      }
      distribution_shares: {
        Row: {
          address: string
          amount: number
          bonus_pool_amount: number
          created_at: string
          distribution_id: number
          fixed_pool_amount: number
          hodler_pool_amount: number
          id: number
          index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          amount: number
          bonus_pool_amount: number
          created_at?: string
          distribution_id: number
          fixed_pool_amount: number
          hodler_pool_amount: number
          id?: number
          index: number
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          amount?: number
          bonus_pool_amount?: number
          created_at?: string
          distribution_id?: number
          fixed_pool_amount?: number
          hodler_pool_amount?: number
          id?: number
          index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_shares_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_shares_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_verification_values: {
        Row: {
          bips_value: number
          created_at: string
          distribution_id: number
          fixed_value: number
          multiplier_max: number
          multiplier_min: number
          multiplier_step: number
          type: Database["public"]["Enums"]["verification_type"]
          updated_at: string
        }
        Insert: {
          bips_value: number
          created_at?: string
          distribution_id: number
          fixed_value: number
          multiplier_max?: number
          multiplier_min?: number
          multiplier_step?: number
          type: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
        }
        Update: {
          bips_value?: number
          created_at?: string
          distribution_id?: number
          fixed_value?: number
          multiplier_max?: number
          multiplier_min?: number
          multiplier_step?: number
          type?: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_verification_values_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_verifications: {
        Row: {
          created_at: string
          distribution_id: number
          id: number
          metadata: Json | null
          type: Database["public"]["Enums"]["verification_type"]
          user_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          distribution_id: number
          id?: number
          metadata?: Json | null
          type: Database["public"]["Enums"]["verification_type"]
          user_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          distribution_id?: number
          id?: number
          metadata?: Json | null
          type?: Database["public"]["Enums"]["verification_type"]
          user_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "distribution_verification_values_fk"
            columns: ["type", "distribution_id"]
            isOneToOne: false
            referencedRelation: "distribution_verification_values"
            referencedColumns: ["type", "distribution_id"]
          },
          {
            foreignKeyName: "distribution_verifications_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          amount: number
          bonus_pool_bips: number
          chain_id: number
          claim_end: string
          created_at: string
          description: string | null
          fixed_pool_bips: number
          hodler_min_balance: number
          hodler_pool_bips: number
          id: number
          merkle_drop_addr: string | null
          name: string
          number: number
          qualification_end: string
          qualification_start: string
          snapshot_block_num: number | null
          token_addr: string | null
          token_decimals: number | null
          tranche_id: number
          updated_at: string
        }
        Insert: {
          amount: number
          bonus_pool_bips: number
          chain_id: number
          claim_end: string
          created_at?: string
          description?: string | null
          fixed_pool_bips: number
          hodler_min_balance: number
          hodler_pool_bips: number
          id?: number
          merkle_drop_addr?: string | null
          name: string
          number: number
          qualification_end: string
          qualification_start: string
          snapshot_block_num?: number | null
          token_addr?: string | null
          token_decimals?: number | null
          tranche_id: number
          updated_at?: string
        }
        Update: {
          amount?: number
          bonus_pool_bips?: number
          chain_id?: number
          claim_end?: string
          created_at?: string
          description?: string | null
          fixed_pool_bips?: number
          hodler_min_balance?: number
          hodler_pool_bips?: number
          id?: number
          merkle_drop_addr?: string | null
          name?: string
          number?: number
          qualification_end?: string
          qualification_start?: string
          snapshot_block_num?: number | null
          token_addr?: string | null
          token_decimals?: number | null
          tranche_id?: number
          updated_at?: string
        }
        Relationships: []
      }
      liquidity_pools: {
        Row: {
          chain_id: number
          created_at: string
          pool_addr: string
          pool_name: string
          pool_type: string
        }
        Insert: {
          chain_id: number
          created_at?: string
          pool_addr: string
          pool_name: string
          pool_type: string
        }
        Update: {
          chain_id?: number
          created_at?: string
          pool_addr?: string
          pool_name?: string
          pool_type?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          birthday: string | null
          id: string
          is_public: boolean | null
          name: string | null
          referral_code: string | null
          send_id: number
          x_username: string | null
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          birthday?: string | null
          id: string
          is_public?: boolean | null
          name?: string | null
          referral_code?: string | null
          send_id?: number
          x_username?: string | null
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          birthday?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          referral_code?: string | null
          send_id?: number
          x_username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string | null
          event_id: string
          hash: string | null
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          hash?: string | null
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          hash?: string | null
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: number
          referred_id: string
          referrer_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          id?: number
          referred_id: string
          referrer_id: string
          tag: string
        }
        Update: {
          created_at?: string
          id?: number
          referred_id?: string
          referrer_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_tag_fkey"
            columns: ["tag"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["name"]
          },
        ]
      }
      send_account_created: {
        Row: {
          account: string
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          src_name: string
          tx_hash: string
          tx_idx: number
          user_op_hash: string | null
        }
        Insert: {
          account: string
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          id?: number
          ig_name: string
          log_addr: string
          log_idx: number
          src_name: string
          tx_hash: string
          tx_idx: number
          user_op_hash?: string | null
        }
        Update: {
          account?: string
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          id?: number
          ig_name?: string
          log_addr?: string
          log_idx?: number
          src_name?: string
          tx_hash?: string
          tx_idx?: number
          user_op_hash?: string | null
        }
        Relationships: []
      }
      send_account_credentials: {
        Row: {
          account_id: string
          created_at: string | null
          credential_id: string
          key_slot: number
        }
        Insert: {
          account_id: string
          created_at?: string | null
          credential_id: string
          key_slot: number
        }
        Update: {
          account_id?: string
          created_at?: string | null
          credential_id?: string
          key_slot?: number
        }
        Relationships: [
          {
            foreignKeyName: "account_credentials_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "send_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_credentials_credential_id_fkey"
            columns: ["credential_id"]
            isOneToOne: false
            referencedRelation: "webauthn_credentials"
            referencedColumns: ["id"]
          },
        ]
      }
      send_account_receives: {
        Row: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          sender: string
          src_name: string
          tx_hash: string
          tx_idx: number
          value: number
        }
        Insert: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          id?: number
          ig_name: string
          log_addr: string
          log_idx: number
          sender: string
          src_name: string
          tx_hash: string
          tx_idx: number
          value: number
        }
        Update: {
          abi_idx?: number
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          id?: number
          ig_name?: string
          log_addr?: string
          log_idx?: number
          sender?: string
          src_name?: string
          tx_hash?: string
          tx_idx?: number
          value?: number
        }
        Relationships: []
      }
      send_account_signing_key_added: {
        Row: {
          abi_idx: number
          account: string
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          id: number
          ig_name: string
          key: string
          key_slot: number
          log_addr: string
          log_idx: number
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Insert: {
          abi_idx: number
          account: string
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          id?: number
          ig_name: string
          key: string
          key_slot: number
          log_addr: string
          log_idx: number
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Update: {
          abi_idx?: number
          account?: string
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          id?: number
          ig_name?: string
          key?: string
          key_slot?: number
          log_addr?: string
          log_idx?: number
          src_name?: string
          tx_hash?: string
          tx_idx?: number
        }
        Relationships: []
      }
      send_account_signing_key_removed: {
        Row: {
          abi_idx: number
          account: string
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          id: number
          ig_name: string
          key: string
          key_slot: number
          log_addr: string
          log_idx: number
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Insert: {
          abi_idx: number
          account: string
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          id?: number
          ig_name: string
          key: string
          key_slot: number
          log_addr: string
          log_idx: number
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Update: {
          abi_idx?: number
          account?: string
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          id?: number
          ig_name?: string
          key?: string
          key_slot?: number
          log_addr?: string
          log_idx?: number
          src_name?: string
          tx_hash?: string
          tx_idx?: number
        }
        Relationships: []
      }
      send_account_transfers: {
        Row: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          f: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          src_name: string
          t: string
          tx_hash: string
          tx_idx: number
          v: number
        }
        Insert: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          f: string
          id?: number
          ig_name: string
          log_addr: string
          log_idx: number
          src_name: string
          t: string
          tx_hash: string
          tx_idx: number
          v: number
        }
        Update: {
          abi_idx?: number
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          f?: string
          id?: number
          ig_name?: string
          log_addr?: string
          log_idx?: number
          src_name?: string
          t?: string
          tx_hash?: string
          tx_idx?: number
          v?: number
        }
        Relationships: []
      }
      send_accounts: {
        Row: {
          address: string
          chain_id: number
          created_at: string
          deleted_at: string | null
          id: string
          init_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address: string
          chain_id: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          init_code: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          address?: string
          chain_id?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          init_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "send_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      send_liquidity_pools: {
        Row: {
          address: string
          chain_id: number
          id: number
        }
        Insert: {
          address: string
          chain_id: number
          id?: number
        }
        Update: {
          address?: string
          chain_id?: number
          id?: number
        }
        Relationships: []
      }
      send_pot_jackpot_runs: {
        Row: {
          abi_idx: number | null
          block_num: number | null
          block_time: number | null
          chain_id: number | null
          id: number
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          src_name: string | null
          tickets_purchased_total_bps: number | null
          time: number | null
          tx_hash: string | null
          tx_idx: number | null
          win_amount: number | null
          winner: string | null
          winning_ticket: number | null
        }
        Insert: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          tickets_purchased_total_bps?: number | null
          time?: number | null
          tx_hash?: string | null
          tx_idx?: number | null
          win_amount?: number | null
          winner?: string | null
          winning_ticket?: number | null
        }
        Update: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          tickets_purchased_total_bps?: number | null
          time?: number | null
          tx_hash?: string | null
          tx_idx?: number | null
          win_amount?: number | null
          winner?: string | null
          winning_ticket?: number | null
        }
        Relationships: []
      }
      send_pot_user_ticket_purchases: {
        Row: {
          abi_idx: number | null
          block_num: number | null
          block_time: number | null
          buyer: string | null
          chain_id: number | null
          id: number
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          recipient: string | null
          referrer: string | null
          src_name: string | null
          tickets_purchased_total_bps: number | null
          tx_hash: string | null
          tx_idx: number | null
          value: number | null
        }
        Insert: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          buyer?: string | null
          chain_id?: number | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          recipient?: string | null
          referrer?: string | null
          src_name?: string | null
          tickets_purchased_total_bps?: number | null
          tx_hash?: string | null
          tx_idx?: number | null
          value?: number | null
        }
        Update: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          buyer?: string | null
          chain_id?: number | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          recipient?: string | null
          referrer?: string | null
          src_name?: string | null
          tickets_purchased_total_bps?: number | null
          tx_hash?: string | null
          tx_idx?: number | null
          value?: number | null
        }
        Relationships: []
      }
      send_revenues_safe_receives: {
        Row: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          sender: string
          src_name: string
          tx_hash: string
          tx_idx: number
          v: number
        }
        Insert: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          id?: number
          ig_name: string
          log_addr: string
          log_idx: number
          sender: string
          src_name: string
          tx_hash: string
          tx_idx: number
          v: number
        }
        Update: {
          abi_idx?: number
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          id?: number
          ig_name?: string
          log_addr?: string
          log_idx?: number
          sender?: string
          src_name?: string
          tx_hash?: string
          tx_idx?: number
          v?: number
        }
        Relationships: []
      }
      send_slash: {
        Row: {
          distribution_id: number
          distribution_number: number
          minimum_sends: number
          scaling_divisor: number
        }
        Insert: {
          distribution_id: number
          distribution_number: number
          minimum_sends?: number
          scaling_divisor?: number
        }
        Update: {
          distribution_id?: number
          distribution_number?: number
          minimum_sends?: number
          scaling_divisor?: number
        }
        Relationships: [
          {
            foreignKeyName: "send_slash_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
        ]
      }
      send_token_transfers: {
        Row: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          f: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          src_name: string
          t: string
          tx_hash: string
          tx_idx: number
          v: number
        }
        Insert: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          f: string
          id?: number
          ig_name: string
          log_addr: string
          log_idx: number
          src_name: string
          t: string
          tx_hash: string
          tx_idx: number
          v: number
        }
        Update: {
          abi_idx?: number
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          f?: string
          id?: number
          ig_name?: string
          log_addr?: string
          log_idx?: number
          src_name?: string
          t?: string
          tx_hash?: string
          tx_idx?: number
          v?: number
        }
        Relationships: []
      }
      send_token_v0_transfers: {
        Row: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          f: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          src_name: string
          t: string
          tx_hash: string
          tx_idx: number
          v: number
        }
        Insert: {
          abi_idx: number
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          f: string
          id?: number
          ig_name: string
          log_addr: string
          log_idx: number
          src_name: string
          t: string
          tx_hash: string
          tx_idx: number
          v: number
        }
        Update: {
          abi_idx?: number
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          f?: string
          id?: number
          ig_name?: string
          log_addr?: string
          log_idx?: number
          src_name?: string
          t?: string
          tx_hash?: string
          tx_idx?: number
          v?: number
        }
        Relationships: []
      }
      sendpot_jackpot_runs: {
        Row: {
          abi_idx: number | null
          block_num: number | null
          block_time: number | null
          chain_id: number | null
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          src_name: string | null
          tickets_purchased_total_bps: number | null
          time: number | null
          tx_hash: string | null
          tx_idx: number | null
          win_amount: number | null
          winner: string | null
          winning_ticket: number | null
        }
        Insert: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          tickets_purchased_total_bps?: number | null
          time?: number | null
          tx_hash?: string | null
          tx_idx?: number | null
          win_amount?: number | null
          winner?: string | null
          winning_ticket?: number | null
        }
        Update: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          tickets_purchased_total_bps?: number | null
          time?: number | null
          tx_hash?: string | null
          tx_idx?: number | null
          win_amount?: number | null
          winner?: string | null
          winning_ticket?: number | null
        }
        Relationships: []
      }
      sendpot_user_ticket_purchases: {
        Row: {
          abi_idx: number | null
          block_num: number | null
          block_time: number | null
          buyer: string | null
          chain_id: number | null
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          recipient: string | null
          referrer: string | null
          src_name: string | null
          tickets_purchased_total_bps: number | null
          tx_hash: string | null
          tx_idx: number | null
        }
        Insert: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          buyer?: string | null
          chain_id?: number | null
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          recipient?: string | null
          referrer?: string | null
          src_name?: string | null
          tickets_purchased_total_bps?: number | null
          tx_hash?: string | null
          tx_idx?: number | null
        }
        Update: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          buyer?: string | null
          chain_id?: number | null
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          recipient?: string | null
          referrer?: string | null
          src_name?: string | null
          tickets_purchased_total_bps?: number | null
          tx_hash?: string | null
          tx_idx?: number | null
        }
        Relationships: []
      }
      sendtag_checkout_receipts: {
        Row: {
          abi_idx: number
          amount: number
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          referrer: string
          reward: number
          sender: string
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Insert: {
          abi_idx: number
          amount: number
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          id?: number
          ig_name: string
          log_addr: string
          log_idx: number
          referrer: string
          reward: number
          sender: string
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Update: {
          abi_idx?: number
          amount?: number
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          id?: number
          ig_name?: string
          log_addr?: string
          log_idx?: number
          referrer?: string
          reward?: number
          sender?: string
          src_name?: string
          tx_hash?: string
          tx_idx?: number
        }
        Relationships: []
      }
      swap_routers: {
        Row: {
          chain_id: number
          created_at: string
          router_addr: string
        }
        Insert: {
          chain_id: number
          created_at?: string
          router_addr: string
        }
        Update: {
          chain_id?: number
          created_at?: string
          router_addr?: string
        }
        Relationships: []
      }
      tag_receipts: {
        Row: {
          created_at: string | null
          event_id: string | null
          hash: string | null
          id: number
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          hash?: string | null
          id?: number
          tag_name: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          hash?: string | null
          id?: number
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_receipts_tag_name_fkey"
            columns: ["tag_name"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["name"]
          },
        ]
      }
      tag_reservations: {
        Row: {
          chain_address: string | null
          created_at: string
          tag_name: string
        }
        Insert: {
          chain_address?: string | null
          created_at?: string
          tag_name: string
        }
        Update: {
          chain_address?: string | null
          created_at?: string
          tag_name?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string
          name: string
          status: Database["public"]["Enums"]["tag_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          name: string
          status?: Database["public"]["Enums"]["tag_status"]
          user_id?: string
        }
        Update: {
          created_at?: string
          name?: string
          status?: Database["public"]["Enums"]["tag_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_credentials: {
        Row: {
          attestation_object: string
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          key_type: Database["public"]["Enums"]["key_type_enum"]
          name: string
          public_key: string
          raw_credential_id: string
          sign_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          attestation_object: string
          created_at?: string
          deleted_at?: string | null
          display_name: string
          id?: string
          key_type: Database["public"]["Enums"]["key_type_enum"]
          name: string
          public_key: string
          raw_credential_id: string
          sign_count: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          attestation_object?: string
          created_at?: string
          deleted_at?: string | null
          display_name?: string
          id?: string
          key_type?: Database["public"]["Enums"]["key_type_enum"]
          name?: string
          public_key?: string
          raw_credential_id?: string
          sign_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_credentials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      activity_feed: {
        Row: {
          created_at: string | null
          data: Json | null
          event_name: string | null
          from_user:
            | Database["public"]["CompositeTypes"]["activity_feed_user"]
            | null
          to_user:
            | Database["public"]["CompositeTypes"]["activity_feed_user"]
            | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_and_insert_send_ceiling_verification: {
        Args: {
          distribution_number: number
        }
        Returns: undefined
      }
      citext:
        | {
            Args: {
              "": boolean
            }
            Returns: string
          }
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: string
          }
      citext_hash: {
        Args: {
          "": string
        }
        Returns: number
      }
      citextin: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      citextout: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      citextrecv: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      citextsend: {
        Args: {
          "": string
        }
        Returns: string
      }
      confirm_tags: {
        Args: {
          tag_names: string[]
          event_id: string
          referral_code_input: string
        }
        Returns: undefined
      }
      create_send_account: {
        Args: {
          send_account: unknown
          webauthn_credential: unknown
          key_slot: number
        }
        Returns: Json
      }
      distribution_hodler_addresses: {
        Args: {
          distribution_id: number
        }
        Returns: {
          address: string
          chain_id: number
          created_at: string
          deleted_at: string | null
          id: string
          init_code: string
          updated_at: string
          user_id: string
        }[]
      }
      fake_otp_credentials: {
        Args: {
          phone: string
        }
        Returns: undefined
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_affiliate_referrals: {
        Args: Record<PropertyKey, never>
        Returns: {
          referred_id: string
          avatar_url: string
          tag: string
          created_at: string
        }[]
      }
      get_affiliate_stats_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          created_at: string
          user_id: string
          referral_count: number
        }[]
      }
      get_pending_jackpot_tickets_purchased: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_user_jackpot_summary: {
        Args: {
          num_runs: number
        }
        Returns: {
          jackpot_run_id: number
          jackpot_block_num: number
          jackpot_block_time: number
          winner: string
          win_amount: number
          total_tickets: number
        }[]
      }
      insert_challenge: {
        Args: Record<PropertyKey, never>
        Returns: {
          challenge: string
          created_at: string
          expires_at: string
          id: number
        }
      }
      leaderboard_referrals_all_time: {
        Args: Record<PropertyKey, never>
        Returns: {
          rewards_usdc: number
          referrals: number
          user: Database["public"]["CompositeTypes"]["activity_feed_user"]
        }[]
      }
      profile_lookup: {
        Args: {
          lookup_type: Database["public"]["Enums"]["lookup_type_enum"]
          identifier: string
        }
        Returns: {
          id: string
          avatar_url: string
          name: string
          about: string
          refcode: string
          x_username: string
          tag: string
          address: string
          chain_id: number
          is_public: boolean
          sendid: number
          all_tags: string[]
        }[]
      }
      referrer_lookup: {
        Args: {
          referral_code?: string
        }
        Returns: {
          referrer: Database["public"]["CompositeTypes"]["profile_lookup_result"]
          new_referrer: Database["public"]["CompositeTypes"]["profile_lookup_result"]
        }[]
      }
      send_accounts_add_webauthn_credential: {
        Args: {
          send_account_id: string
          webauthn_credential: unknown
          key_slot: number
        }
        Returns: {
          attestation_object: string
          created_at: string
          deleted_at: string | null
          display_name: string
          id: string
          key_type: Database["public"]["Enums"]["key_type_enum"]
          name: string
          public_key: string
          raw_credential_id: string
          sign_count: number
          updated_at: string
          user_id: string
        }
      }
      sum_qualification_sends: {
        Args: {
          distribution_number: number
        }
        Returns: {
          user_id: string
          amount: number
          sent_to: string[]
        }[]
      }
      tag_search: {
        Args: {
          query: string
          limit_val: number
          offset_val: number
        }
        Returns: {
          send_id_matches: Database["public"]["CompositeTypes"]["tag_search_result"][]
          tag_matches: Database["public"]["CompositeTypes"]["tag_search_result"][]
          phone_matches: Database["public"]["CompositeTypes"]["tag_search_result"][]
        }[]
      }
      update_distribution_shares: {
        Args: {
          distribution_id: number
          shares: unknown[]
        }
        Returns: undefined
      }
      user_referrals_count: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
    Enums: {
      key_type_enum: "ES256"
      lookup_type_enum: "sendid" | "tag" | "refcode" | "address" | "phone"
      tag_status: "pending" | "confirmed"
      verification_type:
        | "tag_registration"
        | "tag_referral"
        | "create_passkey"
        | "send_ten"
        | "send_one_hundred"
        | "total_tag_referrals"
        | "send_streak"
        | "send_ceiling"
      verification_value_mode: "individual" | "aggregate"
    }
    CompositeTypes: {
      activity_feed_user: {
        id: string
        name: string
        avatar_url: string
        send_id: number
        tags: unknown
      }
      profile_lookup_result: {
        id: string
        avatar_url: string
        name: string
        about: string
        refcode: string
        x_username: string
        tag: string
        address: string
        chain_id: number
        is_public: boolean
        sendid: number
        all_tags: unknown
      }
      tag_search_result: {
        avatar_url: string
        tag_name: string
        send_id: number
        phone: string
      }
    }
  }
  temporal: {
    Tables: {
      send_account_transfers: {
        Row: {
          created_at: string
          created_at_block_num: number | null
          data: Json | null
          id: number
          status: Database["temporal"]["Enums"]["transfer_status"]
          updated_at: string
          user_id: string | null
          workflow_id: string
        }
        Insert: {
          created_at?: string
          created_at_block_num?: number | null
          data?: Json | null
          id?: number
          status?: Database["temporal"]["Enums"]["transfer_status"]
          updated_at?: string
          user_id?: string | null
          workflow_id: string
        }
        Update: {
          created_at?: string
          created_at_block_num?: number | null
          data?: Json | null
          id?: number
          status?: Database["temporal"]["Enums"]["transfer_status"]
          updated_at?: string
          user_id?: string | null
          workflow_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      transfer_status:
        | "initialized"
        | "submitted"
        | "sent"
        | "confirmed"
        | "failed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
        Database["public"]["Views"])
    ? (Database["public"]["Tables"] &
        Database["public"]["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

