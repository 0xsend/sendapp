-- create missing block number and time indexes

create index concurrently send_account_created_account_block_num on send_account_created (block_num);
create index concurrently send_account_created_account_block_time on send_account_created (block_time);

create index concurrently send_account_receives_block_num on send_account_receives (block_num);
create index concurrently send_account_receives_block_time on send_account_receives (block_time);

create index concurrently send_account_signing_key_added_block_num on send_account_signing_key_added (block_num);
create index concurrently send_account_signing_key_added_block_time on send_account_signing_key_added (block_time);

create index concurrently send_account_signing_key_removed_block_num on send_account_signing_key_removed (block_num);
create index concurrently send_account_signing_key_removed_block_time on send_account_signing_key_removed (block_time);

-- create index concurrently send_revenues_safe_receives_block_num on send_revenues_safe_receives (block_num);
create index concurrently send_revenues_safe_receives_block_time on send_revenues_safe_receives (block_time);

create index concurrently send_account_transfers_block_num on send_account_transfers (block_num);
create index concurrently send_account_transfers_block_time on send_account_transfers (block_time);

create index concurrently send_token_transfers_block_num on send_token_transfers (block_num);
create index concurrently send_token_transfers_block_time on send_token_transfers (block_time);

create index concurrently sendtag_checkout_receipts_block_num on sendtag_checkout_receipts (block_num);
create index concurrently sendtag_checkout_receipts_block_time on sendtag_checkout_receipts (block_time);
