-- Add index on send_token_transfers.block_num
create index concurrently send_token_transfers_block_num on send_token_transfers (block_num);