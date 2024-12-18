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
  activity?: {
    name?: string;
    fields?: {
      id?: string;
      event_name?: string;
      event_id?: string;
      from_user_id?: string;
      to_user_id?: string;
      data?: string;
      created_at?: string;
      users_activity_from_user_idTousers?: string;
      users_activity_to_user_idTousers?: string;
    };
  }
  affiliate_stats?: {
    name?: string;
    fields?: {
      paymaster_tx_count?: string;
      user_id?: string;
      id?: string;
      created_at?: string;
      updated_at?: string;
      profiles?: string;
    };
  }
  audit_log_entries?: {
    name?: string;
    fields?: {
      instance_id?: string;
      id?: string;
      payload?: string;
      created_at?: string;
      ip_address?: string;
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
      s3_multipart_uploads?: string;
      s3_multipart_uploads_parts?: string;
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
  challenges?: {
    name?: string;
    fields?: {
      id?: string;
      challenge?: string;
      created_at?: string;
      expires_at?: string;
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
      multiplier_min?: string;
      multiplier_max?: string;
      multiplier_step?: string;
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
      weight?: string;
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
      hodler_min_balance?: string;
      created_at?: string;
      updated_at?: string;
      snapshot_block_num?: string;
      chain_id?: string;
      distribution_shares?: string;
      distribution_verification_values?: string;
      distribution_verifications?: string;
    };
  }
  feature_info?: {
    name?: string;
    fields?: {
      feature?: string;
      schema_name?: string;
      proname?: string;
      obj_identity?: string;
    };
  }
  flow_state?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      auth_code?: string;
      code_challenge_method?: string;
      code_challenge?: string;
      provider_type?: string;
      provider_access_token?: string;
      provider_refresh_token?: string;
      created_at?: string;
      updated_at?: string;
      authentication_method?: string;
      auth_code_issued_at?: string;
      saml_relay_states?: string;
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
  identities?: {
    name?: string;
    fields?: {
      provider_id?: string;
      user_id?: string;
      identity_data?: string;
      provider?: string;
      last_sign_in_at?: string;
      created_at?: string;
      updated_at?: string;
      email?: string;
      id?: string;
      users?: string;
    };
  }
  ig_updates?: {
    name?: string;
    fields?: {
      name?: string;
      src_name?: string;
      backfill?: string;
      num?: string;
      latency?: string;
      nrows?: string;
      stop?: string;
    };
  }
  instances?: {
    name?: string;
    fields?: {
      id?: string;
      uuid?: string;
      raw_base_config?: string;
      created_at?: string;
      updated_at?: string;
    };
  }
  integrations?: {
    name?: string;
    fields?: {
      name?: string;
      conf?: string;
    };
  }
  key?: {
    name?: string;
    fields?: {
      id?: string;
      status?: string;
      created?: string;
      expires?: string;
      key_type?: string;
      key_id?: string;
      key_context?: string;
      name?: string;
      associated_data?: string;
      raw_key?: string;
      raw_key_nonce?: string;
      parent_key?: string;
      comment?: string;
      user_data?: string;
      key?: string;
      key?: string;
      secrets?: string;
    };
  }
  leaderboard_referrals_all_time?: {
    name?: string;
    fields?: {
      user_id?: string;
      referrals?: string;
      rewards_usdc?: string;
      updated_at?: string;
      users?: string;
    };
  }
  messages?: {
    name?: string;
    fields?: {
      id?: string;
      topic?: string;
      extension?: string;
      inserted_at?: string;
      updated_at?: string;
    };
  }
  mfa_amr_claims?: {
    name?: string;
    fields?: {
      session_id?: string;
      created_at?: string;
      updated_at?: string;
      authentication_method?: string;
      id?: string;
      sessions?: string;
    };
  }
  mfa_challenges?: {
    name?: string;
    fields?: {
      id?: string;
      factor_id?: string;
      created_at?: string;
      verified_at?: string;
      ip_address?: string;
      otp_code?: string;
      web_authn_session_data?: string;
      mfa_factors?: string;
    };
  }
  mfa_factors?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      friendly_name?: string;
      factor_type?: string;
      status?: string;
      created_at?: string;
      updated_at?: string;
      secret?: string;
      phone?: string;
      last_challenged_at?: string;
      web_authn_credential?: string;
      web_authn_aaguid?: string;
      users?: string;
      mfa_challenges?: string;
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
      user_metadata?: string;
      buckets?: string;
    };
  }
  one_time_tokens?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      token_type?: string;
      token_hash?: string;
      relates_to?: string;
      created_at?: string;
      updated_at?: string;
      users?: string;
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
      send_id?: string;
      users?: string;
      affiliate_stats?: string;
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
      id?: string;
      event_id?: string;
      users?: string;
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
  refresh_tokens?: {
    name?: string;
    fields?: {
      instance_id?: string;
      id?: string;
      token?: string;
      user_id?: string;
      revoked?: string;
      created_at?: string;
      updated_at?: string;
      parent?: string;
      session_id?: string;
      sessions?: string;
    };
  }
  s3_multipart_uploads?: {
    name?: string;
    fields?: {
      id?: string;
      in_progress_size?: string;
      upload_signature?: string;
      bucket_id?: string;
      key?: string;
      version?: string;
      owner_id?: string;
      created_at?: string;
      user_metadata?: string;
      buckets?: string;
      s3_multipart_uploads_parts?: string;
    };
  }
  s3_multipart_uploads_parts?: {
    name?: string;
    fields?: {
      id?: string;
      upload_id?: string;
      size?: string;
      part_number?: string;
      bucket_id?: string;
      key?: string;
      etag?: string;
      owner_id?: string;
      version?: string;
      created_at?: string;
      buckets?: string;
      s3_multipart_uploads?: string;
    };
  }
  saml_providers?: {
    name?: string;
    fields?: {
      id?: string;
      sso_provider_id?: string;
      entity_id?: string;
      metadata_xml?: string;
      metadata_url?: string;
      attribute_mapping?: string;
      created_at?: string;
      updated_at?: string;
      name_id_format?: string;
      sso_providers?: string;
    };
  }
  saml_relay_states?: {
    name?: string;
    fields?: {
      id?: string;
      sso_provider_id?: string;
      request_id?: string;
      for_email?: string;
      redirect_to?: string;
      created_at?: string;
      updated_at?: string;
      flow_state_id?: string;
      flow_state?: string;
      sso_providers?: string;
    };
  }
  auth_schema_migrations?: {
    name?: string;
    fields?: {
      version?: string;
    };
  }
  realtime_schema_migrations?: {
    name?: string;
    fields?: {
      version?: string;
      inserted_at?: string;
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
  secrets?: {
    name?: string;
    fields?: {
      id?: string;
      name?: string;
      description?: string;
      secret?: string;
      key_id?: string;
      nonce?: string;
      created_at?: string;
      updated_at?: string;
      key?: string;
    };
  }
  seed_files?: {
    name?: string;
    fields?: {
      path?: string;
      hash?: string;
    };
  }
  send_account_created?: {
    name?: string;
    fields?: {
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      user_op_hash?: string;
      tx_hash?: string;
      account?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      id?: string;
      event_id?: string;
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
  send_account_receives?: {
    name?: string;
    fields?: {
      id?: string;
      event_id?: string;
      chain_id?: string;
      block_num?: string;
      block_time?: string;
      tx_hash?: string;
      tx_idx?: string;
      log_idx?: string;
      log_addr?: string;
      sender?: string;
      value?: string;
      ig_name?: string;
      src_name?: string;
      abi_idx?: string;
    };
  }
  send_account_signing_key_added?: {
    name?: string;
    fields?: {
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      account?: string;
      key_slot?: string;
      key?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      id?: string;
      event_id?: string;
    };
  }
  send_account_signing_key_removed?: {
    name?: string;
    fields?: {
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      account?: string;
      key_slot?: string;
      key?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      id?: string;
      event_id?: string;
    };
  }
  send_account_transfers?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      f?: string;
      t?: string;
      v?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      event_id?: string;
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
  send_liquidity_pools?: {
    name?: string;
    fields?: {
      id?: string;
      address?: string;
      chain_id?: string;
    };
  }
  send_revenues_safe_receives?: {
    name?: string;
    fields?: {
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      sender?: string;
      v?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      id?: string;
      event_id?: string;
    };
  }
  send_token_transfers?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      f?: string;
      t?: string;
      v?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      event_id?: string;
    };
  }
  sendtag_checkout_receipts?: {
    name?: string;
    fields?: {
      id?: string;
      event_id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      sender?: string;
      amount?: string;
      referrer?: string;
      reward?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
    };
  }
  sessions?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      created_at?: string;
      updated_at?: string;
      factor_id?: string;
      aal?: string;
      not_after?: string;
      refreshed_at?: string;
      user_agent?: string;
      ip?: string;
      tag?: string;
      users?: string;
      mfa_amr_claims?: string;
      refresh_tokens?: string;
    };
  }
  sources?: {
    name?: string;
    fields?: {
      name?: string;
      chain_id?: string;
      url?: string;
    };
  }
  sso_domains?: {
    name?: string;
    fields?: {
      id?: string;
      sso_provider_id?: string;
      domain?: string;
      created_at?: string;
      updated_at?: string;
      sso_providers?: string;
    };
  }
  sso_providers?: {
    name?: string;
    fields?: {
      id?: string;
      resource_id?: string;
      created_at?: string;
      updated_at?: string;
      saml_providers?: string;
      saml_relay_states?: string;
      sso_domains?: string;
    };
  }
  subscription?: {
    name?: string;
    fields?: {
      id?: string;
      subscription_id?: string;
      entity?: string;
      filters?: string;
      claims?: string;
      claims_role?: string;
      created_at?: string;
    };
  }
  tag_receipts?: {
    name?: string;
    fields?: {
      tag_name?: string;
      hash?: string;
      event_id?: string;
      id?: string;
      created_at?: string;
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
  task_updates?: {
    name?: string;
    fields?: {
      num?: string;
      hash?: string;
      insert_at?: string;
      src_hash?: string;
      src_num?: string;
      nblocks?: string;
      nrows?: string;
      latency?: string;
      src_name?: string;
      stop?: string;
      chain_id?: string;
      ig_name?: string;
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
      is_anonymous?: string;
      identities?: string;
      mfa_factors?: string;
      one_time_tokens?: string;
      sessions?: string;
      leaderboard_referrals_all_time?: string;
      activity_activity_from_user_idTousers?: string;
      activity_activity_to_user_idTousers?: string;
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
interface FingerprintRelationField {
  count?: number | MinMaxOption;
}
interface FingerprintJsonField {
  schema?: any;
}
interface FingerprintDateField {
  options?: {
    minYear?: number;
    maxYear?: number;
  }
}
interface FingerprintNumberField {
  options?: {
    min?: number;
    max?: number;
  }
}
export interface Fingerprint {
  HttpResponses?: {
    id?: FingerprintNumberField;
    statusCode?: FingerprintNumberField;
    headers?: FingerprintJsonField;
    created?: FingerprintDateField;
  }
  activities?: {
    id?: FingerprintNumberField;
    data?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
    fromUser?: FingerprintRelationField;
    toUser?: FingerprintRelationField;
  }
  affiliateStats?: {
    paymasterTxCount?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  auditLogEntries?: {
    payload?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
  }
  buckets?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    fileSizeLimit?: FingerprintNumberField;
    objects?: FingerprintRelationField;
    s3MultipartUploads?: FingerprintRelationField;
    s3MultipartUploadsParts?: FingerprintRelationField;
  }
  chainAddresses?: {
    createdAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  challenges?: {
    id?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    expiresAt?: FingerprintDateField;
  }
  distributionShares?: {
    id?: FingerprintNumberField;
    distributionId?: FingerprintNumberField;
    amount?: FingerprintNumberField;
    hodlerPoolAmount?: FingerprintNumberField;
    bonusPoolAmount?: FingerprintNumberField;
    fixedPoolAmount?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    index?: FingerprintNumberField;
    user?: FingerprintRelationField;
    distribution?: FingerprintRelationField;
  }
  distributionVerificationValues?: {
    fixedValue?: FingerprintNumberField;
    bipsValue?: FingerprintNumberField;
    distributionId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    multiplierMin?: FingerprintNumberField;
    multiplierMax?: FingerprintNumberField;
    multiplierStep?: FingerprintNumberField;
    distribution?: FingerprintRelationField;
  }
  distributionVerifications?: {
    id?: FingerprintNumberField;
    distributionId?: FingerprintNumberField;
    metadata?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
    weight?: FingerprintNumberField;
    user?: FingerprintRelationField;
    distribution?: FingerprintRelationField;
  }
  distributions?: {
    id?: FingerprintNumberField;
    number?: FingerprintNumberField;
    amount?: FingerprintNumberField;
    hodlerPoolBips?: FingerprintNumberField;
    bonusPoolBips?: FingerprintNumberField;
    fixedPoolBips?: FingerprintNumberField;
    qualificationStart?: FingerprintDateField;
    qualificationEnd?: FingerprintDateField;
    claimEnd?: FingerprintDateField;
    hodlerMinBalance?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    snapshotBlockNum?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    distributionShares?: FingerprintRelationField;
    distributionVerificationValues?: FingerprintRelationField;
    distributionVerifications?: FingerprintRelationField;
  }
  featureInfos?: {

  }
  flowStates?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    authCodeIssuedAt?: FingerprintDateField;
    samlRelayStates?: FingerprintRelationField;
  }
  hooks?: {
    id?: FingerprintNumberField;
    hookTableId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    requestId?: FingerprintNumberField;
  }
  httpRequestQueues?: {
    id?: FingerprintNumberField;
    headers?: FingerprintJsonField;
    timeoutMilliseconds?: FingerprintNumberField;
  }
  identities?: {
    identityData?: FingerprintJsonField;
    lastSignInAt?: FingerprintDateField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  igUpdates?: {
    num?: FingerprintNumberField;
    nrows?: FingerprintNumberField;
    stop?: FingerprintNumberField;
  }
  instances?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
  }
  integrations?: {
    conf?: FingerprintJsonField;
  }
  keys?: {
    created?: FingerprintDateField;
    expires?: FingerprintDateField;
    keyId?: FingerprintNumberField;
    keysByParentKey?: FingerprintRelationField;
    keysByParentKey?: FingerprintRelationField;
    secrets?: FingerprintRelationField;
  }
  leaderboardReferralsAllTimes?: {
    referrals?: FingerprintNumberField;
    rewardsUsdc?: FingerprintNumberField;
    updatedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  messages?: {
    id?: FingerprintNumberField;
    insertedAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
  }
  mfaAmrClaims?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    session?: FingerprintRelationField;
  }
  mfaChallenges?: {
    createdAt?: FingerprintDateField;
    verifiedAt?: FingerprintDateField;
    webAuthnSessionData?: FingerprintJsonField;
    factor?: FingerprintRelationField;
  }
  mfaFactors?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    lastChallengedAt?: FingerprintDateField;
    webAuthnCredential?: FingerprintJsonField;
    user?: FingerprintRelationField;
    mfaChallengesByFactorId?: FingerprintRelationField;
  }
  storageMigrations?: {
    id?: FingerprintNumberField;
    executedAt?: FingerprintDateField;
  }
  supabaseFunctionsMigrations?: {
    insertedAt?: FingerprintDateField;
  }
  objects?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    lastAccessedAt?: FingerprintDateField;
    metadata?: FingerprintJsonField;
    userMetadata?: FingerprintJsonField;
    bucket?: FingerprintRelationField;
  }
  oneTimeTokens?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  profiles?: {
    sendId?: FingerprintNumberField;
    i?: FingerprintRelationField;
    affiliateStatsByUserId?: FingerprintRelationField;
    referralsByReferredId?: FingerprintRelationField;
    referralsByReferrerId?: FingerprintRelationField;
  }
  receipts?: {
    createdAt?: FingerprintDateField;
    id?: FingerprintNumberField;
    user?: FingerprintRelationField;
  }
  referrals?: {
    id?: FingerprintNumberField;
    referred?: FingerprintRelationField;
    referrer?: FingerprintRelationField;
    tagByTag?: FingerprintRelationField;
  }
  refreshTokens?: {
    id?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    session?: FingerprintRelationField;
  }
  s3MultipartUploads?: {
    inProgressSize?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    userMetadata?: FingerprintJsonField;
    bucket?: FingerprintRelationField;
    s3MultipartUploadsPartsByUploadId?: FingerprintRelationField;
  }
  s3MultipartUploadsParts?: {
    size?: FingerprintNumberField;
    partNumber?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    bucket?: FingerprintRelationField;
    upload?: FingerprintRelationField;
  }
  samlProviders?: {
    attributeMapping?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    ssoProvider?: FingerprintRelationField;
  }
  samlRelayStates?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    flowState?: FingerprintRelationField;
    ssoProvider?: FingerprintRelationField;
  }
  authSchemaMigrations?: {

  }
  realtimeSchemaMigrations?: {
    version?: FingerprintNumberField;
    insertedAt?: FingerprintDateField;
  }
  supabaseMigrationsSchemaMigrations?: {

  }
  secrets?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    key?: FingerprintRelationField;
  }
  seedFiles?: {

  }
  sendAccountCreateds?: {
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    id?: FingerprintNumberField;
  }
  sendAccountCredentials?: {
    keySlot?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    account?: FingerprintRelationField;
    credential?: FingerprintRelationField;
  }
  sendAccountReceives?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    value?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendAccountSigningKeyAddeds?: {
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    keySlot?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
    id?: FingerprintNumberField;
  }
  sendAccountSigningKeyRemoveds?: {
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    keySlot?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
    id?: FingerprintNumberField;
  }
  sendAccountTransfers?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    v?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendAccounts?: {
    chainId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    deletedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
    sendAccountCredentialsByAccountId?: FingerprintRelationField;
  }
  sendLiquidityPools?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
  }
  sendRevenuesSafeReceives?: {
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    v?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
    id?: FingerprintNumberField;
  }
  sendTokenTransfers?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    v?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendtagCheckoutReceipts?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    amount?: FingerprintNumberField;
    reward?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sessions?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    notAfter?: FingerprintDateField;
    refreshedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
    mfaAmrClaims?: FingerprintRelationField;
    refreshTokens?: FingerprintRelationField;
  }
  sources?: {
    chainId?: FingerprintNumberField;
  }
  ssoDomains?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    ssoProvider?: FingerprintRelationField;
  }
  ssoProviders?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    samlProviders?: FingerprintRelationField;
    samlRelayStates?: FingerprintRelationField;
    ssoDomains?: FingerprintRelationField;
  }
  subscriptions?: {
    id?: FingerprintNumberField;
    claims?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
  }
  tagReceipts?: {
    id?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    tag?: FingerprintRelationField;
  }
  tagReservations?: {
    createdAt?: FingerprintDateField;
  }
  tags?: {
    createdAt?: FingerprintDateField;
    user?: FingerprintRelationField;
    referralsByTag?: FingerprintRelationField;
    tagReceipts?: FingerprintRelationField;
  }
  taskUpdates?: {
    num?: FingerprintNumberField;
    insertAt?: FingerprintDateField;
    srcNum?: FingerprintNumberField;
    nblocks?: FingerprintNumberField;
    nrows?: FingerprintNumberField;
    stop?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
  }
  users?: {
    emailConfirmedAt?: FingerprintDateField;
    invitedAt?: FingerprintDateField;
    confirmationSentAt?: FingerprintDateField;
    recoverySentAt?: FingerprintDateField;
    emailChangeSentAt?: FingerprintDateField;
    lastSignInAt?: FingerprintDateField;
    rawAppMetaData?: FingerprintJsonField;
    rawUserMetaData?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    phoneConfirmedAt?: FingerprintDateField;
    phoneChangeSentAt?: FingerprintDateField;
    confirmedAt?: FingerprintDateField;
    emailChangeConfirmStatus?: FingerprintNumberField;
    bannedUntil?: FingerprintDateField;
    reauthenticationSentAt?: FingerprintDateField;
    deletedAt?: FingerprintDateField;
    identities?: FingerprintRelationField;
    mfaFactors?: FingerprintRelationField;
    oneTimeTokens?: FingerprintRelationField;
    sessions?: FingerprintRelationField;
    leaderboardReferralsAllTimes?: FingerprintRelationField;
    activitiesByFromUserId?: FingerprintRelationField;
    activitiesByToUserId?: FingerprintRelationField;
    chainAddresses?: FingerprintRelationField;
    distributionShares?: FingerprintRelationField;
    distributionVerifications?: FingerprintRelationField;
    profiles?: FingerprintRelationField;
    receipts?: FingerprintRelationField;
    sendAccounts?: FingerprintRelationField;
    tags?: FingerprintRelationField;
    webauthnCredentials?: FingerprintRelationField;
  }
  webauthnCredentials?: {
    signCount?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    deletedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
    sendAccountCredentialsByCredentialId?: FingerprintRelationField;
  }}