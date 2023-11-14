alter table "public"."distribution_shares"
add column "index" bigint null;

-- update existing rows
WITH CTE AS (
    SELECT id,
        ROW_NUMBER() OVER (
            PARTITION BY distribution_id
            ORDER BY address
        ) - 1 AS rn
    FROM distribution_shares
)
UPDATE distribution_shares ds
SET "index" = CTE.rn
FROM CTE
WHERE ds.id = CTE.id;

-- make "index" is not null
alter table distribution_shares
alter column "index"
set not null;

-- create unique index for "index" and distribution_id
CREATE UNIQUE INDEX distribution_shares_distribution_id_index_uindex ON public.distribution_shares USING btree (distribution_id, index);

set check_function_bodies = off;

create or replace function public.update_distribution_shares(
        distribution_id integer,
        shares distribution_shares []
    ) returns void language plpgsql security definer
set search_path to 'public' as $function$ begin --

    -- validate shares are greater than 0
    if (
        select count(*)
        from unnest(shares) shares
        where shares.amount <= 0
    ) > 0 then raise exception 'Shares must be greater than 0.';

end if;

-- get the distribution
if (
    select 1
    from distributions d
    where d.id = $1
    limit 1
) is null then raise exception 'Distribution not found.';

end if;

-- validate shares are for the correct distribution
if (
    select count(distinct id)
    from distributions
    where id in (
            select shares.distribution_id
            from unnest(shares) shares
        )
) <> 1 then raise exception 'Shares are for the wrong distribution.';

end if;

-- delete existing shares
delete from distribution_shares
where distribution_shares.distribution_id = $1;

-- insert new shares
insert into distribution_shares (
        distribution_id,
        user_id,
        address,
        amount,
        hodler_pool_amount,
        bonus_pool_amount,
        fixed_pool_amount,
        "index"
    )
select update_distribution_shares.distribution_id,
    shares.user_id,
    shares.address,
    shares.amount,
    shares.hodler_pool_amount,
    shares.bonus_pool_amount,
    shares.fixed_pool_amount,
    row_number() over (
        partition by update_distribution_shares.distribution_id
        order by shares.address
    ) - 1 as "index"
from unnest(shares) shares
order by shares.address;

end;

$function$;
