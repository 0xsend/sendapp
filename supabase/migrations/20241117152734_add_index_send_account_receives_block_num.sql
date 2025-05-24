-- Add index on send_account_receives.block_num
create index concurrently send_account_receives_block_num on send_account_receives (block_num);