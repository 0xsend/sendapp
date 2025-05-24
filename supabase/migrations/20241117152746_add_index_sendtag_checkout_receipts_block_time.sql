-- Add index on sendtag_checkout_receipts.block_time
create index concurrently sendtag_checkout_receipts_block_time on sendtag_checkout_receipts (block_time);