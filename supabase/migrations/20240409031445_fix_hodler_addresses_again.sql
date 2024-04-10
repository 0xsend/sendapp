CREATE OR REPLACE FUNCTION public.distribution_hodler_addresses(distribution_id integer)
 RETURNS SETOF chain_addresses
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ begin --

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
        with sellers as (
    -- find sellers during the qualification period
    select lower(concat('0x', encode(f, 'hex')))::citext as seller
    from distributions
             join send_token_transfers
                  on to_timestamp(send_token_transfers.block_time) >= distributions.qualification_start and
                     to_timestamp(send_token_transfers.block_time) <= distributions.qualification_end
             join send_liquidity_pools on send_liquidity_pools.address = send_token_transfers.t
    where distributions.id = $1 )
    -- the hodler addresses that had no sells during the qualification period and have verifications
    select distinct chain_addresses.*
    from distributions
            join distribution_verifications on distribution_verifications.distribution_id = distributions.id
            join chain_addresses on chain_addresses.user_id = distribution_verifications.user_id
    where distributions.id = $1
    and chain_addresses.address not in ( select seller from sellers );

end;

$function$
;
