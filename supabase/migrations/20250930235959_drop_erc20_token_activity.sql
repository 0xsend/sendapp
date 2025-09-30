-- Drop unused erc20_token_activity table
-- This table was created but never actually used - activity metrics were never populated
-- and priority scoring was never utilized by the enrichment cron.

-- =============================================================================
-- Drop Functions and Triggers
-- =============================================================================

-- Drop trigger first
drop trigger if exists "update_token_priority_score_trigger" on "public"."erc20_token_activity";

-- Drop trigger function
drop function if exists "public"."update_token_priority_score"();

-- Drop priority score calculation function
drop function if exists "public"."calculate_token_priority_score"(integer, integer, numeric, integer, integer, numeric);

-- =============================================================================
-- Drop Table
-- =============================================================================

drop table if exists "public"."erc20_token_activity";