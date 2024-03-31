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
      snapshot_block_num?: string;
      chain_id?: string;
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
      send_id?: string;
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
    snapshotBlockNum?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    distributionShares?: FingerprintRelationField;
    distributionVerificationValues?: FingerprintRelationField;
    distributionVerifications?: FingerprintRelationField;
  }
  hooks?: {
    id?: FingerprintNumberField;
    hookTableId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    requestId?: FingerprintNumberField;
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
    sendId?: FingerprintNumberField;
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
  authSchemaMigrations?: {

  }
  supabaseMigrationsSchemaMigrations?: {

  }
  sendAccountCreateds?: {
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
  }
  sendAccountCredentials?: {
    keySlot?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    account?: FingerprintRelationField;
    credential?: FingerprintRelationField;
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
  sendTransferLogs?: {
    value?: FingerprintNumberField;
    blockNumber?: FingerprintNumberField;
    blockTimestamp?: FingerprintDateField;
    logIndex?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
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