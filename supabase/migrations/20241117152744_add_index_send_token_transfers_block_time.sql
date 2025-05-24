-- Add index on send_token_transfers.block_time
create index concurrently send_token_transfers_block_time on send_token_transfers (block_time);