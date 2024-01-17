export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_shares_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_verifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      distributions: {
        Row: {
          amount: number
          bonus_pool_bips: number
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
          snapshot_id: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          bonus_pool_bips: number
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
          snapshot_id?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          bonus_pool_bips?: number
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
          snapshot_id?: number | null
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
        }
        Insert: {
          about?: string | null
          avatar_url?: string | null
          id: string
          is_public?: boolean | null
          name?: string | null
          referral_code?: string | null
        }
        Update: {
          about?: string | null
          avatar_url?: string | null
          id?: string
          is_public?: boolean | null
          name?: string | null
          referral_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_tag_fkey"
            columns: ["tag"]
            referencedRelation: "tags"
            referencedColumns: ["name"]
          }
        ]
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
            referencedRelation: "send_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "account_credentials_credential_id_fkey"
            columns: ["credential_id"]
            referencedRelation: "webauthn_credentials"
            referencedColumns: ["id"]
          }
        ]
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
            referencedRelation: "receipts"
            referencedColumns: ["hash"]
          },
          {
            foreignKeyName: "tag_receipts_tag_name_fkey"
            columns: ["tag_name"]
            referencedRelation: "tags"
            referencedColumns: ["name"]
          }
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_verifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      citext:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": boolean
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
      tag_search: {
        Args: {
          query: string
        }
        Returns: {
          avatar_url: string
          tag_name: string
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
      tag_status: "pending" | "confirmed"
      verification_type: "tag_registration" | "tag_referral"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

