-- Add index on send_revenues_safe_receives.block_time
create index concurrently send_revenues_safe_receives_block_time on send_revenues_safe_receives (block_time);