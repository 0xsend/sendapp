-- Add ERC20 token auto-discovery from send_account_transfers
-- This trigger automatically discovers new ERC20 tokens when Send users interact with them

-- =============================================================================
-- Function: Auto-discover tokens from transfers
-- =============================================================================

create
or replace function "public"."discover_token_from_transfer"() returns trigger as $$
BEGIN
  -- Only process if token doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM erc20_tokens
    WHERE address = NEW.log_addr AND chain_id = NEW.chain_id
  ) THEN
    -- Insert placeholder record (name, symbol, decimals will be enriched later)
    INSERT INTO erc20_tokens (
      address,
      chain_id,
      block_num,
      block_time,
      tx_hash,
      ig_name,
      src_name,
      tx_idx,
      log_idx
    ) VALUES (
      NEW.log_addr,
      NEW.chain_id,
      NEW.block_num,
      NEW.block_time,
      NEW.tx_hash,
      NEW.ig_name,
      NEW.src_name,
      NEW.tx_idx,
      NEW.log_idx
    )
    ON CONFLICT (address, chain_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ language plpgsql security definer;

-- =============================================================================
-- Trigger: Discover tokens from send_account_transfers
-- =============================================================================

create trigger "trigger_discover_token_from_transfer" after insert on "public"."send_account_transfers" for each row execute function "public"."discover_token_from_transfer"();

-- =============================================================================
-- Helper Functions for Token Enrichment
-- =============================================================================

-- Function to get tokens that need metadata enrichment (name, symbol, decimals)
-- Prioritizes tokens by total balance held across all users
create
or replace function "public"."get_tokens_needing_enrichment"(limit_count integer default 100) returns table(
    token_address bytea,
    chain_id numeric,
    block_time numeric
) as $$
BEGIN
  RETURN QUERY
  SELECT
    et.address,
    et.chain_id,
    et.block_time
  FROM erc20_tokens et
  LEFT JOIN (
    SELECT
      token_address,
      chain_id,
      SUM(balance) as total_balance,
      COUNT(DISTINCT send_account_address) as holder_count
    FROM erc20_balances
    WHERE balance > 0
    GROUP BY token_address, chain_id
  ) bal ON bal.token_address = et.address AND bal.chain_id = et.chain_id
  WHERE
    et.name IS NULL
    OR et.symbol IS NULL
    OR et.decimals IS NULL
  ORDER BY
    COALESCE(bal.total_balance, 0) DESC,  -- Highest total balance first
    COALESCE(bal.holder_count, 0) DESC,   -- Most holders second
    et.block_time DESC                     -- Newest tokens third
  LIMIT limit_count;
END;
$$ language plpgsql security definer;

-- =============================================================================
-- Grants
-- =============================================================================

grant
execute on function "public"."discover_token_from_transfer"() to "anon";

grant
execute on function "public"."discover_token_from_transfer"() to "authenticated";

grant
execute on function "public"."discover_token_from_transfer"() to "service_role";

grant
execute on function "public"."get_tokens_needing_enrichment"(integer) to "anon";

grant
execute on function "public"."get_tokens_needing_enrichment"(integer) to "authenticated";

grant
execute on function "public"."get_tokens_needing_enrichment"(integer) to "service_role";
