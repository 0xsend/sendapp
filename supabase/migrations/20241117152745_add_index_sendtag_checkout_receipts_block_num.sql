-- Add index on sendtag_checkout_receipts.block_num
create index concurrently sendtag_checkout_receipts_block_num on sendtag_checkout_receipts (block_num);