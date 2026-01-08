export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
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
      bridge_customers: {
        Row: {
          bridge_customer_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          kyc_link_id: string
          kyc_status: string
          rejection_reasons: Json | null
          tos_status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bridge_customer_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          kyc_link_id: string
          kyc_status?: string
          rejection_reasons?: Json | null
          tos_status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bridge_customer_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          kyc_link_id?: string
          kyc_status?: string
          rejection_reasons?: Json | null
          tos_status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bridge_deposits: {
        Row: {
          amount: number
          bridge_transfer_id: string
          created_at: string
          currency: string
          destination_tx_hash: string | null
          event_data: Json | null
          fee_amount: number | null
          id: string
          last_event_id: string | null
          last_event_type: string | null
          net_amount: number | null
          payment_rail: string
          sender_name: string | null
          sender_routing_number: string | null
          status: string
          trace_number: string | null
          updated_at: string
          virtual_account_id: string
        }
        Insert: {
          amount: number
          bridge_transfer_id: string
          created_at?: string
          currency?: string
          destination_tx_hash?: string | null
          event_data?: Json | null
          fee_amount?: number | null
          id?: string
          last_event_id?: string | null
          last_event_type?: string | null
          net_amount?: number | null
          payment_rail: string
          sender_name?: string | null
          sender_routing_number?: string | null
          status?: string
          trace_number?: string | null
          updated_at?: string
          virtual_account_id: string
        }
        Update: {
          amount?: number
          bridge_transfer_id?: string
          created_at?: string
          currency?: string
          destination_tx_hash?: string | null
          event_data?: Json | null
          fee_amount?: number | null
          id?: string
          last_event_id?: string | null
          last_event_type?: string | null
          net_amount?: number | null
          payment_rail?: string
          sender_name?: string | null
          sender_routing_number?: string | null
          status?: string
          trace_number?: string | null
          updated_at?: string
          virtual_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridge_deposits_virtual_account_id_fkey"
            columns: ["virtual_account_id"]
            isOneToOne: false
            referencedRelation: "bridge_virtual_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      bridge_virtual_accounts: {
        Row: {
          bridge_customer_id: string
          bridge_virtual_account_id: string
          created_at: string
          destination_address: string
          destination_currency: string
          destination_payment_rail: string
          id: string
          source_currency: string
          source_deposit_instructions: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          bridge_customer_id: string
          bridge_virtual_account_id: string
          created_at?: string
          destination_address: string
          destination_currency?: string
          destination_payment_rail?: string
          id?: string
          source_currency?: string
          source_deposit_instructions?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          bridge_customer_id?: string
          bridge_virtual_account_id?: string
          created_at?: string
          destination_address?: string
          destination_currency?: string
          destination_payment_rail?: string
          id?: string
          source_currency?: string
          source_deposit_instructions?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridge_virtual_accounts_bridge_customer_id_fkey"
            columns: ["bridge_customer_id"]
            isOneToOne: false
            referencedRelation: "bridge_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bridge_virtual_accounts_bridge_customer_id_fkey"
            columns: ["bridge_customer_id"]
            isOneToOne: false
            referencedRelation: "bridge_customers_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      bridge_webhook_events: {
        Row: {
          bridge_event_id: string
          created_at: string
          error: string | null
          event_created_at: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
        }
        Insert: {
          bridge_event_id: string
          created_at?: string
          error?: string | null
          event_created_at?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
        }
        Update: {
          bridge_event_id?: string
          created_at?: string
          error?: string | null
          event_created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
        }
        Relationships: []
      }
      canton_party_verifications: {
        Row: {
          canton_wallet_address: string
          created_at: string
          id: string
          is_discoverable: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          canton_wallet_address: string
          created_at?: string
          id?: string
          is_discoverable?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          canton_wallet_address?: string
          created_at?: string
          id?: string
          is_discoverable?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      contact_label_assignments: {
        Row: {
          contact_id: number
          created_at: string
          id: number
          label_id: number
        }
        Insert: {
          contact_id: number
          created_at?: string
          id?: number
          label_id: number
        }
        Update: {
          contact_id?: number
          created_at?: string
          id?: number
          label_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "contact_label_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "contact_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_labels: {
        Row: {
          color: string | null
          created_at: string
          id: number
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: number
          name: string
          owner_id?: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: number
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          archived_at: string | null
          chain_id: string | null
          contact_user_id: string | null
          created_at: string
          custom_name: string | null
          external_address: string | null
          id: number
          is_favorite: boolean
          last_interacted_at: string | null
          normalized_external_address: string | null
          notes: string | null
          owner_id: string
          source: Database["public"]["Enums"]["contact_source_enum"]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          chain_id?: string | null
          contact_user_id?: string | null
          created_at?: string
          custom_name?: string | null
          external_address?: string | null
          id?: number
          is_favorite?: boolean
          last_interacted_at?: string | null
          normalized_external_address?: string | null
          notes?: string | null
          owner_id?: string
          source?: Database["public"]["Enums"]["contact_source_enum"]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          chain_id?: string | null
          contact_user_id?: string | null
          created_at?: string
          custom_name?: string | null
          external_address?: string | null
          id?: number
          is_favorite?: boolean
          last_interacted_at?: string | null
          normalized_external_address?: string | null
          notes?: string | null
          owner_id?: string
          source?: Database["public"]["Enums"]["contact_source_enum"]
          updated_at?: string
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
          merkle_tree: Json | null
          name: string
          number: number
          qualification_end: string
          qualification_start: string
          sendpot_ticket_increment: number | null
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
          merkle_tree?: Json | null
          name: string
          number: number
          qualification_end: string
          qualification_start: string
          sendpot_ticket_increment?: number | null
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
          merkle_tree?: Json | null
          name?: string
          number?: number
          qualification_end?: string
          qualification_start?: string
          sendpot_ticket_increment?: number | null
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
          sync_referrals_to_contacts: boolean
          verified_at: string | null
          x_username: string | null
          canton_party_verifications: {
            canton_wallet_address: string
            created_at: string
            id: string
            is_discoverable: boolean | null
            updated_at: string | null
            user_id: string
          } | null
          distribution_shares: {
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
          } | null
          links_in_bio: {
            created_at: string
            domain: string | null
            domain_name: Database["public"]["Enums"]["link_in_bio_domain_names"]
            handle: string | null
            id: number
            updated_at: string
            user_id: string
          } | null
          main_tag: {
            created_at: string
            id: number
            name: string
            status: Database["public"]["Enums"]["tag_status"]
            updated_at: string
            user_id: string | null
          } | null
          tags: {
            created_at: string
            id: number
            name: string
            status: Database["public"]["Enums"]["tag_status"]
            updated_at: string
            user_id: string | null
          } | null
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
          sync_referrals_to_contacts?: boolean
          verified_at?: string | null
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
          sync_referrals_to_contacts?: boolean
          verified_at?: string | null
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
          address_bytes: string | null
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
          address_bytes?: string | null
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
          address_bytes?: string | null
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
      send_check_claimed: {
        Row: {
          abi_idx: number | null
          amount: number | null
          block_num: number | null
          block_time: number | null
          chain_id: number | null
          ephemeral_address: string | null
          expires_at: number | null
          id: number
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          redeemer: string | null
          sender: string | null
          src_name: string | null
          token: string | null
          tx_hash: string | null
          tx_idx: number | null
        }
        Insert: {
          abi_idx?: number | null
          amount?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ephemeral_address?: string | null
          expires_at?: number | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          redeemer?: string | null
          sender?: string | null
          src_name?: string | null
          token?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
        }
        Update: {
          abi_idx?: number | null
          amount?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ephemeral_address?: string | null
          expires_at?: number | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          redeemer?: string | null
          sender?: string | null
          src_name?: string | null
          token?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
        }
        Relationships: []
      }
      send_check_created: {
        Row: {
          abi_idx: number | null
          amount: number | null
          block_num: number | null
          block_time: number | null
          chain_id: number | null
          ephemeral_address: string | null
          expires_at: number | null
          id: number
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          sender: string | null
          src_name: string | null
          token: string | null
          tx_hash: string | null
          tx_idx: number | null
        }
        Insert: {
          abi_idx?: number | null
          amount?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ephemeral_address?: string | null
          expires_at?: number | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          sender?: string | null
          src_name?: string | null
          token?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
        }
        Update: {
          abi_idx?: number | null
          amount?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ephemeral_address?: string | null
          expires_at?: number | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          sender?: string | null
          src_name?: string | null
          token?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
        }
        Relationships: []
      }
      send_check_notes: {
        Row: {
          chain_id: number
          created_at: string
          ephemeral_address: string
          note: string
        }
        Insert: {
          chain_id: number
          created_at?: string
          ephemeral_address: string
          note: string
        }
        Update: {
          chain_id?: number
          created_at?: string
          ephemeral_address?: string
          note?: string
        }
        Relationships: []
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
          send_earn_affiliate_vault: {
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
          } | null
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
      sendpot_fee_history: {
        Row: {
          block_num: number
          block_time: number
          created_at: string
          fee_bps: number
          id: number
          tx_hash: string | null
        }
        Insert: {
          block_num: number
          block_time: number
          created_at?: string
          fee_bps: number
          id?: number
          tx_hash?: string | null
        }
        Update: {
          block_num?: number
          block_time?: number
          created_at?: string
          fee_bps?: number
          id?: number
          tx_hash?: string | null
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
          tickets_purchased_count: number | null
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
          tickets_purchased_count?: number | null
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
          tickets_purchased_count?: number | null
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
          event_id: string | null
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
      bridge_customers_safe: {
        Row: {
          bridge_customer_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          kyc_link_id: string | null
          kyc_status: string | null
          rejection_reasons: Json | null
          tos_status: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bridge_customer_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          kyc_link_id?: string | null
          kyc_status?: string | null
          rejection_reasons?: never
          tos_status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bridge_customer_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          kyc_link_id?: string | null
          kyc_status?: string | null
          rejection_reasons?: never
          tos_status?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
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
      add_contact: {
        Args: {
          p_contact_user_id: string
          p_custom_name?: string
          p_is_favorite?: boolean
          p_notes?: string
          p_owner_id: string
          p_source?: Database["public"]["Enums"]["contact_source_enum"]
        }
        Returns: number
      }
      add_contact_by_lookup: {
        Args: {
          p_custom_name?: string
          p_identifier: string
          p_is_favorite?: boolean
          p_label_ids?: number[]
          p_lookup_type: Database["public"]["Enums"]["lookup_type_enum"]
          p_notes?: string
        }
        Returns: number
      }
      add_external_contact: {
        Args: {
          p_chain_id: string
          p_custom_name?: string
          p_external_address: string
          p_is_favorite?: boolean
          p_notes?: string
        }
        Returns: number
      }
      calculate_and_insert_send_ceiling_verification: {
        Args: { distribution_number: number }
        Returns: undefined
      }
      calculate_tickets_from_bps_with_fee: {
        Args: { block_num: number; bps_delta: number }
        Returns: number
      }
      can_delete_tag: {
        Args: { p_send_account_id: string; p_tag_id?: number }
        Returns: boolean
      }
      canton_party_verifications: {
        Args: { "": Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: {
          canton_wallet_address: string
          created_at: string
          id: string
          is_discoverable: boolean | null
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "profiles"
          to: "canton_party_verifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      canton_tag_search: {
        Args: { page_number?: number; page_size?: number; query: string }
        Returns: Database["public"]["CompositeTypes"]["canton_tag_search_result"][]
        SetofOptions: {
          from: "*"
          to: "canton_tag_search_result"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      canton_top_senders: {
        Args: { page_number?: number; page_size?: number }
        Returns: Database["public"]["CompositeTypes"]["canton_top_sender_result"][]
        SetofOptions: {
          from: "*"
          to: "canton_top_sender_result"
          isOneToOne: false
          isSetofReturn: true
        }
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
      contact_by_send_id: {
        Args: { p_send_id: number }
        Returns: Database["public"]["CompositeTypes"]["contact_search_result"]
        SetofOptions: {
          from: "*"
          to: "contact_search_result"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      contact_favorites: {
        Args: { p_page_number?: number; p_page_size?: number }
        Returns: Database["public"]["CompositeTypes"]["activity_feed_user"][]
        SetofOptions: {
          from: "*"
          to: "activity_feed_user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      contact_search: {
        Args: {
          p_favorites_only?: boolean
          p_include_archived?: boolean
          p_label_ids?: number[]
          p_limit_val?: number
          p_offset_val?: number
          p_query?: string
          p_sort_by_recency_only?: boolean
          p_source_filter?: Database["public"]["Enums"]["contact_source_enum"][]
        }
        Returns: Database["public"]["CompositeTypes"]["contact_search_result"][]
        SetofOptions: {
          from: "*"
          to: "contact_search_result"
          isOneToOne: false
          isSetofReturn: true
        }
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
      delete_user_account: {
        Args: { user_id_to_delete: string }
        Returns: undefined
      }
      did_user_swap: { Args: never; Returns: boolean }
      distribution_hodler_addresses: {
        Args: { distribution_id: number }
        Returns: {
          address: string
          address_bytes: string | null
          chain_id: number
          created_at: string
          deleted_at: string | null
          id: string
          init_code: string
          main_tag_id: number | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "send_accounts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      distribution_shares: {
        Args: { "": Database["public"]["Tables"]["profiles"]["Row"] }
        Returns: {
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
        }[]
        SetofOptions: {
          from: "profiles"
          to: "distribution_shares"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      favourite_senders: {
        Args: { page_number?: number; page_size?: number }
        Returns: Database["public"]["CompositeTypes"]["activity_feed_user"][]
        SetofOptions: {
          from: "*"
          to: "activity_feed_user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      generate_referral_code: { Args: never; Returns: string }
      get_affiliate_referrals: {
        Args: never
        Returns: {
          avatar_url: string
          created_at: string
          send_plus_minus: number
          tag: string
        }[]
      }
      get_affiliate_stats_summary: {
        Args: never
        Returns: {
          created_at: string
          id: string
          referral_count: number
          user_id: string
        }[]
      }
      get_check_by_ephemeral_address: {
        Args: { check_chain_id: number; check_ephemeral_address: string }
        Returns: {
          amounts: number[]
          block_num: number
          block_time: number
          chain_id: number
          claimed_at: number
          claimed_by: string
          ephemeral_address: string
          expires_at: number
          is_active: boolean
          is_canceled: boolean
          is_claimed: boolean
          is_expired: boolean
          is_potential_duplicate: boolean
          note: string
          sender: string
          tokens: string[]
          tx_hash: string
        }[]
      }
      get_fee_bps_at_block: {
        Args: { target_block_num: number }
        Returns: number
      }
      get_friends: {
        Args: never
        Returns: {
          avatar_url: string
          birthday: string
          created_at: string
          is_verified: boolean
          links_in_bio: Database["public"]["Tables"]["link_in_bio"]["Row"][]
          main_tag: string
          name: string
          sendid: number
          tag: string
          x_username: string
        }[]
      }
      get_pending_jackpot_tickets_purchased: { Args: never; Returns: number }
      get_send_scores_history: {
        Args: never
        Returns: {
          distribution_id: number
          score: number
          send_ceiling: number
          unique_sends: number
          user_id: string
        }[]
      }
      get_user_checks: {
        Args: {
          page_limit?: number
          page_offset?: number
          user_address: string
        }
        Returns: {
          amounts: number[]
          block_num: number
          block_time: number
          chain_id: number
          claimed_at: number
          claimed_by: string
          ephemeral_address: string
          expires_at: number
          is_active: boolean
          is_canceled: boolean
          is_claimed: boolean
          is_expired: boolean
          is_potential_duplicate: boolean
          is_sender: boolean
          note: string
          sender: string
          tokens: string[]
          tx_hash: string
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
          winner_tag_name: string
        }[]
      }
      insert_challenge: {
        Args: never
        Returns: {
          challenge: string
          created_at: string
          expires_at: string
          id: number
        }
        SetofOptions: {
          from: "*"
          to: "challenges"
          isOneToOne: true
          isSetofReturn: false
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
      insert_sendpot_ticket_purchase_verifications: {
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
        Args: never
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
        SetofOptions: {
          from: "profiles"
          to: "link_in_bio"
          isOneToOne: false
          isSetofReturn: true
        }
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
        SetofOptions: {
          from: "profiles"
          to: "tags"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      profile_lookup: {
        Args: {
          identifier: string
          lookup_type: Database["public"]["Enums"]["lookup_type_enum"]
        }
        Returns: Database["public"]["CompositeTypes"]["profile_lookup_result"][]
        SetofOptions: {
          from: "*"
          to: "profile_lookup_result"
          isOneToOne: false
          isSetofReturn: true
        }
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
        SetofOptions: {
          from: "*"
          to: "webauthn_credentials"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      recent_senders: {
        Args: { page_number?: number; page_size?: number }
        Returns: Database["public"]["CompositeTypes"]["activity_feed_user"][]
        SetofOptions: {
          from: "*"
          to: "activity_feed_user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      referrer_lookup: {
        Args: { referral_code?: string }
        Returns: {
          new_referrer: Database["public"]["CompositeTypes"]["profile_lookup_result"]
          referrer: Database["public"]["CompositeTypes"]["profile_lookup_result"]
        }[]
      }
      refresh_profile_verification_status: { Args: never; Returns: undefined }
      refresh_send_scores_history: { Args: never; Returns: undefined }
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
        SetofOptions: {
          from: "*"
          to: "webauthn_credentials"
          isOneToOne: true
          isSetofReturn: false
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
        }
        SetofOptions: {
          from: "send_earn_new_affiliate"
          to: "send_earn_create"
          isOneToOne: true
          isSetofReturn: true
        }
      }
      sync_contacts_from_activity: { Args: never; Returns: number }
      sync_contacts_from_referrals: { Args: never; Returns: number }
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
        SetofOptions: {
          from: "profiles"
          to: "tags"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      today_birthday_senders: {
        Args: { page_number?: number; page_size?: number }
        Returns: Database["public"]["CompositeTypes"]["activity_feed_user"][]
        SetofOptions: {
          from: "*"
          to: "activity_feed_user"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      toggle_contact_favorite: {
        Args: { p_contact_id: number }
        Returns: boolean
      }
      top_senders: {
        Args: { page_number?: number; page_size?: number }
        Returns: Database["public"]["CompositeTypes"]["activity_feed_user"][]
        SetofOptions: {
          from: "*"
          to: "activity_feed_user"
          isOneToOne: false
          isSetofReturn: true
        }
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
      user_referrals_count: { Args: never; Returns: number }
      wrapped_send_score_rank: {
        Args: never
        Returns: {
          rank: number
        }[]
      }
      wrapped_top_counterparties: {
        Args: never
        Returns: {
          avatar_url: string
          name: string
          send_id: number
          tag_name: string
        }[]
      }
      wrapped_total_transfers: {
        Args: never
        Returns: {
          count: number
        }[]
      }
      wrapped_unique_recipients: {
        Args: never
        Returns: {
          count: number
        }[]
      }
    }
    Enums: {
      contact_source_enum: "activity" | "manual" | "external" | "referral"
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
        | "sendpot_ticket_purchase"
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
        is_verified: boolean | null
      }
      canton_tag_search_result: {
        avatar_url: string | null
        name: string | null
        send_id: number | null
        main_tag_name: string | null
        matched_tag_name: string | null
        tags: string[] | null
        canton_wallet_address: string | null
      }
      canton_top_sender_result: {
        avatar_url: string | null
        name: string | null
        send_id: number | null
        main_tag_name: string | null
        tags: string[] | null
        canton_wallet_address: string | null
      }
      contact_search_result: {
        contact_id: number | null
        owner_id: string | null
        custom_name: string | null
        notes: string | null
        is_favorite: boolean | null
        source: Database["public"]["Enums"]["contact_source_enum"] | null
        last_interacted_at: string | null
        created_at: string | null
        updated_at: string | null
        archived_at: string | null
        external_address: string | null
        chain_id: string | null
        profile_name: string | null
        avatar_url: string | null
        send_id: number | null
        main_tag_id: number | null
        main_tag_name: string | null
        tags: string[] | null
        is_verified: boolean | null
        label_ids: number[] | null
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
        is_verified: boolean | null
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          format: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          format?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          level: number | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          level?: number | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      prefixes: {
        Row: {
          bucket_id: string
          created_at: string | null
          level: number
          name: string
          updated_at: string | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          level?: number
          name: string
          updated_at?: string | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          level?: number
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prefixes_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_prefixes: {
        Args: { _bucket_id: string; _name: string }
        Returns: undefined
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      delete_prefix: {
        Args: { _bucket_id: string; _name: string }
        Returns: boolean
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          start_after?: string
        }
        Returns: {
          id: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      lock_top_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v1_optimised: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS"
    }
    CompositeTypes: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      contact_source_enum: ["activity", "manual", "external", "referral"],
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
        "sendpot_ticket_purchase",
      ],
      verification_value_mode: ["individual", "aggregate"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS"],
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

