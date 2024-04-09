-- fix Base chain id
update send_liquidity_pools set chain_id = 8453 where chain_id = 8543;

-- set distribution 4 qualification time from Apr 8th to Apr 15th
update distributions set qualification_start = '2024-04-08T00:00:00Z', qualification_end = '2024-04-15T00:00:00Z'
where number = 4;

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
        select distinct chain_addresses.*
        from distributions
                 join distribution_verifications on distribution_verifications.distribution_id = distributions.id
                 join chain_addresses on chain_addresses.user_id = distribution_verifications.user_id
                 left join send_token_transfers on
                    lower(concat('0x', encode(send_token_transfers.f, 'hex')))::citext = chain_addresses.address
                    and to_timestamp(send_token_transfers.block_time) >= distributions.qualification_start
                    and to_timestamp(send_token_transfers.block_time) <= distributions.qualification_end
                 left join send_liquidity_pools on send_token_transfers.t = send_liquidity_pools.address
                    and send_liquidity_pools.chain_id = distributions.chain_id
        where send_token_transfers.f is null and
              send_liquidity_pools.address is null
          and distributions.id = $1;

end;

$function$
;

