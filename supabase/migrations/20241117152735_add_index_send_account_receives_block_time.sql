-- Add index on send_account_receives.block_time
create index concurrently send_account_receives_block_time on send_account_receives (block_time);