alter table send_account_created  add column id serial primary key;
-- already added
-- alter table send_account_transfers add column id serial primary key;
-- alter table send_token_transfers add column id serial primary key;
alter table send_revenues_safe_receives add column id serial primary key;
alter table send_account_signing_key_added add column id serial primary key;
alter table send_account_signing_key_removed add column id serial primary key;

alter table send_account_created
  alter column chain_id  set not null,
  alter column log_addr  set not null,
  alter column block_time  set not null,
  -- alter column user_op_hash  set not null, -- actually needs to be nullable
  alter column tx_hash  set not null,
  alter column account  set not null,
  alter column ig_name  set not null,
  alter column src_name  set not null,
  alter column block_num  set not null,
  alter column tx_idx  set not null,
  alter column log_idx  set not null;

alter table send_account_transfers
  alter column chain_id   set not null,
  alter column log_addr   set not null,
  alter column block_time set not null,
  alter column tx_hash    set not null,
  alter column f          set not null,
  alter column t          set not null,
  alter column v          set not null,
  alter column ig_name    set not null,
  alter column src_name   set not null,
  alter column block_num  set not null,
  alter column tx_idx     set not null,
  alter column log_idx    set not null,
  alter column abi_idx    set not null;

alter table send_token_transfers
  alter column chain_id set not null,
  alter column log_addr set not null,
  alter column block_time set not null,
  alter column tx_hash set not null,
  alter column f set not null,
  alter column t set not null,
  alter column v set not null,
  alter column ig_name set not null,
  alter column src_name set not null,
  alter column block_num set not null,
  alter column tx_idx set not null,
  alter column log_idx set not null,
  alter column abi_idx set not null;

alter table send_revenues_safe_receives
  alter column chain_id set not null,
  alter column log_addr set not null,
  alter column block_time set not null,
  alter column tx_hash set not null,
  alter column sender set not null,
  alter column v set not null,
  alter column ig_name set not null,
  alter column src_name set not null,
  alter column block_num set not null,
  alter column tx_idx set not null,
  alter column log_idx set not null,
  alter column abi_idx set not null;

alter table send_account_signing_key_removed
  alter column chain_id set not null,
  alter column log_addr set not null,
  alter column block_time set not null,
  alter column tx_hash set not null,
  alter column account set not null,
  alter column key_slot set not null,
  alter column key set not null,
  alter column ig_name set not null,
  alter column src_name set not null,
  alter column block_num set not null,
  alter column tx_idx set not null,
  alter column log_idx set not null,
  alter column abi_idx set not null;

alter table send_account_created  add column event_id text GENERATED ALWAYS AS (ig_name || '/' || src_name || '/' || block_num::text || '/' || tx_idx::text || '/' || log_idx::text) stored;
alter table send_account_transfers add column event_id  text GENERATED ALWAYS AS (ig_name || '/' || src_name || '/' || block_num::text || '/' || tx_idx::text || '/' || log_idx::text) stored;
alter table send_token_transfers add column event_id  text GENERATED ALWAYS AS (ig_name || '/' || src_name || '/' || block_num::text || '/' || tx_idx::text || '/' || log_idx::text) stored;
alter table send_revenues_safe_receives add column event_id  text GENERATED ALWAYS AS (ig_name || '/' || src_name || '/' || block_num::text || '/' || tx_idx::text || '/' || log_idx::text) stored;
alter table send_account_signing_key_added add column event_id  text GENERATED ALWAYS AS (ig_name || '/' || src_name || '/' || block_num::text || '/' || tx_idx::text || '/' || log_idx::text) stored;
alter table send_account_signing_key_removed add column event_id  text GENERATED ALWAYS AS (ig_name || '/' || src_name || '/' || block_num::text || '/' || tx_idx::text || '/' || log_idx::text) stored;
