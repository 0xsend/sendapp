-- Add ERC20 balance tracking for Send addresses
-- This migration creates a materialized view of token balances calculated from transfers

-- =============================================================================
-- Table: erc20_balances
-- Materialized view of current token balances for Send addresses
-- =============================================================================

create table if not exists "public"."erc20_balances"(
    "send_account_address" bytea not null,
    "chain_id" numeric not null,
    "token_address" bytea not null,
    "balance" numeric not null default 0,
    "last_updated_block" numeric not null,
    "last_updated_time" timestamp with time zone not null,
    constraint "erc20_balances_pkey" primary key("send_account_address", "chain_id", "token_address"),
    constraint "erc20_balances_token_fkey" foreign key("token_address", "chain_id") references "public"."erc20_tokens"("address", "chain_id") on delete cascade
);

-- Indexes for erc20_balances
create index "erc20_balances_token_idx" on "public"."erc20_balances" using btree("token_address", "chain_id");

create index "erc20_balances_address_idx" on "public"."erc20_balances" using btree("send_account_address", "chain_id");

create index "erc20_balances_balance_idx" on "public"."erc20_balances" using btree("balance" desc) where balance > 0;

-- RLS policies for erc20_balances
alter table "public"."erc20_balances" enable row level security;

create policy "Users can see own balances" on "public"."erc20_balances" for
select
    using (
        exists (
            select 1
            from send_accounts sa
            where lower(concat('0x', encode(erc20_balances.send_account_address, 'hex')))::citext = sa.address
                and sa.user_id = auth.uid()
                and sa.chain_id = erc20_balances.chain_id
        )
    );

-- =============================================================================
-- Function: Update balances from transfers (real-time)
-- =============================================================================

create
or replace function "public"."update_erc20_balances_from_transfer"() returns trigger as $$
BEGIN
  -- Only process if we have valid chain_id
  IF NEW.chain_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Decrease sender balance
  INSERT INTO erc20_balances (
    send_account_address,
    chain_id,
    token_address,
    balance,
    last_updated_block,
    last_updated_time
  )
  VALUES (
    NEW.f,
    NEW.chain_id,
    NEW.log_addr,
    -NEW.v,
    NEW.block_num,
    to_timestamp(NEW.block_time)
  )
  ON CONFLICT (send_account_address, chain_id, token_address)
  DO UPDATE SET
    balance = erc20_balances.balance - NEW.v,
    last_updated_block = GREATEST(erc20_balances.last_updated_block, NEW.block_num),
    last_updated_time = to_timestamp(NEW.block_time);

  -- Increase receiver balance
  INSERT INTO erc20_balances (
    send_account_address,
    chain_id,
    token_address,
    balance,
    last_updated_block,
    last_updated_time
  )
  VALUES (
    NEW.t,
    NEW.chain_id,
    NEW.log_addr,
    NEW.v,
    NEW.block_num,
    to_timestamp(NEW.block_time)
  )
  ON CONFLICT (send_account_address, chain_id, token_address)
  DO UPDATE SET
    balance = erc20_balances.balance + NEW.v,
    last_updated_block = GREATEST(erc20_balances.last_updated_block, NEW.block_num),
    last_updated_time = to_timestamp(NEW.block_time);

  RETURN NEW;
END;
$$ language plpgsql security definer;

-- =============================================================================
-- Trigger: Update balances on transfer
-- =============================================================================

create trigger "trigger_update_balances_from_transfer" after insert on "public"."send_account_transfers" for each row execute function "public"."update_erc20_balances_from_transfer"();

-- =============================================================================
-- Helper function: Get user balances with token metadata
-- =============================================================================

create
or replace function "public"."get_user_token_balances"(
    p_user_id uuid,
    p_chain_id numeric default 8453
) returns table(
    token_address text,
    token_name text,
    token_symbol text,
    token_decimals smallint,
    balance numeric,
    balance_formatted text,
    last_updated_time timestamp with time zone
) as $$
BEGIN
  RETURN QUERY
  SELECT
    concat('0x', encode(eb.token_address, 'hex')) as token_address,
    et.name as token_name,
    et.symbol as token_symbol,
    et.decimals as token_decimals,
    eb.balance,
    -- Format balance with decimals
    (eb.balance::numeric / power(10, COALESCE(et.decimals, 18)))::text as balance_formatted,
    eb.last_updated_time
  FROM erc20_balances eb
  JOIN send_accounts sa ON
    lower(concat('0x', encode(eb.send_account_address, 'hex')))::citext = sa.address AND
    sa.chain_id = eb.chain_id
  LEFT JOIN erc20_tokens et ON
    et.address = eb.token_address AND
    et.chain_id = eb.chain_id
  WHERE sa.user_id = p_user_id
    AND eb.chain_id = p_chain_id
    AND eb.balance > 0
  ORDER BY eb.balance DESC;
END;
$$ language plpgsql security definer;

-- =============================================================================
-- Grants
-- =============================================================================

grant all on table "public"."erc20_balances" to "anon";

grant all on table "public"."erc20_balances" to "authenticated";

grant all on table "public"."erc20_balances" to "service_role";

grant
execute on function "public"."update_erc20_balances_from_transfer"() to "anon";

grant
execute on function "public"."update_erc20_balances_from_transfer"() to "authenticated";

grant
execute on function "public"."update_erc20_balances_from_transfer"() to "service_role";

grant
execute on function "public"."get_user_token_balances"(uuid, numeric) to "anon";

grant
execute on function "public"."get_user_token_balances"(uuid, numeric) to "authenticated";

grant
execute on function "public"."get_user_token_balances"(uuid, numeric) to "service_role";
