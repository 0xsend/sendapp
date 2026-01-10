//#region structure
type JsonPrimitive = null | number | string | boolean;
type Nested<V> = V | { [s: string]: V | Nested<V> } | Array<V | Nested<V>>;
type Json = Nested<JsonPrimitive>;
type Enum_auth_aal_level = 'aal1' | 'aal2' | 'aal3';
type Enum_auth_code_challenge_method = 'plain' | 's256';
type Enum_auth_factor_status = 'unverified' | 'verified';
type Enum_auth_factor_type = 'phone' | 'totp' | 'webauthn';
type Enum_auth_oauth_authorization_status = 'approved' | 'denied' | 'expired' | 'pending';
type Enum_auth_oauth_client_type = 'confidential' | 'public';
type Enum_auth_oauth_registration_type = 'dynamic' | 'manual';
type Enum_auth_oauth_response_type = 'code';
type Enum_auth_one_time_token_type = 'confirmation_token' | 'email_change_token_current' | 'email_change_token_new' | 'phone_change_token' | 'reauthentication_token' | 'recovery_token';
type Enum_net_request_status = 'ERROR' | 'PENDING' | 'SUCCESS';
type Enum_pgtle_password_types = 'PASSWORD_TYPE_MD5' | 'PASSWORD_TYPE_PLAINTEXT' | 'PASSWORD_TYPE_SCRAM_SHA_256';
type Enum_pgtle_pg_tle_features = 'clientauth' | 'passcheck';
type Enum_public_contact_source_enum = 'activity' | 'external' | 'manual' | 'referral';
type Enum_public_key_type_enum = 'ES256';
type Enum_public_link_in_bio_domain_names = 'Discord' | 'Facebook' | 'GitHub' | 'Instagram' | 'OnlyFans' | 'Snapchat' | 'Telegram' | 'TikTok' | 'Twitch' | 'WhatsApp' | 'X' | 'YouTube';
type Enum_public_lookup_type_enum = 'address' | 'phone' | 'refcode' | 'sendid' | 'tag';
type Enum_public_tag_status = 'available' | 'confirmed' | 'pending';
type Enum_public_temporal_status = 'confirmed' | 'failed' | 'initialized' | 'sent' | 'submitted';
type Enum_public_verification_type = 'create_passkey' | 'send_ceiling' | 'send_one_hundred' | 'send_streak' | 'send_ten' | 'sendpot_ticket_purchase' | 'tag_referral' | 'tag_registration' | 'total_tag_referrals';
type Enum_public_verification_value_mode = 'aggregate' | 'individual';
type Enum_realtime_action = 'DELETE' | 'ERROR' | 'INSERT' | 'TRUNCATE' | 'UPDATE';
type Enum_realtime_equality_op = 'eq' | 'gt' | 'gte' | 'in' | 'lt' | 'lte' | 'neq';
type Enum_storage_buckettype = 'ANALYTICS' | 'STANDARD';
type Enum_temporal_transfer_status = 'cancelled' | 'confirmed' | 'failed' | 'initialized' | 'sent' | 'submitted';
interface Table_net_http_response {
  id: number | null;
  status_code: number | null;
  content_type: string | null;
  headers: Json | null;
  content: string | null;
  timed_out: boolean | null;
  error_msg: string | null;
  created: string;
}
interface Table_public_activity {
  id: number;
  event_name: string;
  event_id: string;
  from_user_id: string | null;
  to_user_id: string | null;
  data: Json | null;
  created_at: string;
}
interface Table_public_affiliate_stats {
  user_id: string | null;
  id: string;
  created_at: string;
  updated_at: string;
  send_plus_minus: number;
}
interface Table_auth_audit_log_entries {
  instance_id: string | null;
  id: string;
  payload: Json | null;
  created_at: string | null;
  ip_address: string;
}
interface Table_public_bridge_customers {
  id: string;
  user_id: string;
  bridge_customer_id: string | null;
  kyc_link_id: string;
  kyc_status: string;
  tos_status: string;
  type: string;
  rejection_reasons: Json | null;
  rejection_attempts: number;
  created_at: string;
  updated_at: string;
}
interface Table_public_bridge_deposits {
  id: string;
  virtual_account_id: string | null;
  transfer_template_id: string | null;
  bridge_transfer_id: string;
  last_event_id: string | null;
  last_event_type: string | null;
  payment_rail: string;
  amount: number;
  currency: string;
  status: string;
  sender_name: string | null;
  sender_routing_number: string | null;
  trace_number: string | null;
  destination_tx_hash: string | null;
  fee_amount: number | null;
  net_amount: number | null;
  created_at: string;
  updated_at: string;
}
interface Table_public_bridge_transfer_templates {
  id: string;
  bridge_customer_id: string;
  bridge_transfer_template_id: string;
  source_currency: string;
  destination_currency: string;
  destination_payment_rail: string;
  destination_address: string;
  source_deposit_instructions: Json | null;
  status: string;
  created_at: string;
  updated_at: string;
}
interface Table_public_bridge_virtual_accounts {
  id: string;
  bridge_customer_id: string;
  bridge_virtual_account_id: string;
  source_currency: string;
  destination_currency: string;
  destination_payment_rail: string;
  destination_address: string;
  source_deposit_instructions: Json | null;
  status: string;
  created_at: string;
  updated_at: string;
}
interface Table_public_bridge_webhook_events {
  id: string;
  bridge_event_id: string;
  event_type: string;
  event_created_at: string | null;
  payload: Json;
  processed_at: string | null;
  error: string | null;
  created_at: string;
}
interface Table_storage_buckets {
  id: string;
  name: string;
  owner: string | null;
  created_at: string | null;
  updated_at: string | null;
  public: boolean | null;
  avif_autodetection: boolean | null;
  file_size_limit: number | null;
  allowed_mime_types: string[] | null;
  owner_id: string | null;
  type: Enum_storage_buckettype;
}
interface Table_storage_buckets_analytics {
  id: string;
  type: Enum_storage_buckettype;
  format: string;
  created_at: string;
  updated_at: string;
}
interface Table_public_canton_party_verifications {
  id: string;
  user_id: string;
  canton_wallet_address: string;
  created_at: string;
  updated_at: string | null;
  is_discoverable: boolean | null;
}
interface Table_public_chain_addresses {
  address: string;
  user_id: string;
  created_at: string;
}
interface Table_public_challenges {
  id: number;
  challenge: string;
  created_at: string;
  expires_at: string;
}
interface Table_public_contact_label_assignments {
  id: number;
  contact_id: number;
  label_id: number;
  created_at: string;
}
interface Table_public_contact_labels {
  id: number;
  owner_id: string;
  name: string;
  color: string | null;
  created_at: string;
  updated_at: string;
}
interface Table_public_contacts {
  id: number;
  owner_id: string;
  contact_user_id: string | null;
  external_address: string | null;
  chain_id: string | null;
  custom_name: string | null;
  notes: string | null;
  is_favorite: boolean;
  source: Enum_public_contact_source_enum;
  last_interacted_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}
interface Table_public_distribution_shares {
  id: number;
  distribution_id: number;
  user_id: string;
  address: string;
  amount: number;
  hodler_pool_amount: number;
  bonus_pool_amount: number;
  fixed_pool_amount: number;
  created_at: string;
  updated_at: string;
  index: number;
}
interface Table_public_distribution_verification_values {
  type: Enum_public_verification_type;
  fixed_value: number;
  bips_value: number;
  distribution_id: number;
  created_at: string;
  updated_at: string;
  multiplier_min: number;
  multiplier_max: number;
  multiplier_step: number;
}
interface Table_public_distribution_verifications {
  id: number;
  distribution_id: number;
  user_id: string;
  type: Enum_public_verification_type;
  metadata: Json | null;
  created_at: string;
  weight: number;
}
interface Table_public_distributions {
  id: number;
  number: number;
  amount: number;
  hodler_pool_bips: number;
  bonus_pool_bips: number;
  fixed_pool_bips: number;
  name: string;
  description: string | null;
  qualification_start: string;
  qualification_end: string;
  claim_end: string;
  hodler_min_balance: number;
  created_at: string;
  updated_at: string;
  snapshot_block_num: number | null;
  chain_id: number;
  merkle_drop_addr: string | null;
  token_addr: string | null;
  token_decimals: number | null;
  tranche_id: number;
  earn_min_balance: number;
  sendpot_ticket_increment: number | null;
  merkle_tree: Json | null;
}
interface Table_realtime_extensions {
  id: string;
  type: string | null;
  settings: Json | null;
  tenant_external_id: string | null;
  inserted_at: string;
  updated_at: string;
}
interface Table_pgtle_feature_info {
  feature: Enum_pgtle_pg_tle_features;
  schema_name: string;
  proname: string;
  obj_identity: string;
}
interface Table_auth_flow_state {
  id: string;
  user_id: string | null;
  auth_code: string;
  code_challenge_method: Enum_auth_code_challenge_method;
  code_challenge: string;
  provider_type: string;
  provider_access_token: string | null;
  provider_refresh_token: string | null;
  created_at: string | null;
  updated_at: string | null;
  authentication_method: string;
  auth_code_issued_at: string | null;
}
interface Table_supabase_functions_hooks {
  id: number;
  hook_table_id: number;
  hook_name: string;
  created_at: string;
  request_id: number | null;
}
interface Table_net_http_request_queue {
  id: number;
  method: string;
  url: string;
  headers: Json;
  body: string | null;
  timeout_milliseconds: number;
}
interface Table_storage_iceberg_namespaces {
  id: string;
  bucket_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}
interface Table_storage_iceberg_tables {
  id: string;
  namespace_id: string;
  bucket_id: string;
  name: string;
  location: string;
  created_at: string;
  updated_at: string;
}
interface Table_auth_identities {
  provider_id: string;
  user_id: string;
  identity_data: Json;
  provider: string;
  last_sign_in_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  id: string;
}
interface Table_shovel_ig_updates {
  name: string;
  src_name: string;
  backfill: boolean | null;
  num: number;
  latency: string | null;
  nrows: number | null;
  stop: number | null;
}
interface Table_auth_instances {
  id: string;
  uuid: string | null;
  raw_base_config: string | null;
  created_at: string | null;
  updated_at: string | null;
}
interface Table_shovel_integrations {
  name: string | null;
  conf: Json | null;
}
interface Table_private_leaderboard_referrals_all_time {
  user_id: string;
  referrals: number | null;
  rewards_usdc: number | null;
  updated_at: string | null;
}
interface Table_public_link_in_bio {
  id: number;
  user_id: string;
  handle: string | null;
  domain_name: Enum_public_link_in_bio_domain_names;
  created_at: string;
  updated_at: string;
}
interface Table_public_liquidity_pools {
  pool_name: string;
  pool_type: string;
  pool_addr: string;
  chain_id: number;
  created_at: string;
}
interface Table_realtime_messages {
  topic: string;
  extension: string;
  payload: Json | null;
  event: string | null;
  private: boolean | null;
  updated_at: string;
  inserted_at: string;
  id: string;
}
interface Table_auth_mfa_amr_claims {
  session_id: string;
  created_at: string;
  updated_at: string;
  authentication_method: string;
  id: string;
}
interface Table_auth_mfa_challenges {
  id: string;
  factor_id: string;
  created_at: string;
  verified_at: string | null;
  ip_address: string;
  otp_code: string | null;
  web_authn_session_data: Json | null;
}
interface Table_auth_mfa_factors {
  id: string;
  user_id: string;
  friendly_name: string | null;
  factor_type: Enum_auth_factor_type;
  status: Enum_auth_factor_status;
  created_at: string;
  updated_at: string;
  secret: string | null;
  phone: string | null;
  last_challenged_at: string | null;
  web_authn_credential: Json | null;
  web_authn_aaguid: string | null;
}
interface Table_storage_migrations {
  id: number;
  name: string;
  hash: string;
  executed_at: string | null;
}
interface Table_supabase_functions_migrations {
  version: string;
  inserted_at: string;
}
interface Table_auth_oauth_authorizations {
  id: string;
  authorization_id: string;
  client_id: string;
  user_id: string | null;
  redirect_uri: string;
  scope: string;
  state: string | null;
  resource: string | null;
  code_challenge: string | null;
  code_challenge_method: Enum_auth_code_challenge_method | null;
  response_type: Enum_auth_oauth_response_type;
  status: Enum_auth_oauth_authorization_status;
  authorization_code: string | null;
  created_at: string;
  expires_at: string;
  approved_at: string | null;
}
interface Table_auth_oauth_clients {
  id: string;
  client_secret_hash: string | null;
  registration_type: Enum_auth_oauth_registration_type;
  redirect_uris: string;
  grant_types: string;
  client_name: string | null;
  client_uri: string | null;
  logo_uri: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  client_type: Enum_auth_oauth_client_type;
}
interface Table_auth_oauth_consents {
  id: string;
  user_id: string;
  client_id: string;
  scopes: string;
  granted_at: string;
  revoked_at: string | null;
}
interface Table_storage_objects {
  id: string;
  bucket_id: string | null;
  name: string | null;
  owner: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_accessed_at: string | null;
  metadata: Json | null;
  version: string | null;
  owner_id: string | null;
  user_metadata: Json | null;
  level: number | null;
}
interface Table_auth_one_time_tokens {
  id: string;
  user_id: string;
  token_type: Enum_auth_one_time_token_type;
  token_hash: string;
  relates_to: string;
  created_at: string;
  updated_at: string;
}
interface Table_storage_prefixes {
  bucket_id: string;
  name: string;
  created_at: string | null;
  updated_at: string | null;
}
interface Table_public_profiles {
  id: string;
  avatar_url: string | null;
  name: string | null;
  about: string | null;
  referral_code: string | null;
  is_public: boolean | null;
  send_id: number;
  x_username: string | null;
  birthday: string | null;
  banner_url: string | null;
  verified_at: string | null;
  sync_referrals_to_contacts: boolean;
  is_business: boolean;
}
interface Table_public_receipts {
  hash: string | null;
  created_at: string | null;
  user_id: string;
  id: number;
  event_id: string;
}
interface Table_public_referrals {
  referrer_id: string;
  referred_id: string;
  id: number;
  created_at: string;
}
interface Table_auth_refresh_tokens {
  instance_id: string | null;
  id: number;
  token: string | null;
  user_id: string | null;
  revoked: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  parent: string | null;
  session_id: string | null;
}
interface Table_storage_s_3_multipart_uploads {
  id: string;
  in_progress_size: number;
  upload_signature: string;
  bucket_id: string;
  key: string;
  version: string;
  owner_id: string | null;
  created_at: string;
  user_metadata: Json | null;
}
interface Table_storage_s_3_multipart_uploads_parts {
  id: string;
  upload_id: string;
  size: number;
  part_number: number;
  bucket_id: string;
  key: string;
  etag: string;
  owner_id: string | null;
  version: string;
  created_at: string;
}
interface Table_auth_saml_providers {
  id: string;
  sso_provider_id: string;
  entity_id: string;
  metadata_xml: string;
  metadata_url: string | null;
  attribute_mapping: Json | null;
  created_at: string | null;
  updated_at: string | null;
  name_id_format: string | null;
}
interface Table_auth_saml_relay_states {
  id: string;
  sso_provider_id: string;
  request_id: string;
  for_email: string | null;
  redirect_to: string | null;
  created_at: string | null;
  updated_at: string | null;
  flow_state_id: string | null;
}
interface Table_realtime_schema_migrations {
  version: number;
  inserted_at: string | null;
}
interface Table_auth_schema_migrations {
  version: string;
}
interface Table_realtime_schema_migrations {
  version: number;
  inserted_at: string | null;
}
interface Table_supabase_migrations_schema_migrations {
  version: string;
  statements: string[] | null;
  name: string | null;
}
interface Table_vault_secrets {
  id: string;
  name: string | null;
  description: string;
  secret: string;
  key_id: string | null;
  nonce: string | null;
  created_at: string;
  updated_at: string;
}
interface Table_supabase_migrations_seed_files {
  path: string;
  hash: string;
}
interface Table_public_send_account_created {
  chain_id: number;
  log_addr: string;
  block_time: number;
  user_op_hash: string | null;
  tx_hash: string;
  account: string;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  id: number;
}
interface Table_public_send_account_credentials {
  account_id: string;
  credential_id: string;
  key_slot: number;
  created_at: string | null;
}
interface Table_public_send_account_receives {
  id: number;
  chain_id: number;
  block_num: number;
  block_time: number;
  tx_hash: string;
  tx_idx: number;
  log_idx: number;
  log_addr: string;
  sender: string;
  value: number;
  ig_name: string;
  src_name: string;
  abi_idx: number;
}
interface Table_public_send_account_signing_key_added {
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  account: string;
  key_slot: number;
  key: string;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
  id: number;
}
interface Table_public_send_account_signing_key_removed {
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  account: string;
  key_slot: number;
  key: string;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
  id: number;
}
interface Table_public_send_account_tags {
  id: number;
  send_account_id: string;
  tag_id: number;
  created_at: string;
  updated_at: string;
}
interface Table_public_send_account_transfers {
  id: number;
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  f: string;
  t: string;
  v: number;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
}
interface Table_temporal_send_account_transfers {
  id: number;
  workflow_id: string;
  status: Enum_temporal_transfer_status;
  user_id: string | null;
  created_at_block_num: number | null;
  data: Json | null;
  created_at: string;
  updated_at: string;
  send_account_transfers_activity_event_id: string | null;
  send_account_transfers_activity_event_name: string | null;
}
interface Table_public_send_accounts {
  id: string;
  user_id: string;
  address: string;
  chain_id: number;
  init_code: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  main_tag_id: number | null;
}
interface Table_public_send_check_claimed {
  id: number;
  chain_id: number | null;
  log_addr: string | null;
  block_time: number | null;
  tx_hash: string | null;
  tx_idx: number | null;
  ephemeral_address: string | null;
  sender: string | null;
  token: string | null;
  amount: number | null;
  expires_at: number | null;
  redeemer: string | null;
  ig_name: string | null;
  src_name: string | null;
  block_num: number | null;
  log_idx: number | null;
  abi_idx: number | null;
}
interface Table_public_send_check_created {
  id: number;
  chain_id: number | null;
  log_addr: string | null;
  block_time: number | null;
  tx_hash: string | null;
  tx_idx: number | null;
  ephemeral_address: string | null;
  sender: string | null;
  token: string | null;
  amount: number | null;
  expires_at: number | null;
  ig_name: string | null;
  src_name: string | null;
  block_num: number | null;
  log_idx: number | null;
  abi_idx: number | null;
}
interface Table_public_send_check_notes {
  ephemeral_address: string;
  chain_id: number;
  note: string;
  created_at: string;
}
interface Table_public_send_earn_create {
  id: number;
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  send_earn: string;
  caller: string;
  initial_owner: string;
  vault: string;
  fee_recipient: string;
  collections: string;
  fee: number;
  salt: string;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
}
interface Table_public_send_earn_deposit {
  id: number;
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  sender: string;
  owner: string;
  assets: number;
  shares: number;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
}
interface Table_temporal_send_earn_deposits {
  workflow_id: string;
  status: Enum_public_temporal_status;
  owner: string | null;
  assets: number | null;
  vault: string | null;
  user_op_hash: string | null;
  block_num: number | null;
  activity_id: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}
interface Table_public_send_earn_new_affiliate {
  id: number;
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  affiliate: string;
  send_earn_affiliate: string;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
}
interface Table_public_send_earn_withdraw {
  id: number;
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  sender: string;
  receiver: string;
  owner: string;
  assets: number;
  shares: number;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
}
interface Table_public_send_liquidity_pools {
  id: number;
  address: string;
  chain_id: number;
}
interface Table_public_send_revenues_safe_receives {
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  sender: string;
  v: number;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
  id: number;
}
interface Table_public_send_slash {
  distribution_number: number;
  minimum_sends: number;
  scaling_divisor: number;
  distribution_id: number;
}
interface Table_public_send_token_transfers {
  id: number;
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  f: string;
  t: string;
  v: number;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
}
interface Table_public_send_token_v_0_transfers {
  id: number;
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  f: string;
  t: string;
  v: number;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
}
interface Table_public_sendpot_fee_history {
  id: number;
  block_num: number;
  block_time: number;
  tx_hash: string | null;
  fee_bps: number;
  created_at: string;
}
interface Table_public_sendpot_jackpot_runs {
  id: number;
  chain_id: number | null;
  log_addr: string | null;
  block_time: number | null;
  tx_hash: string | null;
  time: number | null;
  winner: string | null;
  winning_ticket: number | null;
  win_amount: number | null;
  tickets_purchased_total_bps: number | null;
  ig_name: string | null;
  src_name: string | null;
  block_num: number | null;
  tx_idx: number | null;
  log_idx: number | null;
  abi_idx: number | null;
}
interface Table_public_sendpot_user_ticket_purchases {
  id: number;
  chain_id: number | null;
  log_addr: string | null;
  block_time: number | null;
  tx_hash: string | null;
  referrer: string | null;
  value: number | null;
  recipient: string | null;
  buyer: string | null;
  tickets_purchased_total_bps: number | null;
  ig_name: string | null;
  src_name: string | null;
  block_num: number | null;
  tx_idx: number | null;
  log_idx: number | null;
  abi_idx: number | null;
  tickets_purchased_count: number | null;
}
interface Table_public_sendtag_checkout_receipts {
  id: number;
  chain_id: number;
  log_addr: string;
  block_time: number;
  tx_hash: string;
  sender: string;
  amount: number;
  referrer: string;
  reward: number;
  ig_name: string;
  src_name: string;
  block_num: number;
  tx_idx: number;
  log_idx: number;
  abi_idx: number;
}
interface Table_auth_sessions {
  id: string;
  user_id: string;
  created_at: string | null;
  updated_at: string | null;
  factor_id: string | null;
  aal: Enum_auth_aal_level | null;
  not_after: string | null;
  refreshed_at: string | null;
  user_agent: string | null;
  ip: string | null;
  tag: string | null;
  oauth_client_id: string | null;
}
interface Table_shovel_sources {
  name: string | null;
  chain_id: number | null;
  url: string | null;
}
interface Table_auth_sso_domains {
  id: string;
  sso_provider_id: string;
  domain: string;
  created_at: string | null;
  updated_at: string | null;
}
interface Table_auth_sso_providers {
  id: string;
  resource_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  disabled: boolean | null;
}
interface Table_realtime_subscription {
  id: number;
  subscription_id: string;
  /**
  * We couldn't determine the type of this column. The type might be coming from an unknown extension
  * or be specific to your database. Please if it's a common used type report this issue so we can fix it!
  * Otherwise, please manually type this column by casting it to the correct type.
  * @example
  * Here is a cast example for copycat use:
  * ```
  * copycat.scramble(row.unknownColumn as string)
  * ```
  */
  entity: unknown;
  /**
  * We couldn't determine the type of this column. The type might be coming from an unknown extension
  * or be specific to your database. Please if it's a common used type report this issue so we can fix it!
  * Otherwise, please manually type this column by casting it to the correct type.
  * @example
  * Here is a cast example for copycat use:
  * ```
  * copycat.scramble(row.unknownColumn as string)
  * ```
  */
  filters: unknown[];
  claims: Json;
  created_at: string;
}
interface Table_public_swap_routers {
  router_addr: string;
  chain_id: number;
  created_at: string;
}
interface Table_public_tag_receipts {
  tag_name: string;
  hash: string | null;
  event_id: string | null;
  id: number;
  created_at: string | null;
  tag_id: number;
}
interface Table_public_tags {
  name: string;
  status: Enum_public_tag_status;
  user_id: string | null;
  created_at: string;
  id: number;
  updated_at: string;
}
interface Table_shovel_task_updates {
  num: number | null;
  hash: string | null;
  insert_at: string | null;
  src_hash: string | null;
  src_num: number | null;
  nblocks: number | null;
  nrows: number | null;
  latency: string | null;
  src_name: string | null;
  stop: number | null;
  chain_id: number | null;
  ig_name: string | null;
}
interface Table_realtime_tenants {
  id: string;
  name: string | null;
  external_id: string | null;
  jwt_secret: string | null;
  max_concurrent_users: number;
  inserted_at: string;
  updated_at: string;
  max_events_per_second: number;
  postgres_cdc_default: string | null;
  max_bytes_per_second: number;
  max_channels_per_client: number;
  max_joins_per_second: number;
  suspend: boolean | null;
  jwt_jwks: Json | null;
  notify_private_alpha: boolean | null;
  private_only: boolean;
  migrations_ran: number | null;
  broadcast_adapter: string | null;
  max_presence_events_per_second: number | null;
  max_payload_size_in_kb: number | null;
}
interface Table_auth_users {
  instance_id: string | null;
  id: string;
  aud: string | null;
  role: string | null;
  email: string | null;
  encrypted_password: string | null;
  email_confirmed_at: string | null;
  invited_at: string | null;
  confirmation_token: string | null;
  confirmation_sent_at: string | null;
  recovery_token: string | null;
  recovery_sent_at: string | null;
  email_change_token_new: string | null;
  email_change: string | null;
  email_change_sent_at: string | null;
  last_sign_in_at: string | null;
  raw_app_meta_data: Json | null;
  raw_user_meta_data: Json | null;
  is_super_admin: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  phone: string | null;
  phone_confirmed_at: string | null;
  phone_change: string | null;
  phone_change_token: string | null;
  phone_change_sent_at: string | null;
  email_change_token_current: string | null;
  email_change_confirm_status: number | null;
  banned_until: string | null;
  reauthentication_token: string | null;
  reauthentication_sent_at: string | null;
  is_sso_user: boolean;
  deleted_at: string | null;
  is_anonymous: boolean;
}
interface Table_public_webauthn_credentials {
  id: string;
  name: string;
  display_name: string;
  raw_credential_id: string;
  user_id: string;
  public_key: string;
  key_type: Enum_public_key_type_enum;
  sign_count: number;
  attestation_object: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
interface Schema_realtime {
  extensions: Table_realtime_extensions;
  schema_migrations: Table_realtime_schema_migrations;
  tenants: Table_realtime_tenants;
}
interface Schema_auth {
  audit_log_entries: Table_auth_audit_log_entries;
  flow_state: Table_auth_flow_state;
  identities: Table_auth_identities;
  instances: Table_auth_instances;
  mfa_amr_claims: Table_auth_mfa_amr_claims;
  mfa_challenges: Table_auth_mfa_challenges;
  mfa_factors: Table_auth_mfa_factors;
  oauth_authorizations: Table_auth_oauth_authorizations;
  oauth_clients: Table_auth_oauth_clients;
  oauth_consents: Table_auth_oauth_consents;
  one_time_tokens: Table_auth_one_time_tokens;
  refresh_tokens: Table_auth_refresh_tokens;
  saml_providers: Table_auth_saml_providers;
  saml_relay_states: Table_auth_saml_relay_states;
  schema_migrations: Table_auth_schema_migrations;
  sessions: Table_auth_sessions;
  sso_domains: Table_auth_sso_domains;
  sso_providers: Table_auth_sso_providers;
  users: Table_auth_users;
}
interface Schema_dbdev {

}
interface Schema_extensions {

}
interface Schema_graphql {

}
interface Schema_graphql_public {

}
interface Schema_net {
  _http_response: Table_net_http_response;
  http_request_queue: Table_net_http_request_queue;
}
interface Schema_pgbouncer {

}
interface Schema_pgtle {
  feature_info: Table_pgtle_feature_info;
}
interface Schema_private {
  leaderboard_referrals_all_time: Table_private_leaderboard_referrals_all_time;
}
interface Schema_public {
  activity: Table_public_activity;
  affiliate_stats: Table_public_affiliate_stats;
  bridge_customers: Table_public_bridge_customers;
  bridge_deposits: Table_public_bridge_deposits;
  bridge_transfer_templates: Table_public_bridge_transfer_templates;
  bridge_virtual_accounts: Table_public_bridge_virtual_accounts;
  bridge_webhook_events: Table_public_bridge_webhook_events;
  canton_party_verifications: Table_public_canton_party_verifications;
  chain_addresses: Table_public_chain_addresses;
  challenges: Table_public_challenges;
  contact_label_assignments: Table_public_contact_label_assignments;
  contact_labels: Table_public_contact_labels;
  contacts: Table_public_contacts;
  distribution_shares: Table_public_distribution_shares;
  distribution_verification_values: Table_public_distribution_verification_values;
  distribution_verifications: Table_public_distribution_verifications;
  distributions: Table_public_distributions;
  link_in_bio: Table_public_link_in_bio;
  liquidity_pools: Table_public_liquidity_pools;
  profiles: Table_public_profiles;
  receipts: Table_public_receipts;
  referrals: Table_public_referrals;
  send_account_created: Table_public_send_account_created;
  send_account_credentials: Table_public_send_account_credentials;
  send_account_receives: Table_public_send_account_receives;
  send_account_signing_key_added: Table_public_send_account_signing_key_added;
  send_account_signing_key_removed: Table_public_send_account_signing_key_removed;
  send_account_tags: Table_public_send_account_tags;
  send_account_transfers: Table_public_send_account_transfers;
  send_accounts: Table_public_send_accounts;
  send_check_claimed: Table_public_send_check_claimed;
  send_check_created: Table_public_send_check_created;
  send_check_notes: Table_public_send_check_notes;
  send_earn_create: Table_public_send_earn_create;
  send_earn_deposit: Table_public_send_earn_deposit;
  send_earn_new_affiliate: Table_public_send_earn_new_affiliate;
  send_earn_withdraw: Table_public_send_earn_withdraw;
  send_liquidity_pools: Table_public_send_liquidity_pools;
  send_revenues_safe_receives: Table_public_send_revenues_safe_receives;
  send_slash: Table_public_send_slash;
  send_token_transfers: Table_public_send_token_transfers;
  send_token_v0_transfers: Table_public_send_token_v_0_transfers;
  sendpot_fee_history: Table_public_sendpot_fee_history;
  sendpot_jackpot_runs: Table_public_sendpot_jackpot_runs;
  sendpot_user_ticket_purchases: Table_public_sendpot_user_ticket_purchases;
  sendtag_checkout_receipts: Table_public_sendtag_checkout_receipts;
  swap_routers: Table_public_swap_routers;
  tag_receipts: Table_public_tag_receipts;
  tags: Table_public_tags;
  webauthn_credentials: Table_public_webauthn_credentials;
}
interface Schema_realtime {
  messages: Table_realtime_messages;
  schema_migrations: Table_realtime_schema_migrations;
  subscription: Table_realtime_subscription;
}
interface Schema_shovel {
  ig_updates: Table_shovel_ig_updates;
  integrations: Table_shovel_integrations;
  sources: Table_shovel_sources;
  task_updates: Table_shovel_task_updates;
}
interface Schema_storage {
  buckets: Table_storage_buckets;
  buckets_analytics: Table_storage_buckets_analytics;
  iceberg_namespaces: Table_storage_iceberg_namespaces;
  iceberg_tables: Table_storage_iceberg_tables;
  migrations: Table_storage_migrations;
  objects: Table_storage_objects;
  prefixes: Table_storage_prefixes;
  s3_multipart_uploads: Table_storage_s_3_multipart_uploads;
  s3_multipart_uploads_parts: Table_storage_s_3_multipart_uploads_parts;
}
interface Schema_supabase_functions {
  hooks: Table_supabase_functions_hooks;
  migrations: Table_supabase_functions_migrations;
}
interface Schema_supabase_migrations {
  schema_migrations: Table_supabase_migrations_schema_migrations;
  seed_files: Table_supabase_migrations_seed_files;
}
interface Schema_temporal {
  send_account_transfers: Table_temporal_send_account_transfers;
  send_earn_deposits: Table_temporal_send_earn_deposits;
}
interface Schema_vault {
  secrets: Table_vault_secrets;
}
interface Database {
  _realtime: Schema__realtime;
  auth: Schema_auth;
  dbdev: Schema_dbdev;
  extensions: Schema_extensions;
  graphql: Schema_graphql;
  graphql_public: Schema_graphql_public;
  net: Schema_net;
  pgbouncer: Schema_pgbouncer;
  pgtle: Schema_pgtle;
  private: Schema_private;
  public: Schema_public;
  realtime: Schema_realtime;
  shovel: Schema_shovel;
  storage: Schema_storage;
  supabase_functions: Schema_supabase_functions;
  supabase_migrations: Schema_supabase_migrations;
  temporal: Schema_temporal;
  vault: Schema_vault;
}
interface Extension {
  extensions: "http" | "pg_net" | "pg_stat_statements" | "pg_trgm" | "pgcrypto" | "pgjwt" | "uuid-ossp";
  graphql: "pg_graphql";
  pgtle: "pg_tle";
  public: "citext" | "supabase-dbdev";
  vault: "supabase_vault";
}
interface Tables_relationships {
  "public.activity": {
    parent: {
       activity_from_user_id_fkey: "auth.users";
       activity_to_user_id_fkey: "auth.users";
    };
    children: {
       fk_activity: "temporal.send_earn_deposits";
    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables: "temporal.send_earn_deposits" | {};
    
  };
  "public.affiliate_stats": {
    parent: {
       affiliate_stats_user_id_fkey: "public.profiles";
    };
    children: {

    };
    parentDestinationsTables: "public.profiles" | {};
    childDestinationsTables:  | {};
    
  };
  "public.bridge_customers": {
    parent: {
       bridge_customers_user_id_fkey: "auth.users";
    };
    children: {
       bridge_transfer_templates_bridge_customer_id_fkey: "public.bridge_transfer_templates";
       bridge_virtual_accounts_bridge_customer_id_fkey: "public.bridge_virtual_accounts";
    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables: "public.bridge_transfer_templates" | "public.bridge_virtual_accounts" | {};
    
  };
  "public.bridge_deposits": {
    parent: {
       bridge_deposits_transfer_template_id_fkey: "public.bridge_transfer_templates";
       bridge_deposits_virtual_account_id_fkey: "public.bridge_virtual_accounts";
    };
    children: {

    };
    parentDestinationsTables: "public.bridge_transfer_templates" | "public.bridge_virtual_accounts" | {};
    childDestinationsTables:  | {};
    
  };
  "public.bridge_transfer_templates": {
    parent: {
       bridge_transfer_templates_bridge_customer_id_fkey: "public.bridge_customers";
    };
    children: {
       bridge_deposits_transfer_template_id_fkey: "public.bridge_deposits";
    };
    parentDestinationsTables: "public.bridge_customers" | {};
    childDestinationsTables: "public.bridge_deposits" | {};
    
  };
  "public.bridge_virtual_accounts": {
    parent: {
       bridge_virtual_accounts_bridge_customer_id_fkey: "public.bridge_customers";
    };
    children: {
       bridge_deposits_virtual_account_id_fkey: "public.bridge_deposits";
    };
    parentDestinationsTables: "public.bridge_customers" | {};
    childDestinationsTables: "public.bridge_deposits" | {};
    
  };
  "storage.buckets": {
    parent: {

    };
    children: {
       objects_bucketId_fkey: "storage.objects";
       prefixes_bucketId_fkey: "storage.prefixes";
       s3_multipart_uploads_bucket_id_fkey: "storage.s3_multipart_uploads";
       s3_multipart_uploads_parts_bucket_id_fkey: "storage.s3_multipart_uploads_parts";
    };
    parentDestinationsTables:  | {};
    childDestinationsTables: "storage.objects" | "storage.prefixes" | "storage.s3_multipart_uploads" | "storage.s3_multipart_uploads_parts" | {};
    
  };
  "storage.buckets_analytics": {
    parent: {

    };
    children: {
       iceberg_namespaces_bucket_id_fkey: "storage.iceberg_namespaces";
       iceberg_tables_bucket_id_fkey: "storage.iceberg_tables";
    };
    parentDestinationsTables:  | {};
    childDestinationsTables: "storage.iceberg_namespaces" | "storage.iceberg_tables" | {};
    
  };
  "public.canton_party_verifications": {
    parent: {
       canton_party_verifications_user_id_fkey: "auth.users";
    };
    children: {

    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables:  | {};
    
  };
  "public.chain_addresses": {
    parent: {
       chain_addresses_user_id_fkey: "auth.users";
    };
    children: {

    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables:  | {};
    
  };
  "public.contact_label_assignments": {
    parent: {
       contact_label_assignments_label_id_fkey: "public.contact_labels";
       contact_label_assignments_contact_id_fkey: "public.contacts";
    };
    children: {

    };
    parentDestinationsTables: "public.contact_labels" | "public.contacts" | {};
    childDestinationsTables:  | {};
    
  };
  "public.contact_labels": {
    parent: {
       contact_labels_owner_id_fkey: "auth.users";
    };
    children: {
       contact_label_assignments_label_id_fkey: "public.contact_label_assignments";
    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables: "public.contact_label_assignments" | {};
    
  };
  "public.contacts": {
    parent: {
       contacts_contact_user_id_fkey: "auth.users";
       contacts_owner_id_fkey: "auth.users";
    };
    children: {
       contact_label_assignments_contact_id_fkey: "public.contact_label_assignments";
    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables: "public.contact_label_assignments" | {};
    
  };
  "public.distribution_shares": {
    parent: {
       distribution_shares_user_id_fkey: "auth.users";
       distribution_shares_distribution_id_fkey: "public.distributions";
    };
    children: {

    };
    parentDestinationsTables: "auth.users" | "public.distributions" | {};
    childDestinationsTables:  | {};
    
  };
  "public.distribution_verification_values": {
    parent: {
       distribution_verification_values_distribution_id_fkey: "public.distributions";
    };
    children: {
       distribution_verification_values_fk: "public.distribution_verifications";
    };
    parentDestinationsTables: "public.distributions" | {};
    childDestinationsTables: "public.distribution_verifications" | {};
    
  };
  "public.distribution_verifications": {
    parent: {
       distribution_verifications_user_id_fkey: "auth.users";
       distribution_verification_values_fk: "public.distribution_verification_values";
       distribution_verifications_distribution_id_fkey: "public.distributions";
    };
    children: {

    };
    parentDestinationsTables: "auth.users" | "public.distribution_verification_values" | "public.distributions" | {};
    childDestinationsTables:  | {};
    
  };
  "public.distributions": {
    parent: {

    };
    children: {
       distribution_shares_distribution_id_fkey: "public.distribution_shares";
       distribution_verification_values_distribution_id_fkey: "public.distribution_verification_values";
       distribution_verifications_distribution_id_fkey: "public.distribution_verifications";
       send_slash_distribution_id_fkey: "public.send_slash";
    };
    parentDestinationsTables:  | {};
    childDestinationsTables: "public.distribution_shares" | "public.distribution_verification_values" | "public.distribution_verifications" | "public.send_slash" | {};
    
  };
  "_realtime.extensions": {
    parent: {
       extensions_tenant_external_id_fkey: "_realtime.tenants";
    };
    children: {

    };
    parentDestinationsTables: "_realtime.tenants" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.flow_state": {
    parent: {

    };
    children: {
       saml_relay_states_flow_state_id_fkey: "auth.saml_relay_states";
    };
    parentDestinationsTables:  | {};
    childDestinationsTables: "auth.saml_relay_states" | {};
    
  };
  "storage.iceberg_namespaces": {
    parent: {
       iceberg_namespaces_bucket_id_fkey: "storage.buckets_analytics";
    };
    children: {
       iceberg_tables_namespace_id_fkey: "storage.iceberg_tables";
    };
    parentDestinationsTables: "storage.buckets_analytics" | {};
    childDestinationsTables: "storage.iceberg_tables" | {};
    
  };
  "storage.iceberg_tables": {
    parent: {
       iceberg_tables_bucket_id_fkey: "storage.buckets_analytics";
       iceberg_tables_namespace_id_fkey: "storage.iceberg_namespaces";
    };
    children: {

    };
    parentDestinationsTables: "storage.buckets_analytics" | "storage.iceberg_namespaces" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.identities": {
    parent: {
       identities_user_id_fkey: "auth.users";
    };
    children: {

    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables:  | {};
    
  };
  "private.leaderboard_referrals_all_time": {
    parent: {
       leaderboard_referrals_all_time_user_id_fkey: "auth.users";
    };
    children: {

    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables:  | {};
    
  };
  "public.link_in_bio": {
    parent: {
       link_in_bio_user_id_fkey: "auth.users";
    };
    children: {

    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.mfa_amr_claims": {
    parent: {
       mfa_amr_claims_session_id_fkey: "auth.sessions";
    };
    children: {

    };
    parentDestinationsTables: "auth.sessions" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.mfa_challenges": {
    parent: {
       mfa_challenges_auth_factor_id_fkey: "auth.mfa_factors";
    };
    children: {

    };
    parentDestinationsTables: "auth.mfa_factors" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.mfa_factors": {
    parent: {
       mfa_factors_user_id_fkey: "auth.users";
    };
    children: {
       mfa_challenges_auth_factor_id_fkey: "auth.mfa_challenges";
    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables: "auth.mfa_challenges" | {};
    
  };
  "auth.oauth_authorizations": {
    parent: {
       oauth_authorizations_client_id_fkey: "auth.oauth_clients";
       oauth_authorizations_user_id_fkey: "auth.users";
    };
    children: {

    };
    parentDestinationsTables: "auth.oauth_clients" | "auth.users" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.oauth_clients": {
    parent: {

    };
    children: {
       oauth_authorizations_client_id_fkey: "auth.oauth_authorizations";
       oauth_consents_client_id_fkey: "auth.oauth_consents";
       sessions_oauth_client_id_fkey: "auth.sessions";
    };
    parentDestinationsTables:  | {};
    childDestinationsTables: "auth.oauth_authorizations" | "auth.oauth_consents" | "auth.sessions" | {};
    
  };
  "auth.oauth_consents": {
    parent: {
       oauth_consents_client_id_fkey: "auth.oauth_clients";
       oauth_consents_user_id_fkey: "auth.users";
    };
    children: {

    };
    parentDestinationsTables: "auth.oauth_clients" | "auth.users" | {};
    childDestinationsTables:  | {};
    
  };
  "storage.objects": {
    parent: {
       objects_bucketId_fkey: "storage.buckets";
    };
    children: {

    };
    parentDestinationsTables: "storage.buckets" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.one_time_tokens": {
    parent: {
       one_time_tokens_user_id_fkey: "auth.users";
    };
    children: {

    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables:  | {};
    
  };
  "storage.prefixes": {
    parent: {
       prefixes_bucketId_fkey: "storage.buckets";
    };
    children: {

    };
    parentDestinationsTables: "storage.buckets" | {};
    childDestinationsTables:  | {};
    
  };
  "public.profiles": {
    parent: {
       profiles_id_fkey: "auth.users";
    };
    children: {
       affiliate_stats_user_id_fkey: "public.affiliate_stats";
       referrals_referred_id_fkey: "public.referrals";
       referrals_referrer_id_fkey: "public.referrals";
    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables: "public.affiliate_stats" | "public.referrals" | {};
    
  };
  "public.receipts": {
    parent: {
       receipts_user_id_fkey: "auth.users";
    };
    children: {

    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables:  | {};
    
  };
  "public.referrals": {
    parent: {
       referrals_referred_id_fkey: "public.profiles";
       referrals_referrer_id_fkey: "public.profiles";
    };
    children: {

    };
    parentDestinationsTables: "public.profiles" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.refresh_tokens": {
    parent: {
       refresh_tokens_session_id_fkey: "auth.sessions";
    };
    children: {

    };
    parentDestinationsTables: "auth.sessions" | {};
    childDestinationsTables:  | {};
    
  };
  "storage.s3_multipart_uploads": {
    parent: {
       s3_multipart_uploads_bucket_id_fkey: "storage.buckets";
    };
    children: {
       s3_multipart_uploads_parts_upload_id_fkey: "storage.s3_multipart_uploads_parts";
    };
    parentDestinationsTables: "storage.buckets" | {};
    childDestinationsTables: "storage.s3_multipart_uploads_parts" | {};
    
  };
  "storage.s3_multipart_uploads_parts": {
    parent: {
       s3_multipart_uploads_parts_bucket_id_fkey: "storage.buckets";
       s3_multipart_uploads_parts_upload_id_fkey: "storage.s3_multipart_uploads";
    };
    children: {

    };
    parentDestinationsTables: "storage.buckets" | "storage.s3_multipart_uploads" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.saml_providers": {
    parent: {
       saml_providers_sso_provider_id_fkey: "auth.sso_providers";
    };
    children: {

    };
    parentDestinationsTables: "auth.sso_providers" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.saml_relay_states": {
    parent: {
       saml_relay_states_flow_state_id_fkey: "auth.flow_state";
       saml_relay_states_sso_provider_id_fkey: "auth.sso_providers";
    };
    children: {

    };
    parentDestinationsTables: "auth.flow_state" | "auth.sso_providers" | {};
    childDestinationsTables:  | {};
    
  };
  "public.send_account_credentials": {
    parent: {
       account_credentials_account_id_fkey: "public.send_accounts";
       account_credentials_credential_id_fkey: "public.webauthn_credentials";
    };
    children: {

    };
    parentDestinationsTables: "public.send_accounts" | "public.webauthn_credentials" | {};
    childDestinationsTables:  | {};
    
  };
  "public.send_account_tags": {
    parent: {
       send_account_tags_send_account_id_fkey: "public.send_accounts";
       send_account_tags_tag_id_fkey: "public.tags";
    };
    children: {

    };
    parentDestinationsTables: "public.send_accounts" | "public.tags" | {};
    childDestinationsTables:  | {};
    
  };
  "public.send_accounts": {
    parent: {
       send_accounts_user_id_fkey: "auth.users";
       send_accounts_main_tag_id_fkey: "public.tags";
    };
    children: {
       account_credentials_account_id_fkey: "public.send_account_credentials";
       send_account_tags_send_account_id_fkey: "public.send_account_tags";
    };
    parentDestinationsTables: "auth.users" | "public.tags" | {};
    childDestinationsTables: "public.send_account_credentials" | "public.send_account_tags" | {};
    
  };
  "temporal.send_earn_deposits": {
    parent: {
       fk_activity: "public.activity";
    };
    children: {

    };
    parentDestinationsTables: "public.activity" | {};
    childDestinationsTables:  | {};
    
  };
  "public.send_slash": {
    parent: {
       send_slash_distribution_id_fkey: "public.distributions";
    };
    children: {

    };
    parentDestinationsTables: "public.distributions" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.sessions": {
    parent: {
       sessions_oauth_client_id_fkey: "auth.oauth_clients";
       sessions_user_id_fkey: "auth.users";
    };
    children: {
       mfa_amr_claims_session_id_fkey: "auth.mfa_amr_claims";
       refresh_tokens_session_id_fkey: "auth.refresh_tokens";
    };
    parentDestinationsTables: "auth.oauth_clients" | "auth.users" | {};
    childDestinationsTables: "auth.mfa_amr_claims" | "auth.refresh_tokens" | {};
    
  };
  "auth.sso_domains": {
    parent: {
       sso_domains_sso_provider_id_fkey: "auth.sso_providers";
    };
    children: {

    };
    parentDestinationsTables: "auth.sso_providers" | {};
    childDestinationsTables:  | {};
    
  };
  "auth.sso_providers": {
    parent: {

    };
    children: {
       saml_providers_sso_provider_id_fkey: "auth.saml_providers";
       saml_relay_states_sso_provider_id_fkey: "auth.saml_relay_states";
       sso_domains_sso_provider_id_fkey: "auth.sso_domains";
    };
    parentDestinationsTables:  | {};
    childDestinationsTables: "auth.saml_providers" | "auth.saml_relay_states" | "auth.sso_domains" | {};
    
  };
  "public.tag_receipts": {
    parent: {
       tag_receipts_tag_id_fkey: "public.tags";
    };
    children: {

    };
    parentDestinationsTables: "public.tags" | {};
    childDestinationsTables:  | {};
    
  };
  "public.tags": {
    parent: {
       tags_user_id_fkey: "auth.users";
    };
    children: {
       send_account_tags_tag_id_fkey: "public.send_account_tags";
       send_accounts_main_tag_id_fkey: "public.send_accounts";
       tag_receipts_tag_id_fkey: "public.tag_receipts";
    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables: "public.send_account_tags" | "public.send_accounts" | "public.tag_receipts" | {};
    
  };
  "_realtime.tenants": {
    parent: {

    };
    children: {
       extensions_tenant_external_id_fkey: "_realtime.extensions";
    };
    parentDestinationsTables:  | {};
    childDestinationsTables: "_realtime.extensions" | {};
    
  };
  "auth.users": {
    parent: {

    };
    children: {
       identities_user_id_fkey: "auth.identities";
       mfa_factors_user_id_fkey: "auth.mfa_factors";
       oauth_authorizations_user_id_fkey: "auth.oauth_authorizations";
       oauth_consents_user_id_fkey: "auth.oauth_consents";
       one_time_tokens_user_id_fkey: "auth.one_time_tokens";
       sessions_user_id_fkey: "auth.sessions";
       leaderboard_referrals_all_time_user_id_fkey: "private.leaderboard_referrals_all_time";
       activity_from_user_id_fkey: "public.activity";
       activity_to_user_id_fkey: "public.activity";
       bridge_customers_user_id_fkey: "public.bridge_customers";
       canton_party_verifications_user_id_fkey: "public.canton_party_verifications";
       chain_addresses_user_id_fkey: "public.chain_addresses";
       contact_labels_owner_id_fkey: "public.contact_labels";
       contacts_contact_user_id_fkey: "public.contacts";
       contacts_owner_id_fkey: "public.contacts";
       distribution_shares_user_id_fkey: "public.distribution_shares";
       distribution_verifications_user_id_fkey: "public.distribution_verifications";
       link_in_bio_user_id_fkey: "public.link_in_bio";
       profiles_id_fkey: "public.profiles";
       receipts_user_id_fkey: "public.receipts";
       send_accounts_user_id_fkey: "public.send_accounts";
       tags_user_id_fkey: "public.tags";
       webauthn_credentials_user_id_fkey: "public.webauthn_credentials";
    };
    parentDestinationsTables:  | {};
    childDestinationsTables: "auth.identities" | "auth.mfa_factors" | "auth.oauth_authorizations" | "auth.oauth_consents" | "auth.one_time_tokens" | "auth.sessions" | "private.leaderboard_referrals_all_time" | "public.activity" | "public.bridge_customers" | "public.canton_party_verifications" | "public.chain_addresses" | "public.contact_labels" | "public.contacts" | "public.distribution_shares" | "public.distribution_verifications" | "public.link_in_bio" | "public.profiles" | "public.receipts" | "public.send_accounts" | "public.tags" | "public.webauthn_credentials" | {};
    
  };
  "public.webauthn_credentials": {
    parent: {
       webauthn_credentials_user_id_fkey: "auth.users";
    };
    children: {
       account_credentials_credential_id_fkey: "public.send_account_credentials";
    };
    parentDestinationsTables: "auth.users" | {};
    childDestinationsTables: "public.send_account_credentials" | {};
    
  };
}
//#endregion

//#region select
type SelectedTable = { id: string; schema: string; table: string };

type SelectDefault = {
  /**
   * Define the "default" behavior to use for the tables in the schema.
   * If true, select all tables in the schema.
   * If false, select no tables in the schema.
   * If "structure", select only the structure of the tables in the schema but not the data.
   * @defaultValue true
   */
  $default?: SelectObject;
};

type DefaultKey = keyof SelectDefault;

type SelectObject = boolean | "structure";

type ExtensionsSelect<TSchema extends keyof Database> =
  TSchema extends keyof Extension
    ? {
        /**
         * Define if you want to select the extension data.
         * @defaultValue false
         */
        $extensions?:
          | boolean
          | {
              [TExtension in Extension[TSchema]]?: boolean;
            };
      }
    : {};

type SelectConfig = SelectDefault & {
  [TSchema in keyof Database]?:
    | SelectObject
    | (SelectDefault &
        ExtensionsSelect<TSchema> & {
          [TTable in keyof Database[TSchema]]?: SelectObject;
        });
};

// Apply the __default key if it exists to each level of the select config (schemas and tables)
type ApplyDefault<TSelectConfig extends SelectConfig> = {
  [TSchema in keyof Database]-?: {
    [TTable in keyof Database[TSchema]]-?: TSelectConfig[TSchema] extends SelectObject
      ? TSelectConfig[TSchema]
      : TSelectConfig[TSchema] extends Record<any, any>
      ? TSelectConfig[TSchema][TTable] extends SelectObject
        ? TSelectConfig[TSchema][TTable]
        : TSelectConfig[TSchema][DefaultKey] extends SelectObject
        ? TSelectConfig[TSchema][DefaultKey]
        : TSelectConfig[DefaultKey] extends SelectObject
        ? TSelectConfig[DefaultKey]
        : true
      : TSelectConfig[DefaultKey] extends SelectObject
      ? TSelectConfig[DefaultKey]
      : true;
  };
};

type ExtractValues<T> = T extends object ? T[keyof T] : never;

type GetSelectedTable<TSelectSchemas extends SelectConfig> = ExtractValues<
  ExtractValues<{
    [TSchema in keyof TSelectSchemas]: {
      [TTable in keyof TSelectSchemas[TSchema] as TSelectSchemas[TSchema][TTable] extends true
        ? TTable
        : never]: TSchema extends string
        ? TTable extends string
          ? { id: `${TSchema}.${TTable}`; schema: TSchema; table: TTable }
          : never
        : never;
    };
  }>
>;
//#endregion

//#region transform
type TransformMode = "auto" | "strict" | "unsafe" | undefined;


type TransformOptions<TTransformMode extends TransformMode> = {
  /**
   * The type for defining the transform mode.
   *
   * There are three modes available:
   *
   * - "auto" - Automatically transform the data for any columns, tables or schemas that have not been specified in the config
   * - "strict" - In this mode, Snaplet expects a transformation to be given in the config for every column in the database. If any columns have not been provided in the config, Snaplet will not capture the snapshot, but instead tell you which columns, tables, or schemas have not been given
   * - "unsafe" - This mode copies over values without any transformation. If a transformation is given for a column in the config, the transformation will be used instead
   * @defaultValue "unsafe"
   */
  $mode?: TTransformMode;
  /**
   * If true, parse JSON objects during transformation.
   * @defaultValue false
   */
  $parseJson?: boolean;
};

// This type is here to turn a Table with scalars values (string, number, etc..) for columns into a Table
// with either scalar values or a callback function that returns the scalar value
type ColumnWithCallback<TSchema extends keyof Database, TTable extends keyof Database[TSchema]> = {
  [TColumn in keyof Database[TSchema][TTable]]:
    Database[TSchema][TTable][TColumn] |
    ((ctx: {
      row: Database[TSchema][TTable];
      value: Database[TSchema][TTable][TColumn];
    }) => Database[TSchema][TTable][TColumn])
};

type DatabaseWithCallback = {
  [TSchema in keyof Database]: {
    [TTable in keyof Database[TSchema]]:
      | ((ctx: {
          row: Database[TSchema][TTable];
          rowIndex: number;
        }) => ColumnWithCallback<TSchema, TTable>)
      | ColumnWithCallback<TSchema, TTable>
  };
};

type SelectDatabase<TSelectedTable extends SelectedTable> = {
  [TSchema in keyof DatabaseWithCallback as TSchema extends NonNullable<TSelectedTable>["schema"]
    ? TSchema
    : never]: {
    [TTable in keyof DatabaseWithCallback[TSchema] as TTable extends Extract<
      TSelectedTable,
      { schema: TSchema }
    >["table"]
      ? TTable
      : never]: DatabaseWithCallback[TSchema][TTable];
  };
};

type PartialTransform<T> = T extends (...args: infer P) => infer R
  ? (...args: P) => Partial<R>
  : Partial<T>;

type IsNever<T> = [T] extends [never] ? true : false;

type TransformConfig<
  TTransformMode extends TransformMode,
  TSelectedTable extends SelectedTable
> = TransformOptions<TTransformMode> &
  (IsNever<TSelectedTable> extends true
    ? never
    : SelectDatabase<TSelectedTable> extends infer TSelectedDatabase
    ? TTransformMode extends "strict"
      ? TSelectedDatabase
      : {
          [TSchema in keyof TSelectedDatabase]?: {
            [TTable in keyof TSelectedDatabase[TSchema]]?: PartialTransform<
              TSelectedDatabase[TSchema][TTable]
            >;
          };
        }
    : never);
//#endregion

//#region subset
type NonEmptyArray<T> = [T, ...T[]];

/**
 * Represents an exclusive row limit percent.
 */
type ExclusiveRowLimitPercent =
| {
  percent?: never;
  /**
   * Represents a strict limit of the number of rows captured on target
   */
  rowLimit: number
}
| {
  /**
   * Represents a random percent to be captured on target (1-100)
   */
  percent: number;
  rowLimit?: never
}

// Get the type of a target in the config.subset.targets array
type SubsetTarget<TSelectedTable extends SelectedTable> = {
  /**
   * The ID of the table to target
   */
  table: TSelectedTable["id"];
  /**
   * The order on which your target will be filtered useful with rowLimit parameter
   *
   * @example
   * orderBy: `"User"."createdAt" desc`
   */
  orderBy?: string;
} & (
  | {
    /**
     * The where filter to be applied on the target
     *
     * @example
     * where: `"_prisma_migrations"."name" IN ('migration1', 'migration2')`
     */
    where: string
  } & Partial<ExclusiveRowLimitPercent>
  | {
    /**
     * The where filter to be applied on the target
     */
    where?: string
  } & ExclusiveRowLimitPercent
);

type GetSelectedTableChildrenKeys<TTable extends keyof Tables_relationships> = keyof Tables_relationships[TTable]['children']
type GetSelectedTableParentKeys<TTable extends keyof Tables_relationships> = keyof Tables_relationships[TTable]['parent']
type GetRelationDestinationKey<TTable extends keyof Tables_relationships> = Tables_relationships[TTable]['parentDestinationsTables'] | Tables_relationships[TTable]['childDestinationsTables']
type GetSelectedTableRelationsKeys<TTable extends keyof Tables_relationships> = GetSelectedTableChildrenKeys<TTable> | GetSelectedTableParentKeys<TTable> | GetRelationDestinationKey<TTable>
type SelectedTablesWithRelationsIds<TSelectedTable extends SelectedTable['id']> = TSelectedTable extends keyof Tables_relationships ? TSelectedTable : never

/**
 * Represents the options to choose the followNullableRelations of subsetting.
 */
type FollowNullableRelationsOptions<TSelectedTable extends SelectedTable> =
  // Type can be a global boolean definition
  boolean
  // Or can be a mix of $default and table specific definition
  | {
      $default: boolean |
      {
        [Key in GetSelectedTableRelationsKeys<SelectedTablesWithRelationsIds<TSelectedTable["id"]>> | '$default']?:  boolean
      }
    } & ({
  // If it's a table specific definition and the table has relationships
  [TTable in SelectedTablesWithRelationsIds<TSelectedTable["id"]>]?:
    // It's either a boolean or a mix of $default and relationship specific definition
    boolean |
    {
      [Key in GetSelectedTableRelationsKeys<TTable> | '$default']?:  boolean
    }
});


/**
 * Represents the options to choose the maxCyclesLoop of subsetting.
 */
type MaxCyclesLoopOptions<TSelectedTable extends SelectedTable> =
// Type can be a global number definition
number
// Or can be a mix of $default and table specific definition
| {
    $default: number |
    {
      [Key in GetSelectedTableRelationsKeys<SelectedTablesWithRelationsIds<TSelectedTable["id"]>> | '$default']?:  number
    }
  } & ({
  // If it's a table specific definition and the table has relationships
  [TTable in SelectedTablesWithRelationsIds<TSelectedTable["id"]>]?:
    // It's either a number or a mix of $default and relationship specific definition
    number |
    {
      [Key in GetSelectedTableRelationsKeys<TTable> | '$default']?:  number
    }
});


/**
 * Represents the options to choose the maxChildrenPerNode of subsetting.
 */
type MaxChildrenPerNodeOptions<TSelectedTable extends SelectedTable> =
// Type can be a global number definition
number
// Or can be a mix of $default and table specific definition
| {
    $default: number |
    {
      [Key in GetSelectedTableRelationsKeys<SelectedTablesWithRelationsIds<TSelectedTable["id"]>> | '$default']?:  number
    }
  } & ({
  // If it's a table specific definition and the table has relationships
  [TTable in SelectedTablesWithRelationsIds<TSelectedTable["id"]>]?:
    // It's either a number or a mix of $default and relationship specific definition
    number |
    {
      [Key in GetSelectedTableRelationsKeys<TTable> | '$default']?:  number
    }
});

/**
 * Represents the configuration for subsetting the snapshot.
 */
type SubsetConfig<TSelectedTable extends SelectedTable> = {
  /**
   * Specifies whether subsetting is enabled.
   *  @defaultValue true
   */
  enabled?: boolean;

  /**
   * Specifies the version of the subsetting algorithm
   *
   * @defaultValue "3"
   * @deprecated
   */
  version?: "1" | "2" | "3";

  /**
   * Specifies whether to eagerly load related tables.
   * @defaultValue false
   */
  eager?: boolean;

  /**
   * Specifies whether to keep tables that are not connected to any other tables.
   * @defaultValue false
   */
  keepDisconnectedTables?: boolean;

  /**
   * Specifies whether to follow nullable relations.
   * @defaultValue false
   */
  followNullableRelations?: FollowNullableRelationsOptions<TSelectedTable>;

  /**
   *  Specifies the maximum number of children per node.
   *  @defaultValue unlimited
   */
  maxChildrenPerNode?: MaxChildrenPerNodeOptions<TSelectedTable>;

  /**
   * Specifies the maximum number of cycles in a loop.
   * @defaultValue 10
   */
  maxCyclesLoop?: MaxCyclesLoopOptions<TSelectedTable>;

  /**
   * Specifies the root targets for subsetting. Must be a non-empty array
   */
  targets: NonEmptyArray<SubsetTarget<TSelectedTable>>;

  /**
   * Specifies the task sorting algorithm.
   * By default, the algorithm will not sort the tasks.
   */
  taskSortAlgorithm?: "children" | "idsCount";

  /**
   * Specifies whether to consider all targets collectively ('together'),
   * or one target at a time ('sequential') when the traversal algorithm is
   * determining the next steps.
   *
   * By default, the 'together' will be used.
   */
  traversalMode?: "sequential" | "together";
}
//#endregion


  //#region introspect
  type VirtualForeignKey<
    TTFkTable extends SelectedTable,
    TTargetTable extends SelectedTable
  > =
  {
    fkTable: TTFkTable['id'];
    targetTable: TTargetTable['id'];
    keys: NonEmptyArray<
      {
        // TODO: Find a way to strongly type this to provide autocomplete when writing the config
        /**
         * The column name present in the fkTable that is a foreign key to the targetTable
         */
        fkColumn: string;
        /**
         * The column name present in the targetTable that is a foreign key to the fkTable
         */
        targetColumn: string;
      }
    >
  }

  type IntrospectConfig<TSelectedTable extends SelectedTable> = {
    /**
     * Allows you to declare virtual foreign keys that are not present as foreign keys in the database.
     * But are still used and enforced by the application.
     */
    virtualForeignKeys?: Array<VirtualForeignKey<TSelectedTable, TSelectedTable>>;
  }
  //#endregion

type Validate<T, Target> = {
  [K in keyof T]: K extends keyof Target ? T[K] : never;
};

type TypedConfig<
  TSelectConfig extends SelectConfig,
  TTransformMode extends TransformMode
> =  GetSelectedTable<
  ApplyDefault<TSelectConfig>
> extends SelectedTable
  ? {
    /**
     * Parameter to configure the generation of data.
     * {@link https://docs.snaplet.dev/core-concepts/seed}
     */
      seed?: {
        alias?: import("./snaplet-client").Alias;
        fingerprint?: import("./snaplet-client").Fingerprint;
      }
    /**
     * Parameter to configure the inclusion/exclusion of schemas and tables from the snapshot.
     * {@link https://docs.snaplet.dev/reference/configuration#select}
     */
      select?: Validate<TSelectConfig, SelectConfig>;
      /**
       * Parameter to configure the transformations applied to the data.
       * {@link https://docs.snaplet.dev/reference/configuration#transform}
       */
      transform?: TransformConfig<TTransformMode, GetSelectedTable<ApplyDefault<TSelectConfig>>>;
      /**
       * Parameter to capture a subset of the data.
       * {@link https://docs.snaplet.dev/reference/configuration#subset}
       */
      subset?: SubsetConfig<GetSelectedTable<ApplyDefault<TSelectConfig>>>;

      /**
       * Parameter to augment the result of the introspection of your database.
       * {@link https://docs.snaplet.dev/references/data-operations/introspect}
       */
      introspect?: IntrospectConfig<GetSelectedTable<ApplyDefault<TSelectConfig>>>;
    }
  : never;

declare module "snaplet" {
  class JsonNull {}
  type JsonClass = typeof JsonNull;
  /**
   * Use this value to explicitely set a json or jsonb column to json null instead of the database NULL value.
   */
  export const jsonNull: InstanceType<JsonClass>;
  /**
  * Define the configuration for Snaplet capture process.
  * {@link https://docs.snaplet.dev/reference/configuration}
  */
  export function defineConfig<
    TSelectConfig extends SelectConfig,
    TTransformMode extends TransformMode = undefined
  >(
    config: TypedConfig<TSelectConfig, TTransformMode>
  ): TypedConfig<TSelectConfig, TTransformMode>;
}