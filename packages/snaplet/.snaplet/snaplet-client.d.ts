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
  affiliate_stats?: {
    name?: string;
    fields?: {
      user_id?: string;
      id?: string;
      created_at?: string;
      updated_at?: string;
      send_plus_minus?: string;
      profiles?: string;
    };
  }
  bridge_customers?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      bridge_customer_id?: string;
      kyc_link_id?: string;
      kyc_status?: string;
      tos_status?: string;
      type?: string;
      rejection_reasons?: string;
      rejection_attempts?: string;
      created_at?: string;
      updated_at?: string;
      users?: string;
      bridge_static_memos?: string;
      bridge_transfer_templates?: string;
      bridge_virtual_accounts?: string;
    };
  }
  bridge_deposits?: {
    name?: string;
    fields?: {
      id?: string;
      virtual_account_id?: string;
      transfer_template_id?: string;
      bridge_transfer_id?: string;
      last_event_id?: string;
      last_event_type?: string;
      payment_rail?: string;
      amount?: string;
      currency?: string;
      status?: string;
      sender_name?: string;
      sender_routing_number?: string;
      trace_number?: string;
      destination_tx_hash?: string;
      fee_amount?: string;
      net_amount?: string;
      created_at?: string;
      updated_at?: string;
      static_memo_id?: string;
      bridge_static_memos?: string;
      bridge_transfer_templates?: string;
      bridge_virtual_accounts?: string;
    };
  }
  bridge_static_memos?: {
    name?: string;
    fields?: {
      id?: string;
      bridge_customer_id?: string;
      bridge_static_memo_id?: string;
      source_currency?: string;
      destination_currency?: string;
      destination_payment_rail?: string;
      destination_address?: string;
      source_deposit_instructions?: string;
      status?: string;
      created_at?: string;
      updated_at?: string;
      bridge_customers?: string;
      bridge_deposits?: string;
    };
  }
  bridge_transfer_templates?: {
    name?: string;
    fields?: {
      id?: string;
      bridge_customer_id?: string;
      bridge_transfer_template_id?: string;
      source_currency?: string;
      destination_currency?: string;
      destination_payment_rail?: string;
      destination_address?: string;
      source_deposit_instructions?: string;
      status?: string;
      created_at?: string;
      updated_at?: string;
      bridge_customers?: string;
      bridge_deposits?: string;
    };
  }
  bridge_virtual_accounts?: {
    name?: string;
    fields?: {
      id?: string;
      bridge_customer_id?: string;
      bridge_virtual_account_id?: string;
      source_currency?: string;
      destination_currency?: string;
      destination_payment_rail?: string;
      destination_address?: string;
      source_deposit_instructions?: string;
      status?: string;
      created_at?: string;
      updated_at?: string;
      bridge_customers?: string;
      bridge_deposits?: string;
    };
  }
  bridge_webhook_events?: {
    name?: string;
    fields?: {
      id?: string;
      bridge_event_id?: string;
      event_type?: string;
      event_created_at?: string;
      payload?: string;
      processed_at?: string;
      error?: string;
      created_at?: string;
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
      type?: string;
      objects?: string;
      prefixes?: string;
    };
  }
  buckets_analytics?: {
    name?: string;
    fields?: {
      id?: string;
      type?: string;
      format?: string;
      created_at?: string;
      updated_at?: string;
      iceberg_namespaces?: string;
      iceberg_tables?: string;
    };
  }
  canton_party_verifications?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      canton_wallet_address?: string;
      created_at?: string;
      updated_at?: string;
      is_discoverable?: string;
      users?: string;
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
  contact_label_assignments?: {
    name?: string;
    fields?: {
      id?: string;
      contact_id?: string;
      label_id?: string;
      created_at?: string;
      contact_labels?: string;
      contacts?: string;
    };
  }
  contact_labels?: {
    name?: string;
    fields?: {
      id?: string;
      owner_id?: string;
      name?: string;
      color?: string;
      created_at?: string;
      updated_at?: string;
      users?: string;
      contact_label_assignments?: string;
    };
  }
  contacts?: {
    name?: string;
    fields?: {
      id?: string;
      owner_id?: string;
      contact_user_id?: string;
      external_address?: string;
      chain_id?: string;
      custom_name?: string;
      notes?: string;
      is_favorite?: string;
      source?: string;
      last_interacted_at?: string;
      archived_at?: string;
      created_at?: string;
      updated_at?: string;
      normalized_external_address?: string;
      users_contacts_contact_user_idTousers?: string;
      users_contacts_owner_idTousers?: string;
      contact_label_assignments?: string;
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
      distribution_verifications?: string;
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
      distribution_verification_values?: string;
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
      merkle_drop_addr?: string;
      token_addr?: string;
      token_decimals?: string;
      tranche_id?: string;
      earn_min_balance?: string;
      sendpot_ticket_increment?: string;
      merkle_tree?: string;
      distribution_shares?: string;
      distribution_verification_values?: string;
      distribution_verifications?: string;
      send_slash?: string;
    };
  }
  extensions?: {
    name?: string;
    fields?: {
      id?: string;
      type?: string;
      settings?: string;
      tenant_external_id?: string;
      inserted_at?: string;
      updated_at?: string;
      tenants?: string;
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
  iceberg_namespaces?: {
    name?: string;
    fields?: {
      id?: string;
      bucket_id?: string;
      name?: string;
      created_at?: string;
      updated_at?: string;
      buckets_analytics?: string;
      iceberg_tables?: string;
    };
  }
  iceberg_tables?: {
    name?: string;
    fields?: {
      id?: string;
      namespace_id?: string;
      bucket_id?: string;
      name?: string;
      location?: string;
      created_at?: string;
      updated_at?: string;
      buckets_analytics?: string;
      iceberg_namespaces?: string;
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
  link_in_bio?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      handle?: string;
      domain_name?: string;
      created_at?: string;
      updated_at?: string;
      domain?: string;
      users?: string;
    };
  }
  liquidity_pools?: {
    name?: string;
    fields?: {
      pool_name?: string;
      pool_type?: string;
      pool_addr?: string;
      chain_id?: string;
      created_at?: string;
    };
  }
  migrations?: {
    name?: string;
    fields?: {
      version?: string;
      inserted_at?: string;
    };
  }
  notifications?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      type?: string;
      title?: string;
      body?: string;
      data?: string;
      read?: string;
      created_at?: string;
      delivered_at?: string;
      read_at?: string;
      users?: string;
    };
  }
  oauth_authorizations?: {
    name?: string;
    fields?: {
      id?: string;
      authorization_id?: string;
      client_id?: string;
      user_id?: string;
      redirect_uri?: string;
      scope?: string;
      state?: string;
      resource?: string;
      code_challenge?: string;
      code_challenge_method?: string;
      response_type?: string;
      status?: string;
      authorization_code?: string;
      created_at?: string;
      expires_at?: string;
      approved_at?: string;
      oauth_clients?: string;
      users?: string;
    };
  }
  oauth_clients?: {
    name?: string;
    fields?: {
      id?: string;
      client_secret_hash?: string;
      registration_type?: string;
      redirect_uris?: string;
      grant_types?: string;
      client_name?: string;
      client_uri?: string;
      logo_uri?: string;
      created_at?: string;
      updated_at?: string;
      deleted_at?: string;
      client_type?: string;
      oauth_authorizations?: string;
      oauth_consents?: string;
    };
  }
  oauth_consents?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      client_id?: string;
      scopes?: string;
      granted_at?: string;
      revoked_at?: string;
      oauth_clients?: string;
      users?: string;
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
      level?: string;
      buckets?: string;
    };
  }
  prefixes?: {
    name?: string;
    fields?: {
      bucket_id?: string;
      name?: string;
      level?: string;
      created_at?: string;
      updated_at?: string;
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
      x_username?: string;
      birthday?: string;
      banner_url?: string;
      verified_at?: string;
      sync_referrals_to_contacts?: string;
      is_business?: string;
      users?: string;
      affiliate_stats?: string;
      referrals_referrals_referred_idToprofiles?: string;
      referrals_referrals_referrer_idToprofiles?: string;
    };
  }
  push_tokens?: {
    name?: string;
    fields?: {
      id?: string;
      user_id?: string;
      platform?: string;
      token?: string;
      endpoint?: string;
      p256dh?: string;
      auth?: string;
      created_at?: string;
      updated_at?: string;
      device_id?: string;
      is_active?: string;
      last_used_at?: string;
      users?: string;
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
      id?: string;
      created_at?: string;
      profiles_referrals_referred_idToprofiles?: string;
      profiles_referrals_referrer_idToprofiles?: string;
    };
  }
  _realtime_schema_migrations?: {
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
  send_account_tags?: {
    name?: string;
    fields?: {
      id?: string;
      send_account_id?: string;
      tag_id?: string;
      created_at?: string;
      updated_at?: string;
      send_accounts?: string;
      tags?: string;
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
      main_tag_id?: string;
      address_bytes?: string;
      users?: string;
      tags?: string;
      send_account_credentials?: string;
      send_account_tags?: string;
    };
  }
  send_check_claimed?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      tx_idx?: string;
      ephemeral_address?: string;
      sender?: string;
      token?: string;
      amount?: string;
      expires_at?: string;
      redeemer?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      log_idx?: string;
      abi_idx?: string;
    };
  }
  send_check_created?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      tx_idx?: string;
      ephemeral_address?: string;
      sender?: string;
      token?: string;
      amount?: string;
      expires_at?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      log_idx?: string;
      abi_idx?: string;
    };
  }
  send_check_notes?: {
    name?: string;
    fields?: {
      ephemeral_address?: string;
      chain_id?: string;
      note?: string;
      created_at?: string;
    };
  }
  send_earn_create?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      send_earn?: string;
      caller?: string;
      initial_owner?: string;
      vault?: string;
      fee_recipient?: string;
      collections?: string;
      fee?: string;
      salt?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      event_id?: string;
    };
  }
  send_earn_deposit?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      sender?: string;
      owner?: string;
      assets?: string;
      shares?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      event_id?: string;
    };
  }
  send_earn_new_affiliate?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      affiliate?: string;
      send_earn_affiliate?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      event_id?: string;
    };
  }
  send_earn_withdraw?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      sender?: string;
      receiver?: string;
      owner?: string;
      assets?: string;
      shares?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      event_id?: string;
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
  send_slash?: {
    name?: string;
    fields?: {
      distribution_number?: string;
      minimum_sends?: string;
      scaling_divisor?: string;
      distribution_id?: string;
      distributions?: string;
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
  send_token_v0_transfers?: {
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
  sendpot_fee_history?: {
    name?: string;
    fields?: {
      id?: string;
      block_num?: string;
      block_time?: string;
      tx_hash?: string;
      fee_bps?: string;
      created_at?: string;
    };
  }
  sendpot_jackpot_runs?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      time?: string;
      winner?: string;
      winning_ticket?: string;
      win_amount?: string;
      tickets_purchased_total_bps?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
    };
  }
  sendpot_user_ticket_purchases?: {
    name?: string;
    fields?: {
      id?: string;
      chain_id?: string;
      log_addr?: string;
      block_time?: string;
      tx_hash?: string;
      referrer?: string;
      value?: string;
      recipient?: string;
      buyer?: string;
      tickets_purchased_total_bps?: string;
      ig_name?: string;
      src_name?: string;
      block_num?: string;
      tx_idx?: string;
      log_idx?: string;
      abi_idx?: string;
      tickets_purchased_count?: string;
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
  swap_routers?: {
    name?: string;
    fields?: {
      router_addr?: string;
      chain_id?: string;
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
      tag_id?: string;
      tags?: string;
    };
  }
  tags?: {
    name?: string;
    fields?: {
      name?: string;
      status?: string;
      user_id?: string;
      created_at?: string;
      id?: string;
      updated_at?: string;
      users?: string;
      send_account_tags?: string;
      send_accounts?: string;
      tag_receipts?: string;
    };
  }
  tenants?: {
    name?: string;
    fields?: {
      id?: string;
      name?: string;
      external_id?: string;
      jwt_secret?: string;
      max_concurrent_users?: string;
      inserted_at?: string;
      updated_at?: string;
      max_events_per_second?: string;
      postgres_cdc_default?: string;
      max_bytes_per_second?: string;
      max_channels_per_client?: string;
      max_joins_per_second?: string;
      suspend?: string;
      jwt_jwks?: string;
      notify_private_alpha?: string;
      private_only?: string;
      migrations_ran?: string;
      broadcast_adapter?: string;
      max_presence_events_per_second?: string;
      max_payload_size_in_kb?: string;
      extensions?: string;
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
      oauth_authorizations?: string;
      oauth_consents?: string;
      leaderboard_referrals_all_time?: string;
      bridge_customers?: string;
      canton_party_verifications?: string;
      chain_addresses?: string;
      contact_labels?: string;
      contacts_contacts_contact_user_idTousers?: string;
      contacts_contacts_owner_idTousers?: string;
      distribution_shares?: string;
      distribution_verifications?: string;
      link_in_bio?: string;
      notifications?: string;
      profiles?: string;
      push_tokens?: string;
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
  affiliateStats?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    sendPlusMinus?: FingerprintNumberField;
    user?: FingerprintRelationField;
  }
  bridgeCustomers?: {
    rejectionReasons?: FingerprintJsonField;
    rejectionAttempts?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
    bridgeStaticMemos?: FingerprintRelationField;
    bridgeTransferTemplates?: FingerprintRelationField;
    bridgeVirtualAccounts?: FingerprintRelationField;
  }
  bridgeDeposits?: {
    amount?: FingerprintNumberField;
    feeAmount?: FingerprintNumberField;
    netAmount?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    staticMemo?: FingerprintRelationField;
    transferTemplate?: FingerprintRelationField;
    virtualAccount?: FingerprintRelationField;
  }
  bridgeStaticMemos?: {
    sourceDepositInstructions?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    bridgeCustomer?: FingerprintRelationField;
    bridgeDepositsByStaticMemoId?: FingerprintRelationField;
  }
  bridgeTransferTemplates?: {
    sourceDepositInstructions?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    bridgeCustomer?: FingerprintRelationField;
    bridgeDepositsByTransferTemplateId?: FingerprintRelationField;
  }
  bridgeVirtualAccounts?: {
    sourceDepositInstructions?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    bridgeCustomer?: FingerprintRelationField;
    bridgeDepositsByVirtualAccountId?: FingerprintRelationField;
  }
  bridgeWebhookEvents?: {
    eventCreatedAt?: FingerprintDateField;
    payload?: FingerprintJsonField;
    processedAt?: FingerprintDateField;
    createdAt?: FingerprintDateField;
  }
  buckets?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    fileSizeLimit?: FingerprintNumberField;
    objects?: FingerprintRelationField;
    prefixes?: FingerprintRelationField;
  }
  bucketsAnalytics?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    icebergNamespacesByBucketId?: FingerprintRelationField;
    icebergTablesByBucketId?: FingerprintRelationField;
  }
  cantonPartyVerifications?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  chainAddresses?: {
    createdAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  contactLabelAssignments?: {
    id?: FingerprintNumberField;
    contactId?: FingerprintNumberField;
    labelId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    label?: FingerprintRelationField;
    contact?: FingerprintRelationField;
  }
  contactLabels?: {
    id?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    owner?: FingerprintRelationField;
    contactLabelAssignmentsByLabelId?: FingerprintRelationField;
  }
  contacts?: {
    id?: FingerprintNumberField;
    lastInteractedAt?: FingerprintDateField;
    archivedAt?: FingerprintDateField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    contactUser?: FingerprintRelationField;
    owner?: FingerprintRelationField;
    contactLabelAssignments?: FingerprintRelationField;
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
    distributionVerifications?: FingerprintRelationField;
  }
  distributionVerifications?: {
    id?: FingerprintNumberField;
    distributionId?: FingerprintNumberField;
    metadata?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
    weight?: FingerprintNumberField;
    user?: FingerprintRelationField;
    distribution?: FingerprintRelationField;
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
    tokenDecimals?: FingerprintNumberField;
    trancheId?: FingerprintNumberField;
    earnMinBalance?: FingerprintNumberField;
    sendpotTicketIncrement?: FingerprintNumberField;
    merkleTree?: FingerprintJsonField;
    distributionShares?: FingerprintRelationField;
    distributionVerificationValues?: FingerprintRelationField;
    distributionVerifications?: FingerprintRelationField;
    sendSlashes?: FingerprintRelationField;
  }
  extensions?: {
    settings?: FingerprintJsonField;
    insertedAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    tenant?: FingerprintRelationField;
  }
  hooks?: {
    id?: FingerprintNumberField;
    hookTableId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    requestId?: FingerprintNumberField;
  }
  icebergNamespaces?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    bucket?: FingerprintRelationField;
    icebergTablesByNamespaceId?: FingerprintRelationField;
  }
  icebergTables?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    bucket?: FingerprintRelationField;
    namespace?: FingerprintRelationField;
  }
  leaderboardReferralsAllTimes?: {
    referrals?: FingerprintNumberField;
    rewardsUsdc?: FingerprintNumberField;
    updatedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  linkInBios?: {
    id?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  liquidityPools?: {
    chainId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
  }
  migrations?: {
    insertedAt?: FingerprintDateField;
  }
  notifications?: {
    id?: FingerprintNumberField;
    data?: FingerprintJsonField;
    createdAt?: FingerprintDateField;
    deliveredAt?: FingerprintDateField;
    readAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  oauthAuthorizations?: {
    createdAt?: FingerprintDateField;
    expiresAt?: FingerprintDateField;
    approvedAt?: FingerprintDateField;
    client?: FingerprintRelationField;
    user?: FingerprintRelationField;
  }
  oauthClients?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    deletedAt?: FingerprintDateField;
    oauthAuthorizationsByClientId?: FingerprintRelationField;
    oauthConsentsByClientId?: FingerprintRelationField;
  }
  oauthConsents?: {
    grantedAt?: FingerprintDateField;
    revokedAt?: FingerprintDateField;
    client?: FingerprintRelationField;
    user?: FingerprintRelationField;
  }
  objects?: {
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    lastAccessedAt?: FingerprintDateField;
    metadata?: FingerprintJsonField;
    userMetadata?: FingerprintJsonField;
    level?: FingerprintNumberField;
    bucket?: FingerprintRelationField;
  }
  prefixes?: {
    level?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    bucket?: FingerprintRelationField;
  }
  profiles?: {
    sendId?: FingerprintNumberField;
    birthday?: FingerprintDateField;
    verifiedAt?: FingerprintDateField;
    i?: FingerprintRelationField;
    affiliateStatsByUserId?: FingerprintRelationField;
    referralsByReferredId?: FingerprintRelationField;
    referralsByReferrerId?: FingerprintRelationField;
  }
  pushTokens?: {
    id?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    lastUsedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
  }
  receipts?: {
    createdAt?: FingerprintDateField;
    id?: FingerprintNumberField;
    user?: FingerprintRelationField;
  }
  referrals?: {
    id?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    referred?: FingerprintRelationField;
    referrer?: FingerprintRelationField;
  }
  RealtimeSchemaMigrations?: {
    version?: FingerprintNumberField;
    insertedAt?: FingerprintDateField;
  }
  supabaseMigrationsSchemaMigrations?: {

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
  sendAccountTags?: {
    id?: FingerprintNumberField;
    tagId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    sendAccount?: FingerprintRelationField;
    tag?: FingerprintRelationField;
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
    mainTagId?: FingerprintNumberField;
    user?: FingerprintRelationField;
    mainTag?: FingerprintRelationField;
    sendAccountCredentialsByAccountId?: FingerprintRelationField;
    sendAccountTags?: FingerprintRelationField;
  }
  sendCheckClaimeds?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    amount?: FingerprintNumberField;
    expiresAt?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendCheckCreateds?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    amount?: FingerprintNumberField;
    expiresAt?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendCheckNotes?: {
    chainId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
  }
  sendEarnCreates?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    fee?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendEarnDeposits?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    assets?: FingerprintNumberField;
    shares?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendEarnNewAffiliates?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendEarnWithdraws?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    assets?: FingerprintNumberField;
    shares?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
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
  sendSlashes?: {
    distributionNumber?: FingerprintNumberField;
    minimumSends?: FingerprintNumberField;
    scalingDivisor?: FingerprintNumberField;
    distributionId?: FingerprintNumberField;
    distribution?: FingerprintRelationField;
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
  sendTokenV0Transfers?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    v?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendpotFeeHistories?: {
    id?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    feeBps?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
  }
  sendpotJackpotRuns?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    time?: FingerprintNumberField;
    winningTicket?: FingerprintNumberField;
    winAmount?: FingerprintNumberField;
    ticketsPurchasedTotalBps?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
  }
  sendpotUserTicketPurchases?: {
    id?: FingerprintNumberField;
    chainId?: FingerprintNumberField;
    blockTime?: FingerprintNumberField;
    value?: FingerprintNumberField;
    ticketsPurchasedTotalBps?: FingerprintNumberField;
    blockNum?: FingerprintNumberField;
    txIdx?: FingerprintNumberField;
    logIdx?: FingerprintNumberField;
    abiIdx?: FingerprintNumberField;
    ticketsPurchasedCount?: FingerprintNumberField;
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
  swapRouters?: {
    chainId?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
  }
  tagReceipts?: {
    id?: FingerprintNumberField;
    createdAt?: FingerprintDateField;
    tagId?: FingerprintNumberField;
    tag?: FingerprintRelationField;
  }
  tags?: {
    createdAt?: FingerprintDateField;
    id?: FingerprintNumberField;
    updatedAt?: FingerprintDateField;
    user?: FingerprintRelationField;
    sendAccountTags?: FingerprintRelationField;
    sendAccountsByMainTagId?: FingerprintRelationField;
    tagReceipts?: FingerprintRelationField;
  }
  tenants?: {
    maxConcurrentUsers?: FingerprintNumberField;
    insertedAt?: FingerprintDateField;
    updatedAt?: FingerprintDateField;
    maxEventsPerSecond?: FingerprintNumberField;
    maxBytesPerSecond?: FingerprintNumberField;
    maxChannelsPerClient?: FingerprintNumberField;
    maxJoinsPerSecond?: FingerprintNumberField;
    jwtJwks?: FingerprintJsonField;
    migrationsRan?: FingerprintNumberField;
    maxPresenceEventsPerSecond?: FingerprintNumberField;
    maxPayloadSizeInKb?: FingerprintNumberField;
    extensions?: FingerprintRelationField;
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
    oauthAuthorizations?: FingerprintRelationField;
    oauthConsents?: FingerprintRelationField;
    leaderboardReferralsAllTimes?: FingerprintRelationField;
    bridgeCustomers?: FingerprintRelationField;
    cantonPartyVerifications?: FingerprintRelationField;
    chainAddresses?: FingerprintRelationField;
    contactLabelsByOwnerId?: FingerprintRelationField;
    contactsByContactUserId?: FingerprintRelationField;
    contactsByOwnerId?: FingerprintRelationField;
    distributionShares?: FingerprintRelationField;
    distributionVerifications?: FingerprintRelationField;
    linkInBios?: FingerprintRelationField;
    notifications?: FingerprintRelationField;
    profiles?: FingerprintRelationField;
    pushTokens?: FingerprintRelationField;
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