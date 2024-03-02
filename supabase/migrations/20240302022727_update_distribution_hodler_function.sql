
create table send_liquidity_pools (
    id serial primary key,
    address bytea not null,
    chain_id integer not null
);

alter table send_liquidity_pools enable row level security;

insert into send_liquidity_pools (address, chain_id) 
values (decode('a1b2457c0b627f97f6cc892946a382451e979014', 'hex'), 8543);

-- create function to look up eligible hodler addresses for a distribution
create or replace function "public"."distribution_hodler_addresses"(distribution_id integer) returns setof chain_addresses language plpgsql security definer
    set search_path = public as $$ begin --

    -- get the distribution
    if (
        select 1
        from distributions
        where id = distribution_id
        limit 1
    ) is null then raise exception 'Distribution not found.';

    end if;

-- return the hodler addresses that had no sells during the qualification period and have verifications
    return query
        select distinct chain_addresses.*
        from distributions
                 join distribution_verifications on distribution_verifications.distribution_id = distributions.id
                 join chain_addresses on chain_addresses.user_id = distribution_verifications.user_id
                 left join send_token_transfers on
                     lower(concat('0x', encode(send_token_transfers.f, 'hex')))::citext = chain_addresses.address
            and send_token_transfers.t in (select send_liquidity_pools.address from send_liquidity_pools)
            and to_timestamp(send_token_transfers.block_time) >= distributions.qualification_start
            and to_timestamp(send_token_transfers.block_time) <= distributions.qualification_end
        where send_token_transfers.f is null
          and distributions.id = $1;

end;

$$;

-- only service role can execute this function
REVOKE EXECUTE ON FUNCTION "public"."distribution_hodler_addresses"(integer)
    FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION "public"."distribution_hodler_addresses"(integer)
    FROM anon;

REVOKE EXECUTE ON FUNCTION "public"."distribution_hodler_addresses"(integer)
    FROM authenticated;
