-- Add index on send_account_signing_key_removed.block_num
create index concurrently send_account_signing_key_removed_block_num on send_account_signing_key_removed (block_num);