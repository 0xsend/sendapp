-- Add index on send_account_transfers.block_time
create index concurrently send_account_transfers_block_time on send_account_transfers (block_time);