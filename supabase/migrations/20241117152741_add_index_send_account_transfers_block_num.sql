-- Add index on send_account_transfers.block_num
create index concurrently send_account_transfers_block_num on send_account_transfers (block_num);