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
        Relationships: []
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
        Relationships: []
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
            foreignKeyName: "distribution_shares_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "send_scores_current"
            referencedColumns: ["distribution_id"]
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
          {
            foreignKeyName: "distribution_verification_values_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "send_scores_current"
            referencedColumns: ["distribution_id"]
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
            foreignKeyName: "distribution_verifications_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "send_scores_current"
            referencedColumns: ["distribution_id"]
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
          earn_min_balance: number
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
          earn_min_balance?: number
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
          earn_min_balance?: number
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
      link_in_bio: {
        Row: {
          created_at: string
          domain: string | null
          domain_name: Database["public"]["Enums"]["link_in_bio_domain_names"]
          handle: string | null
          id: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          domain_name: Database["public"]["Enums"]["link_in_bio_domain_names"]
          handle?: string | null
          id?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          domain_name?: Database["public"]["Enums"]["link_in_bio_domain_names"]
          handle?: string | null
          id?: number
          updated_at?: string
          user_id?: string
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
          banner_url: string | null
          birthday: string | null
          id: string
          is_public: boolean | null
          name: string | null
          referral_code: string | null
          send_id: number
          x_username: string | null
          links_in_bio:
            | Database["public"]["Tables"]["link_in_bio"]["Row"]
            | null
          main_tag: Database["public"]["Tables"]["tags"]["Row"] | null
          tags: Database["public"]["Tables"]["tags"]["Row"] | null
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          banner_url?: string | null
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
          banner_url?: string | null
          birthday?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          referral_code?: string | null
          send_id?: number
          x_username?: string | null
        }
        Relationships: []
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
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: number
          referred_id: string
          referrer_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          referred_id: string
          referrer_id: string
        }
        Update: {
          created_at?: string
          id?: number
          referred_id?: string
          referrer_id?: string
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
      send_account_tags: {
        Row: {
          created_at: string
          id: number
          send_account_id: string
          tag_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: number
          send_account_id: string
          tag_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: number
          send_account_id?: string
          tag_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "send_account_tags_send_account_id_fkey"
            columns: ["send_account_id"]
            isOneToOne: false
            referencedRelation: "send_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "send_account_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
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
          main_tag_id: number | null
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
          main_tag_id?: number | null
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
          main_tag_id?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "send_accounts_main_tag_id_fkey"
            columns: ["main_tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      send_earn_create: {
        Row: {
          abi_idx: number
          block_num: number
          block_time: number
          caller: string
          chain_id: number
          collections: string
          event_id: string
          fee: number
          fee_recipient: string
          id: number
          ig_name: string
          initial_owner: string
          log_addr: string
          log_idx: number
          salt: string
          send_earn: string
          src_name: string
          tx_hash: string
          tx_idx: number
          vault: string
        }
        Insert: {
          abi_idx: number
          block_num: number
          block_time: number
          caller: string
          chain_id: number
          collections: string
          event_id?: string
          fee: number
          fee_recipient: string
          id?: never
          ig_name: string
          initial_owner: string
          log_addr: string
          log_idx: number
          salt: string
          send_earn: string
          src_name: string
          tx_hash: string
          tx_idx: number
          vault: string
        }
        Update: {
          abi_idx?: number
          block_num?: number
          block_time?: number
          caller?: string
          chain_id?: number
          collections?: string
          event_id?: string
          fee?: number
          fee_recipient?: string
          id?: never
          ig_name?: string
          initial_owner?: string
          log_addr?: string
          log_idx?: number
          salt?: string
          send_earn?: string
          src_name?: string
          tx_hash?: string
          tx_idx?: number
          vault?: string
        }
        Relationships: []
      }
      send_earn_deposit: {
        Row: {
          abi_idx: number
          assets: number
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          owner: string
          sender: string
          shares: number
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Insert: {
          abi_idx: number
          assets: number
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          id?: never
          ig_name: string
          log_addr: string
          log_idx: number
          owner: string
          sender: string
          shares: number
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Update: {
          abi_idx?: number
          assets?: number
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          id?: never
          ig_name?: string
          log_addr?: string
          log_idx?: number
          owner?: string
          sender?: string
          shares?: number
          src_name?: string
          tx_hash?: string
          tx_idx?: number
        }
        Relationships: []
      }
      send_earn_new_affiliate: {
        Row: {
          abi_idx: number
          affiliate: string
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          send_earn_affiliate: string
          src_name: string
          tx_hash: string
          tx_idx: number
          send_earn_affiliate_vault:
            | Database["public"]["Tables"]["send_earn_create"]["Row"]
            | null
        }
        Insert: {
          abi_idx: number
          affiliate: string
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          id?: never
          ig_name: string
          log_addr: string
          log_idx: number
          send_earn_affiliate: string
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Update: {
          abi_idx?: number
          affiliate?: string
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          id?: never
          ig_name?: string
          log_addr?: string
          log_idx?: number
          send_earn_affiliate?: string
          src_name?: string
          tx_hash?: string
          tx_idx?: number
        }
        Relationships: []
      }
      send_earn_withdraw: {
        Row: {
          abi_idx: number
          assets: number
          block_num: number
          block_time: number
          chain_id: number
          event_id: string
          id: number
          ig_name: string
          log_addr: string
          log_idx: number
          owner: string
          receiver: string
          sender: string
          shares: number
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Insert: {
          abi_idx: number
          assets: number
          block_num: number
          block_time: number
          chain_id: number
          event_id?: string
          id?: never
          ig_name: string
          log_addr: string
          log_idx: number
          owner: string
          receiver: string
          sender: string
          shares: number
          src_name: string
          tx_hash: string
          tx_idx: number
        }
        Update: {
          abi_idx?: number
          assets?: number
          block_num?: number
          block_time?: number
          chain_id?: number
          event_id?: string
          id?: never
          ig_name?: string
          log_addr?: string
          log_idx?: number
          owner?: string
          receiver?: string
          sender?: string
          shares?: number
          src_name?: string
          tx_hash?: string
          tx_idx?: number
        }
        Relationships: []
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
          {
            foreignKeyName: "send_slash_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "send_scores_current"
            referencedColumns: ["distribution_id"]
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
      sendpot_user_ticket_purchases: {
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
          tag_id: number
          tag_name: string
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          hash?: string | null
          id?: number
          tag_id: number
          tag_name: string
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          hash?: string | null
          id?: number
          tag_id?: number
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_receipts_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: number
          name: string
          status: Database["public"]["Enums"]["tag_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          name: string
          status?: Database["public"]["Enums"]["tag_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          name?: string
          status?: Database["public"]["Enums"]["tag_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
        Relationships: []
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
      dashboard_metrics: {
        Row: {
          daily_active_receivers: number | null
          daily_active_senders: number | null
          daily_active_transfers: number | null
          new_affiliates: Json | null
          new_sendtags: Json | null
          passkeys: number | null
          send_volume: number | null
          sendtag_referral_payouts: number | null
          sendtag_revenue: number | null
          sendtags: number | null
          top_all_ips: Json | null
          total_transactions: number | null
          usdc_volume: number | null
        }
        Relationships: []
      }
      referrer: {
        Row: {
          about: string | null
          address: string | null
          all_tags: string[] | null
          avatar_url: string | null
          banner_url: string | null
          birthday: string | null
          chain_id: number | null
          id: string | null
          is_public: boolean | null
          links_in_bio:
            | Database["public"]["Tables"]["link_in_bio"]["Row"][]
            | null
          main_tag_id: number | null
          main_tag_name: string | null
          name: string | null
          refcode: string | null
          send_id: number | null
          sendid: number | null
          tag: string | null
          x_username: string | null
        }
        Relationships: []
      }
      send_earn_activity: {
        Row: {
          assets: number | null
          block_num: number | null
          block_time: number | null
          log_addr: string | null
          owner: string | null
          sender: string | null
          shares: number | null
          tx_hash: string | null
          type: string | null
        }
        Relationships: []
      }
      send_earn_balances: {
        Row: {
          assets: number | null
          log_addr: string | null
          owner: string | null
          shares: number | null
        }
        Relationships: []
      }
      send_earn_balances_timeline: {
        Row: {
          assets: number | null
          block_num: number | null
          block_time: number | null
          log_addr: string | null
          owner: string | null
          shares: number | null
        }
        Relationships: []
      }
      send_scores: {
        Row: {
          distribution_id: number | null
          score: number | null
          send_ceiling: number | null
          unique_sends: number | null
          user_id: string | null
        }
        Relationships: []
      }
      send_scores_current: {
        Row: {
          distribution_id: number | null
          score: number | null
          send_ceiling: number | null
          unique_sends: number | null
          user_id: string | null
        }
        Relationships: []
      }
      send_scores_current_unique: {
        Row: {
          capped_amount: number | null
          distribution_id: number | null
          from_user_id: string | null
          send_ceiling: number | null
          to_user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_and_insert_send_ceiling_verification: {
        Args: { distribution_number: number }
        Returns: undefined
      }
      citext: {
        Args: { "": boolean } | { "": string } | { "": unknown }
        Returns: string
      }
      citext_hash: {
        Args: { "": string }
        Returns: number
      }
      citextin: {
        Args: { "": unknown }
        Returns: string
      }
      citextout: {
        Args: { "": string }
        Returns: unknown
      }
      citextrecv: {
        Args: { "": unknown }
        Returns: string
      }
      citextsend: {
        Args: { "": string }
        Returns: string
      }
      confirm_tags: {
        Args: {
          _event_id: string
          _referral_code: string
          send_account_id: string
          tag_names: string[]
        }
        Returns: undefined
      }
      create_send_account: {
        Args: {
          key_slot: number
          send_account: Database["public"]["Tables"]["send_accounts"]["Row"]
          webauthn_credential: Database["public"]["Tables"]["webauthn_credentials"]["Row"]
        }
        Returns: Json
      }
      create_tag: {
        Args: { send_account_id: string; tag_name: string }
        Returns: number
      }
      distribution_hodler_addresses: {
        Args: { distribution_id: number }
        Returns: {
          address: string
          chain_id: number
          created_at: string
          deleted_at: string | null
          id: string
          init_code: string
          main_tag_id: number | null
          updated_at: string
          user_id: string
        }[]
      }
      favourite_senders: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["CompositeTypes"]["activity_feed_user"][]
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_affiliate_referrals: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          created_at: string
          send_plus_minus: number
          tag: string
        }[]
      }
      get_affiliate_stats_summary: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          id: string
          referral_count: number
          user_id: string
        }[]
      }
      get_friends: {
        Args: Record<PropertyKey, never>
        Returns: {
          avatar_url: string
          birthday: string
          created_at: string
          links_in_bio: Database["public"]["Tables"]["link_in_bio"]["Row"][]
          name: string
          sendid: number
          tag: string
          x_username: string
        }[]
      }
      get_pending_jackpot_tickets_purchased: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_send_scores_history: {
        Args: Record<PropertyKey, never>
        Returns: {
          distribution_id: number
          score: number
          send_ceiling: number
          unique_sends: number
          user_id: string
        }[]
      }
      get_user_jackpot_summary: {
        Args: { num_runs: number }
        Returns: {
          jackpot_block_num: number
          jackpot_block_time: number
          jackpot_run_id: number
          total_tickets: number
          win_amount: number
          winner: string
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
      insert_create_passkey_verifications: {
        Args: { distribution_num: number }
        Returns: undefined
      }
      insert_send_slash: {
        Args: {
          distribution_number: number
          minimum_sends?: number
          scaling_divisor?: number
        }
        Returns: undefined
      }
      insert_send_streak_verifications: {
        Args: { distribution_num: number }
        Returns: undefined
      }
      insert_send_verifications: {
        Args: { distribution_num: number }
        Returns: undefined
      }
      insert_tag_referral_verifications: {
        Args: { distribution_num: number }
        Returns: undefined
      }
      insert_tag_registration_verifications: {
        Args: { distribution_num: number }
        Returns: undefined
      }
      insert_total_referral_verifications: {
        Args: { distribution_num: number }
        Returns: undefined
      }
      insert_verification_value: {
        Args: {
          bips_value?: number
          distribution_number: number
          fixed_value?: number
          multiplier_max?: number
          multiplier_min?: number
          multiplier_step?: number
          type: Database["public"]["Enums"]["verification_type"]
        }
        Returns: undefined
      }
      leaderboard_referrals_all_time: {
        Args: Record<PropertyKey, never>
        Returns: {
          referrals: number
          rewards_usdc: number
          user: Database["public"]["CompositeTypes"]["activity_feed_user"]
        }[]
      }
      links_in_bio: {
        Args: { "": Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: {
          created_at: string
          domain: string | null
          domain_name: Database["public"]["Enums"]["link_in_bio_domain_names"]
          handle: string | null
          id: number
          updated_at: string
          user_id: string
        }[]
      }
      main_tag: {
        Args: { "": Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: {
          created_at: string
          id: number
          name: string
          status: Database["public"]["Enums"]["tag_status"]
          updated_at: string
          user_id: string | null
        }
      }
      profile_lookup: {
        Args: {
          identifier: string
          lookup_type: Database["public"]["Enums"]["lookup_type_enum"]
        }
        Returns: Database["public"]["CompositeTypes"]["profile_lookup_result"][]
      }
      query_webauthn_credentials_by_phone: {
        Args: { phone_number: string }
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
        }[]
      }
      recent_senders: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["CompositeTypes"]["activity_feed_user"][]
      }
      referrer_lookup: {
        Args: { referral_code?: string }
        Returns: {
          new_referrer: Database["public"]["CompositeTypes"]["profile_lookup_result"]
          referrer: Database["public"]["CompositeTypes"]["profile_lookup_result"]
        }[]
      }
      refresh_send_scores_history: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      register_first_sendtag: {
        Args: {
          _referral_code?: string
          send_account_id: string
          tag_name: string
        }
        Returns: Json
      }
      send_accounts_add_webauthn_credential: {
        Args: {
          key_slot: number
          send_account_id: string
          webauthn_credential: Database["public"]["Tables"]["webauthn_credentials"]["Row"]
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
      send_earn_affiliate_vault: {
        Args: {
          "": Database["public"]["Tables"]["send_earn_new_affiliate"]["Row"]
        }
        Returns: {
          abi_idx: number
          block_num: number
          block_time: number
          caller: string
          chain_id: number
          collections: string
          event_id: string
          fee: number
          fee_recipient: string
          id: number
          ig_name: string
          initial_owner: string
          log_addr: string
          log_idx: number
          salt: string
          send_earn: string
          src_name: string
          tx_hash: string
          tx_idx: number
          vault: string
        }[]
      }
      tag_search: {
        Args: { limit_val: number; offset_val: number; query: string }
        Returns: {
          phone_matches: Database["public"]["CompositeTypes"]["tag_search_result"][]
          send_id_matches: Database["public"]["CompositeTypes"]["tag_search_result"][]
          tag_matches: Database["public"]["CompositeTypes"]["tag_search_result"][]
        }[]
      }
      tags: {
        Args: { "": Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: {
          created_at: string
          id: number
          name: string
          status: Database["public"]["Enums"]["tag_status"]
          updated_at: string
          user_id: string | null
        }[]
      }
      today_birthday_senders: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["CompositeTypes"]["activity_feed_user"][]
      }
      top_senders: {
        Args: { limit_count?: number }
        Returns: Database["public"]["CompositeTypes"]["activity_feed_user"][]
      }
      update_distribution_shares: {
        Args: {
          distribution_id: number
          shares: Database["public"]["Tables"]["distribution_shares"]["Row"][]
        }
        Returns: undefined
      }
      update_referral_verifications: {
        Args: {
          distribution_id: number
          shares: Database["public"]["Tables"]["distribution_shares"]["Row"][]
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
      link_in_bio_domain_names:
        | "X"
        | "Instagram"
        | "YouTube"
        | "TikTok"
        | "GitHub"
        | "Telegram"
        | "Discord"
        | "Facebook"
        | "OnlyFans"
        | "WhatsApp"
        | "Snapchat"
        | "Twitch"
      lookup_type_enum: "sendid" | "tag" | "refcode" | "address" | "phone"
      tag_status: "pending" | "confirmed" | "available"
      temporal_status:
        | "initialized"
        | "submitted"
        | "sent"
        | "confirmed"
        | "failed"
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
        id: string | null
        name: string | null
        avatar_url: string | null
        send_id: number | null
        main_tag_id: number | null
        main_tag_name: string | null
        tags: string[] | null
      }
      profile_lookup_result: {
        id: string | null
        avatar_url: string | null
        name: string | null
        about: string | null
        refcode: string | null
        x_username: string | null
        birthday: string | null
        tag: string | null
        address: string | null
        chain_id: number | null
        is_public: boolean | null
        sendid: number | null
        all_tags: string[] | null
        main_tag_id: number | null
        main_tag_name: string | null
        links_in_bio:
          | Database["public"]["Tables"]["link_in_bio"]["Row"][]
          | null
        banner_url: string | null
      }
      tag_search_result: {
        avatar_url: string | null
        tag_name: string | null
        send_id: number | null
        phone: string | null
        is_verified: boolean | null
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
          send_account_transfers_activity_event_id: string | null
          send_account_transfers_activity_event_name: string | null
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
          send_account_transfers_activity_event_id?: string | null
          send_account_transfers_activity_event_name?: string | null
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
          send_account_transfers_activity_event_id?: string | null
          send_account_transfers_activity_event_name?: string | null
          status?: Database["temporal"]["Enums"]["transfer_status"]
          updated_at?: string
          user_id?: string | null
          workflow_id?: string
        }
        Relationships: []
      }
      send_earn_deposits: {
        Row: {
          activity_id: number | null
          assets: number | null
          block_num: number | null
          created_at: string
          error_message: string | null
          owner: string | null
          status: Database["public"]["Enums"]["temporal_status"]
          updated_at: string
          user_op_hash: string | null
          vault: string | null
          workflow_id: string
        }
        Insert: {
          activity_id?: number | null
          assets?: number | null
          block_num?: number | null
          created_at?: string
          error_message?: string | null
          owner?: string | null
          status?: Database["public"]["Enums"]["temporal_status"]
          updated_at?: string
          user_op_hash?: string | null
          vault?: string | null
          workflow_id: string
        }
        Update: {
          activity_id?: number | null
          assets?: number | null
          block_num?: number | null
          created_at?: string
          error_message?: string | null
          owner?: string | null
          status?: Database["public"]["Enums"]["temporal_status"]
          updated_at?: string
          user_op_hash?: string | null
          vault?: string | null
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      key_type_enum: ["ES256"],
      link_in_bio_domain_names: [
        "X",
        "Instagram",
        "YouTube",
        "TikTok",
        "GitHub",
        "Telegram",
        "Discord",
        "Facebook",
        "OnlyFans",
        "WhatsApp",
        "Snapchat",
        "Twitch",
      ],
      lookup_type_enum: ["sendid", "tag", "refcode", "address", "phone"],
      tag_status: ["pending", "confirmed", "available"],
      temporal_status: [
        "initialized",
        "submitted",
        "sent",
        "confirmed",
        "failed",
      ],
      verification_type: [
        "tag_registration",
        "tag_referral",
        "create_passkey",
        "send_ten",
        "send_one_hundred",
        "total_tag_referrals",
        "send_streak",
        "send_ceiling",
      ],
      verification_value_mode: ["individual", "aggregate"],
    },
  },
  temporal: {
    Enums: {
      transfer_status: [
        "initialized",
        "submitted",
        "sent",
        "confirmed",
        "failed",
        "cancelled",
      ],
    },
  },
} as const

