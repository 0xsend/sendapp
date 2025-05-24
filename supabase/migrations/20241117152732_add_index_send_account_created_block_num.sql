-- Add index on send_account_created.block_num
create index concurrently send_account_created_account_block_num on send_account_created (block_num);