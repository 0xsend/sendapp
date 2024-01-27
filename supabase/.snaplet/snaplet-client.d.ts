type ScalarField = {
  name: string;
  type: string;
};
type ObjectField = ScalarField & {
  relationFromFields: string[];
  relationToFields: string[];
};
type Inflection = {
  modelName?: (name: string) => string;
  scalarField?: (field: ScalarField) => string;
  parentField?: (field: ObjectField, oppositeBaseNameMap: Record<string, string>) => string;
  childField?: (field: ObjectField, oppositeField: ObjectField, oppositeBaseNameMap: Record<string, string>) => string;
  oppositeBaseNameMap?: Record<string, string>;
};
type Override = {
  _http_response?: {
    name?: string;
    fields?: {
      id?: string;
      status_code?: string;
      content_type?: string;
      headers?: string;
      content?: string;
      timed_out?: string;
      error_msg?: string;
      created?: string;
    };
  }
  buckets?: {
    name?: string;
    fields?: {
      id?: string;
      name?: string;
      owner?: string;
      created_at?: string;
      updated_at?: string;
      public?: string;
      avif_autodetection?: string;
      file_size_limit?: string;
      allowed_mime_types?: string;
      owner_id?: string;
      objects?: string;
    };
  }
  chain_addresses?: {
    name?: string;
    fields?: {
      address?: string;
      user_id?: string;
      created_at?: string;
      users?: string;
    };
  }
  distribution_shares?: {
    name?: string;
    fields?: {
      id?: string;
      distribution_id?: string;
      user_id?: string;
      address?: string;
      amount?: string;
      hodler_pool_amount?: string;
      bonus_pool_amount?: string;
      fixed_pool_amount?: string;
      created_at?: string;
      updated_at?: string;
      index?: string;
      users?: string;
      distributions?: string;
    };
  }
  distribution_verification_values?: {
    name?: string;
    fields?: {
      type?: string;
      fixed_value?: string;
      bips_value?: string;
      distribution_id?: string;
      created_at?: string;
      updated_at?: string;
      distributions?: string;
    };
  }
  distribution_verifications?: {
    name?: string;
    fields?: {
      id?: string;
      distribution_id?: string;
      user_id?: string;
      type?: string;
      metadata?: string;
      created_at?: string;
      users?: string;
      distributions?: string;
    };
  }
  distributions?: {
    name?: string;
    fields?: {
      id?: string;
      number?: string;
      amount?: string;
      hodler_pool_bips?: string;
      bonus_pool_bips?: string;
      fixed_pool_bips?: string;
      name?: string;
      description?: string;
      qualification_start?: string;
      qualification_end?: string;
      claim_end?: string;
      snapshot_id?: string;
      hodler_min_balance?: string;
      created_at?: string;
      updated_at?: string;
      distribution_shares?: string;
      distribution_verification_values?: string;
      distribution_verifications?: string;
    };
  }
  hooks?: {
    name?: string;
    fields?: {
      id?: string;
      hook_table_id?: string;
      hook_name?: string;
      created_at?: string;
      request_id?: string;
    };
  }
  http_request_queue?: {
    name?: string;
    fields?: {
      id?: string;
      method?: string;
      url?: string;
      headers?: string;
      body?: string;
      timeout_milliseconds?: string;
    };
  }
  storage_migrations?: {
    name?: string;
    fields?: {
      id?: string;
      name?: string;
      hash?: string;
      executed_at?: string;
    };
  }
  supabase_functions_migrations?: {
    name?: string;
    fields?: {
      version?: string;
      inserted_at?: string;
    };
  }
  objects?: {
    name?: string;
    fields?: {
      id?: string;
      bucket_id?: string;
      name?: string;
      owner?: string;
      created_at?: string;
      updated_at?: string;
      last_accessed_at?: string;
      metadata?: string;
      path_tokens?: string;
      version?: string;
      owner_id?: string;
      buckets?: string;
    };
  }
  profiles?: {
    name?: string;
    fields?: {
      id?: string;
      avatar_url?: string;
      name?: string;
      about?: string;
      referral_code?: string;
      is_public?: string;
      users?: string;
      referrals_referrals_referred_idToprofiles?: string;
      referrals_referrals_referrer_idToprofiles?: string;
    };
  }
  receipts?: {
    name?: string;
    fields?: {
      hash?: string;
      created_at?: string;
      user_id?: string;
      users?: string;
      tag_receipts?: string;
    };
  }
  referrals?: {
    name?: string;
    fields?: {
      referrer_id?: string;
      referred_id?: string;
      tag?: string;
      id?: string;
      profiles_referrals_referred_idToprofiles?: string;
      profiles_referrals_referrer_idToprofiles?: string;
      tags?: string;
    };
  }
  auth_schema_migrations?: {
    name?: string;
    fields?: {
      version?: string;
    };
  }
  supabase_migrations_schema_migrations?: {
    name?: string;
    fields?: {
      version?: string;
      statements?: string;
      name?: string;
    };
  }
  send_account_credentials?: {
    name?: string;
    fields?: {
      account_id?: string;
      credential_id?: string;
      key_slot?: string;
      created_at?: string;
      send_accounts?: string;
      webauthn_credentials?: string;
    };
  }
  send_accounts?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      address?: string;
      chain_id?: string;
      init_code?: string;
      created_at?: string;
      updated_at?: string;
      deleted_at?: string;
      users?: string;
      send_account_credentials?: string;
    };
  }
  send_transfer_logs?: {
    name?: string;
    fields?: {
      from?: string;
      to?: string;
      value?: string;
      block_number?: string;
      block_timestamp?: string;
      block_hash?: string;
      tx_hash?: string;
      log_index?: string;
      created_at?: string;
    };
  }
  tag_receipts?: {
    name?: string;
    fields?: {
      tag_name?: string;
      hash?: string;
      receipts?: string;
      tags?: string;
    };
  }
  tag_reservations?: {
    name?: string;
    fields?: {
      tag_name?: string;
      chain_address?: string;
      created_at?: string;
    };
  }
  tags?: {
    name?: string;
    fields?: {
      name?: string;
      status?: string;
      user_id?: string;
      created_at?: string;
      users?: string;
      referrals?: string;
      tag_receipts?: string;
    };
  }
  users?: {
    name?: string;
    fields?: {
      instance_id?: string;
      id?: string;
      aud?: string;
      role?: string;
      email?: string;
      encrypted_password?: string;
      email_confirmed_at?: string;
      invited_at?: string;
      confirmation_token?: string;
      confirmation_sent_at?: string;
      recovery_token?: string;
      recovery_sent_at?: string;
      email_change_token_new?: string;
      email_change?: string;
      email_change_sent_at?: string;
      last_sign_in_at?: string;
      raw_app_meta_data?: string;
      raw_user_meta_data?: string;
      is_super_admin?: string;
      created_at?: string;
      updated_at?: string;
      phone?: string;
      phone_confirmed_at?: string;
      phone_change?: string;
      phone_change_token?: string;
      phone_change_sent_at?: string;
      confirmed_at?: string;
      email_change_token_current?: string;
      email_change_confirm_status?: string;
      banned_until?: string;
      reauthentication_token?: string;
      reauthentication_sent_at?: string;
      is_sso_user?: string;
      deleted_at?: string;
      chain_addresses?: string;
      distribution_shares?: string;
      distribution_verifications?: string;
      profiles?: string;
      receipts?: string;
      send_accounts?: string;
      tags?: string;
      webauthn_credentials?: string;
    };
  }
  webauthn_credentials?: {
    name?: string;
    fields?: {
      id?: string;
      name?: string;
      display_name?: string;
      raw_credential_id?: string;
      user_id?: string;
      public_key?: string;
      key_type?: string;
      sign_count?: string;
      attestation_object?: string;
      created_at?: string;
      updated_at?: string;
      deleted_at?: string;
      users?: string;
      send_account_credentials?: string;
    };
  }}
export type Alias = {
  inflection?: Inflection | boolean;
  override?: Override;
};
interface BlueprintRelationField {
  count?: number | MinMaxOption;
}
interface BlueprintJsonField {
  schema?: any;
}
interface BlueprintDateField {
  options?: {
    minYear?: number;
    maxYear?: number;
  }
}
export interface Blueprint {
  _http_response?: {
    headers?: BlueprintJsonField;
  }
  buckets?: {
    objects?: BlueprintRelationField;
  }
  chain_addresses?: {
    users?: BlueprintRelationField;
  }
  distribution_shares?: {
    users?: BlueprintRelationField;
    distributions?: BlueprintRelationField;
  }
  distribution_verification_values?: {
    distributions?: BlueprintRelationField;
  }
  distribution_verifications?: {
    metadata?: BlueprintJsonField;
    users?: BlueprintRelationField;
    distributions?: BlueprintRelationField;
  }
  distributions?: {
    distribution_shares?: BlueprintRelationField;
    distribution_verification_values?: BlueprintRelationField;
    distribution_verifications?: BlueprintRelationField;
  }
  hooks?: {

  }
  http_request_queue?: {
    headers?: BlueprintJsonField;
  }
  storage_migrations?: {

  }
  supabase_functions_migrations?: {

  }
  objects?: {
    metadata?: BlueprintJsonField;
    buckets?: BlueprintRelationField;
  }
  profiles?: {
    users?: BlueprintRelationField;
    referrals_referrals_referred_idToprofiles?: BlueprintRelationField;
    referrals_referrals_referrer_idToprofiles?: BlueprintRelationField;
  }
  receipts?: {
    users?: BlueprintRelationField;
    tag_receipts?: BlueprintRelationField;
  }
  referrals?: {
    profiles_referrals_referred_idToprofiles?: BlueprintRelationField;
    profiles_referrals_referrer_idToprofiles?: BlueprintRelationField;
    tags?: BlueprintRelationField;
  }
  auth_schema_migrations?: {

  }
  supabase_migrations_schema_migrations?: {

  }
  send_account_credentials?: {
    send_accounts?: BlueprintRelationField;
    webauthn_credentials?: BlueprintRelationField;
  }
  send_accounts?: {
    users?: BlueprintRelationField;
    send_account_credentials?: BlueprintRelationField;
  }
  send_transfer_logs?: {

  }
  tag_receipts?: {
    receipts?: BlueprintRelationField;
    tags?: BlueprintRelationField;
  }
  tag_reservations?: {

  }
  tags?: {
    users?: BlueprintRelationField;
    referrals?: BlueprintRelationField;
    tag_receipts?: BlueprintRelationField;
  }
  users?: {
    raw_app_meta_data?: BlueprintJsonField;
    raw_user_meta_data?: BlueprintJsonField;
    chain_addresses?: BlueprintRelationField;
    distribution_shares?: BlueprintRelationField;
    distribution_verifications?: BlueprintRelationField;
    profiles?: BlueprintRelationField;
    receipts?: BlueprintRelationField;
    send_accounts?: BlueprintRelationField;
    tags?: BlueprintRelationField;
    webauthn_credentials?: BlueprintRelationField;
  }
  webauthn_credentials?: {
    users?: BlueprintRelationField;
    send_account_credentials?: BlueprintRelationField;
  }}