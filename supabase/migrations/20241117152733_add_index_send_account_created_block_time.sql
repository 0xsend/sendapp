-- Add index on send_account_created.block_time
create index concurrently send_account_created_account_block_time on send_account_created (block_time);