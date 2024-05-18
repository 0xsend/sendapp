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
          type: Database["public"]["Enums"]["verification_type"]
          updated_at: string
        }
        Insert: {
          bips_value: number
          created_at?: string
          distribution_id: number
          fixed_value: number
          type: Database["public"]["Enums"]["verification_type"]
          updated_at?: string
        }
        Update: {
          bips_value?: number
          created_at?: string
          distribution_id?: number
          fixed_value?: number
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
        }
        Insert: {
          created_at?: string
          distribution_id: number
          id?: number
          metadata?: Json | null
          type: Database["public"]["Enums"]["verification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          distribution_id?: number
          id?: number
          metadata?: Json | null
          type?: Database["public"]["Enums"]["verification_type"]
          user_id?: string
        }
        Relationships: [
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
          name: string
          number: number
          qualification_end: string
          qualification_start: string
          snapshot_block_num: number | null
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
          name: string
          number: number
          qualification_end: string
          qualification_start: string
          snapshot_block_num?: number | null
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
          name?: string
          number?: number
          qualification_end?: string
          qualification_start?: string
          snapshot_block_num?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          about: string | null
          avatar_url: string | null
          id: string
          is_public: boolean | null
          name: string | null
          referral_code: string | null
          send_id: number
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          id: string
          is_public?: boolean | null
          name?: string | null
          referral_code?: string | null
          send_id?: number
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          referral_code?: string | null
          send_id?: number
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
          hash: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          hash: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          hash?: string
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
          id: number
          referred_id: string
          referrer_id: string
          tag: string
        }
        Insert: {
          id?: number
          referred_id: string
          referrer_id: string
          tag: string
        }
        Update: {
          id?: number
          referred_id?: string
          referrer_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
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
          account: string | null
          block_num: number | null
          block_time: number | null
          chain_id: number | null
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          src_name: string | null
          tx_hash: string | null
          tx_idx: number | null
          user_op_hash: string | null
        }
        Insert: {
          account?: string | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
          user_op_hash?: string | null
        }
        Update: {
          account?: string | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
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
      send_account_signing_key_added: {
        Row: {
          abi_idx: number
          account: string
          block_num: number
          block_time: number
          chain_id: number
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
          abi_idx: number | null
          account: string | null
          block_num: number | null
          block_time: number | null
          chain_id: number | null
          ig_name: string | null
          key: string | null
          key_slot: number | null
          log_addr: string | null
          log_idx: number | null
          src_name: string | null
          tx_hash: string | null
          tx_idx: number | null
        }
        Insert: {
          abi_idx?: number | null
          account?: string | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ig_name?: string | null
          key?: string | null
          key_slot?: number | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
        }
        Update: {
          abi_idx?: number | null
          account?: string | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ig_name?: string | null
          key?: string | null
          key_slot?: number | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
        }
        Relationships: []
      }
      send_account_transfers: {
        Row: {
          abi_idx: number | null
          block_num: number | null
          block_time: number | null
          chain_id: number | null
          f: string | null
          id: number
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          src_name: string | null
          t: string | null
          tx_hash: string | null
          tx_idx: number | null
          v: number | null
        }
        Insert: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          f?: string | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          t?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
          v?: number | null
        }
        Update: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          f?: string | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          t?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
          v?: number | null
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
      send_revenues_safe_receives: {
        Row: {
          abi_idx: number | null
          block_num: number | null
          block_time: number | null
          chain_id: number | null
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          sender: string | null
          src_name: string | null
          tx_hash: string | null
          tx_idx: number | null
          v: number | null
        }
        Insert: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          sender?: string | null
          src_name?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
          v?: number | null
        }
        Update: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          sender?: string | null
          src_name?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
          v?: number | null
        }
        Relationships: []
      }
      send_token_transfers: {
        Row: {
          abi_idx: number | null
          block_num: number | null
          block_time: number | null
          chain_id: number | null
          f: string | null
          id: number
          ig_name: string | null
          log_addr: string | null
          log_idx: number | null
          src_name: string | null
          t: string | null
          tx_hash: string | null
          tx_idx: number | null
          v: number | null
        }
        Insert: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          f?: string | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          t?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
          v?: number | null
        }
        Update: {
          abi_idx?: number | null
          block_num?: number | null
          block_time?: number | null
          chain_id?: number | null
          f?: string | null
          id?: number
          ig_name?: string | null
          log_addr?: string | null
          log_idx?: number | null
          src_name?: string | null
          t?: string | null
          tx_hash?: string | null
          tx_idx?: number | null
          v?: number | null
        }
        Relationships: []
      }
      send_transfer_logs: {
        Row: {
          block_hash: string
          block_number: number
          block_timestamp: string
          created_at: string | null
          from: string
          log_index: number
          to: string
          tx_hash: string
          value: number
        }
        Insert: {
          block_hash: string
          block_number: number
          block_timestamp: string
          created_at?: string | null
          from: string
          log_index: number
          to: string
          tx_hash: string
          value: number
        }
        Update: {
          block_hash?: string
          block_number?: number
          block_timestamp?: string
          created_at?: string | null
          from?: string
          log_index?: number
          to?: string
          tx_hash?: string
          value?: number
        }
        Relationships: []
      }
      tag_receipts: {
        Row: {
          hash: string
          tag_name: string
        }
        Insert: {
          hash: string
          tag_name: string
        }
        Update: {
          hash?: string
          tag_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_receipts_hash_fkey"
            columns: ["hash"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["hash"]
          },
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
      distribution_verifications_summary: {
        Row: {
          distribution_id: number | null
          tag_referrals: number | null
          tag_registrations: number | null
          user_id: string | null
        }
        Relationships: [
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
    }
    Functions: {
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
          receipt_hash: string
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
          created_at: string
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
      insert_send_transfer_logs: {
        Args: {
          _send_transfer_logs: unknown[]
        }
        Returns: undefined
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
          tag: string
          address: string
          phone: string
          chain_id: number
          is_public: boolean
          sendid: number
          all_tags: string[]
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
      verification_type: "tag_registration" | "tag_referral"
    }
    CompositeTypes: {
      tag_search_result: {
        avatar_url: string
        tag_name: string
        send_id: number
        phone: string
      }
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

