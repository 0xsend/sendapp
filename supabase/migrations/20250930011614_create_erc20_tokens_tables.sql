-- Create ERC20 token indexing tables
-- This migration creates three tables:
-- 1. erc20_tokens: Core on-chain token data
-- 2. erc20_token_activity: Activity metrics for prioritization
-- 3. erc20_token_metadata: Off-chain enriched metadata

-- =============================================================================
-- Table 1: erc20_tokens
-- Core on-chain token data discovered from Transfer events
-- =============================================================================

create table if not exists "public"."erc20_tokens"(
    -- Token identification
    "address" bytea not null,
    "chain_id" numeric not null,
    -- Token properties (from ERC20 contract calls)
    "name" text,
    "symbol" text,
    "decimals" smallint,
    "total_supply" numeric,
    -- Discovery metadata (block/tx where first seen)
    "block_num" numeric not null,
    "block_time" numeric not null,
    "tx_hash" bytea not null,
    -- Shovel metadata (nullable, only if indexed by Shovel)
    "ig_name" text,
    "src_name" text,
    "tx_idx" integer,
    "log_idx" integer,
    -- Timestamps
    "created_at" timestamp with time zone default now() not null,
    -- Primary key
    constraint "erc20_tokens_pkey" primary key("address", "chain_id")
);

-- Indexes for erc20_tokens
create index "erc20_tokens_chain_id_idx" on "public"."erc20_tokens" using btree("chain_id");

create index "erc20_tokens_symbol_idx" on "public"."erc20_tokens" using btree("symbol");

create index "erc20_tokens_block_time_idx" on "public"."erc20_tokens" using btree("block_time" desc);

create index "erc20_tokens_created_at_idx" on "public"."erc20_tokens" using btree("created_at" desc);

-- RLS policies for erc20_tokens
alter table "public"."erc20_tokens" enable row level security;

create policy "Anyone can read erc20_tokens" on "public"."erc20_tokens" for
select
    using (true);

-- =============================================================================
-- Table 2: erc20_token_activity
-- Activity metrics for prioritizing metadata enrichment
-- =============================================================================

create table if not exists "public"."erc20_token_activity"(
    "token_address" bytea not null,
    "chain_id" numeric not null,
    -- Activity metrics (last 24h)
    "transfer_count_24h" integer default 0,
    "unique_holders_24h" integer default 0,
    "volume_24h" numeric default 0,
    -- Activity metrics (last 7d)
    "transfer_count_7d" integer default 0,
    "unique_holders_7d" integer default 0,
    "volume_7d" numeric default 0,
    -- Activity metrics (last 30d)
    "transfer_count_30d" integer default 0,
    "unique_holders_30d" integer default 0,
    "volume_30d" numeric default 0,
    -- All-time metrics
    "total_transfers" integer default 0,
    "total_unique_holders" integer default 0,
    "total_volume" numeric default 0,
    -- Prioritization score (calculated automatically)
    "priority_score" numeric default 0,
    -- Timestamps
    "last_updated" timestamp with time zone default now() not null,
    -- Primary key
    constraint "erc20_token_activity_pkey" primary key("token_address", "chain_id"),
    -- Foreign key
    constraint "erc20_token_activity_token_fkey" foreign key("token_address", "chain_id") references "public"."erc20_tokens"("address", "chain_id") on delete cascade
);

-- Indexes for erc20_token_activity
create index "erc20_token_activity_priority_idx" on "public"."erc20_token_activity" using btree("priority_score" desc);

create index "erc20_token_activity_updated_idx" on "public"."erc20_token_activity" using btree("last_updated");

-- RLS policies for erc20_token_activity
alter table "public"."erc20_token_activity" enable row level security;

create policy "Anyone can read erc20_token_activity" on "public"."erc20_token_activity" for
select
    using (true);

-- Function to calculate priority score
create
or replace function "public"."calculate_token_priority_score"(
    transfers_24h integer,
    holders_24h integer,
    volume_24h numeric,
    transfers_7d integer,
    holders_7d integer,
    volume_7d numeric
) returns numeric as $$
BEGIN
    -- Weighted formula: recent activity matters more
    RETURN (
        (COALESCE(transfers_24h, 0) * 10) +
        (COALESCE(holders_24h, 0) * 5) +
        (COALESCE(volume_24h, 0) / 1e18) + -- Normalize volume
        (COALESCE(transfers_7d, 0) * 2) +
        (COALESCE(holders_7d, 0) * 1)
    );
END;
$$ language plpgsql immutable;

-- Trigger function to auto-update priority score
create
or replace function "public"."update_token_priority_score"() returns trigger as $$
BEGIN
    NEW.priority_score = public.calculate_token_priority_score(
        NEW.transfer_count_24h,
        NEW.unique_holders_24h,
        NEW.volume_24h,
        NEW.transfer_count_7d,
        NEW.unique_holders_7d,
        NEW.volume_7d
    );
    NEW.last_updated = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Trigger to update priority score on insert or update
create trigger "update_token_priority_score_trigger" before insert
or
update on "public"."erc20_token_activity" for each row execute function "public"."update_token_priority_score"();

-- =============================================================================
-- Table 3: erc20_token_metadata
-- Off-chain enriched metadata from CoinGecko and CoinMarketCap
-- =============================================================================

create table if not exists "public"."erc20_token_metadata"(
    "token_address" bytea not null,
    "chain_id" numeric not null,
    -- External service IDs
    "cmc_id" integer,
    "coingecko_id" text,
    -- Descriptive metadata
    "logo_url" text,
    "description" text,
    "website" text,
    "twitter" text,
    "discord" text,
    "telegram" text,
    -- Market data (cached, updated periodically)
    "market_cap_usd" numeric,
    "price_usd" numeric,
    "volume_24h_usd" numeric,
    "circulating_supply" numeric,
    "max_supply" numeric,
    -- Enrichment tracking
    "enrichment_attempts" integer default 0,
    "last_enrichment_attempt" timestamp with time zone,
    "last_successful_enrichment" timestamp with time zone,
    "metadata_source" text,
    -- 'coingecko', 'cmc', 'manual', null
    -- Timestamps
    "created_at" timestamp with time zone default now() not null,
    "updated_at" timestamp with time zone default now() not null,
    -- Primary key
    constraint "erc20_token_metadata_pkey" primary key("token_address", "chain_id"),
    -- Foreign key
    constraint "erc20_token_metadata_token_fkey" foreign key("token_address", "chain_id") references "public"."erc20_tokens"("address", "chain_id") on delete cascade
);

-- Indexes for erc20_token_metadata
create index "erc20_token_metadata_enrichment_idx" on "public"."erc20_token_metadata" using btree("last_successful_enrichment" nulls first);

create index "erc20_token_metadata_attempts_idx" on "public"."erc20_token_metadata" using btree("enrichment_attempts");

create index "erc20_token_metadata_cmc_id_idx" on "public"."erc20_token_metadata" using btree("cmc_id");

create index "erc20_token_metadata_coingecko_id_idx" on "public"."erc20_token_metadata" using btree("coingecko_id");

-- RLS policies for erc20_token_metadata
alter table "public"."erc20_token_metadata" enable row level security;

create policy "Anyone can read erc20_token_metadata" on "public"."erc20_token_metadata" for
select
    using (true);

-- Trigger function to update updated_at timestamp
create
or replace function "public"."update_erc20_token_metadata_updated_at"() returns trigger as $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

-- Trigger to update updated_at on metadata changes
create trigger "update_erc20_token_metadata_updated_at_trigger" before
update on "public"."erc20_token_metadata" for each row execute function "public"."update_erc20_token_metadata_updated_at"();

-- =============================================================================
-- Grants
-- =============================================================================

grant all on table "public"."erc20_tokens" to "anon";

grant all on table "public"."erc20_tokens" to "authenticated";

grant all on table "public"."erc20_tokens" to "service_role";

grant all on table "public"."erc20_token_activity" to "anon";

grant all on table "public"."erc20_token_activity" to "authenticated";

grant all on table "public"."erc20_token_activity" to "service_role";

grant all on table "public"."erc20_token_metadata" to "anon";

grant all on table "public"."erc20_token_metadata" to "authenticated";

grant all on table "public"."erc20_token_metadata" to "service_role";

grant
execute on function "public"."calculate_token_priority_score"(integer, integer, numeric, integer, integer, numeric) to "anon";

grant
execute on function "public"."calculate_token_priority_score"(integer, integer, numeric, integer, integer, numeric) to "authenticated";

grant
execute on function "public"."calculate_token_priority_score"(integer, integer, numeric, integer, integer, numeric) to "service_role";

grant
execute on function "public"."update_token_priority_score"() to "anon";

grant
execute on function "public"."update_token_priority_score"() to "authenticated";

grant
execute on function "public"."update_token_priority_score"() to "service_role";

grant
execute on function "public"."update_erc20_token_metadata_updated_at"() to "anon";

grant
execute on function "public"."update_erc20_token_metadata_updated_at"() to "authenticated";

grant
execute on function "public"."update_erc20_token_metadata_updated_at"() to "service_role";