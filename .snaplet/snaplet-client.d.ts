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
      id?: string;
      user_id?: string;
      identity_data?: string;
      provider?: string;
      last_sign_in_at?: string;
      created_at?: string;
      updated_at?: string;
      email?: string;
      users?: string;
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
      from_ip_address?: string;
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
      users?: string;
      mfa_amr_claims?: string;
      refresh_tokens?: string;
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
      identities?: string;
      mfa_factors?: string;
      sessions?: string;
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
  auditLogEntries?: {
    payload?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
  }
  buckets?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    fileSizeLimit?: FingerprintNumberField;
    objects?: FingerprintRelationField;
  }
  chainAddresses?: {
    createdAt?: FingerprintDateField;
    user?: FingerprintRelationField;
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
    distribution?: FingerprintRelationField;
  }
  distributionVerifications?: {
    id?: FingerprintNumberField;
    distributionId?: FingerprintNumberField;
    metadata?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
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
    snapshotId?: FingerprintNumberField;
    hodlerMinBalance?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    distributionShares?: FingerprintRelationField;
    distributionVerificationValues?: FingerprintRelationField;
    distributionVerifications?: FingerprintRelationField;
  }
  featureInfos?: {

  }
  flowStates?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
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
  instances?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
  }
  keys?: {
    created?: FingerprintDateField;
    expires?: FingerprintDateField;
    keyId?: FingerprintNumberField;
    keysByParentKey?: FingerprintRelationField;
    keysByParentKey?: FingerprintRelationField;
    secrets?: FingerprintRelationField;
  }
  mfaAmrClaims?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    session?: FingerprintRelationField;
  }
  mfaChallenges?: {
    createdAt?: FingerprintDateField;
    verifiedAt?: FingerprintDateField;
    factor?: FingerprintRelationField;
  }
  mfaFactors?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
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
    bucket?: FingerprintRelationField;
  }
  profiles?: {
    i?: FingerprintRelationField;
    referralsByReferredId?: FingerprintRelationField;
    referralsByReferrerId?: FingerprintRelationField;
  }
  receipts?: {
    createdAt?: FingerprintDateField;
    user?: FingerprintRelationField;
    tagReceipts?: FingerprintRelationField;
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
  supabaseMigrationsSchemaMigrations?: {

  }
  secrets?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    key?: FingerprintRelationField;
  }
  sendAccountCredentials?: {
    keySlot?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    account?: FingerprintRelationField;
    credential?: FingerprintRelationField;
  }
  sendAccounts?: {
    chainId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    deletedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
    sendAccountCredentialsByAccountId?: FingerprintRelationField;
  }
  sendTransferLogs?: {
    value?: FingerprintNumberField;
    blockNumber?: FingerprintNumberField;
    blockTimestamp?: FingerprintDateField;
    logIndex?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
  }
  sessions?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    notAfter?: FingerprintDateField;
    user?: FingerprintRelationField;
    mfaAmrClaims?: FingerprintRelationField;
    refreshTokens?: FingerprintRelationField;
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
  tagReceipts?: {
    ha?: FingerprintRelationField;
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
    sessions?: FingerprintRelationField;
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