-- Create ERC20 token indexing tables
-- This migration creates two tables:
-- 1. erc20_tokens: Core on-chain token data
-- 2. erc20_token_metadata: Off-chain enriched metadata

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
-- Table 2: erc20_token_metadata
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

grant all on table "public"."erc20_token_metadata" to "anon";

grant all on table "public"."erc20_token_metadata" to "authenticated";

grant all on table "public"."erc20_token_metadata" to "service_role";

grant
execute on function "public"."update_erc20_token_metadata_updated_at"() to "anon";

grant
execute on function "public"."update_erc20_token_metadata_updated_at"() to "authenticated";

grant
execute on function "public"."update_erc20_token_metadata_updated_at"() to "service_role";