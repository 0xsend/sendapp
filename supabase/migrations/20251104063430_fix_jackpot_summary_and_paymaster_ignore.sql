set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.send_account_transfers_delete_temporal_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    ignored_addresses bytea[] := ARRAY['\xb1b01dc21a6537af7f9a46c76276b14fd7ceac67'::bytea, '\x592e1224d203be4214b15e205f6081fbbacfcd2d'::bytea, '\x36f43082d01df4801af2d95aeed1a0200c5510ae'::bytea];
begin
    -- Check if it's from or to any ignored address (e.g., paymaster)
    if (NEW.f is not null and NEW.f = ANY (ignored_addresses)) or
       (NEW.t is not null and NEW.t = ANY (ignored_addresses)) then
        return NEW;
    end if;
    delete from public.activity a
    using temporal.send_account_transfers t_sat
    where a.event_name = 'temporal_send_account_transfers'
      and a.event_id = t_sat.workflow_id
      and t_sat.created_at_block_num <= NEW.block_num
      and t_sat.status IN ('initialized', 'submitted', 'sent', 'confirmed', 'cancelled');
    return NEW;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS SETOF profile_lookup_result
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
begin
    if identifier is null or identifier = '' then raise exception 'identifier cannot be null or empty'; end if;
    if lookup_type is null then raise exception 'lookup_type cannot be null'; end if;

    RETURN QUERY
    WITH current_distribution_id AS (
        SELECT id FROM distributions
        WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
          AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
        ORDER BY qualification_start DESC
        LIMIT 1
    )
    SELECT
        case when p.id = ( select auth.uid() ) then p.id end,
        p.avatar_url::text,
        p.name::text,
        p.about::text,
        p.referral_code,
        CASE WHEN p.is_public THEN p.x_username ELSE NULL END,
        CASE WHEN p.is_public THEN p.birthday ELSE NULL END,
        COALESCE(mt.name, t.name),
        sa.address,
        sa.chain_id,
        case when current_setting('role')::text = 'service_role' then p.is_public
            when p.is_public then true
            else false end,
        p.send_id,
        ( select array_agg(t2.name::text)
          from tags t2
          join send_account_tags sat2 on sat2.tag_id = t2.id
          join send_accounts sa2 on sa2.id = sat2.send_account_id
          where sa2.user_id = p.id and t2.status = 'confirmed'::tag_status ),
        case when p.id = ( select auth.uid() ) then sa.main_tag_id end,
        mt.name::text,
        CASE WHEN p.is_public THEN
(SELECT array_agg(link_in_bio_row)
            FROM (
                SELECT ROW(
                    CASE WHEN lib.user_id = (SELECT auth.uid()) THEN lib.id ELSE NULL END,
                    CASE WHEN lib.user_id = (SELECT auth.uid()) THEN lib.user_id ELSE NULL END,
                    lib.handle,
                    lib.domain_name,
                    lib.created_at,
                    lib.updated_at,
                    lib.domain
                )::link_in_bio as link_in_bio_row
                FROM link_in_bio lib
                WHERE lib.user_id = p.id AND lib.handle IS NOT NULL
            ) sub)
        ELSE NULL
        END,
        p.banner_url::text,
        CASE WHEN ds.user_id IS NOT NULL THEN true ELSE false END AS is_verified
    from profiles p
    join auth.users a on a.id = p.id
    left join send_accounts sa on sa.user_id = p.id
    left join tags mt on mt.id = sa.main_tag_id
    left join send_account_tags sat on sat.send_account_id = sa.id
    left join tags t on t.id = sat.tag_id and t.status = 'confirmed'::tag_status
    left join distribution_shares ds on ds.user_id = p.id
        and ds.distribution_id = (select id from current_distribution_id)
    where ((lookup_type = 'sendid' and p.send_id::text = identifier) or
        (lookup_type = 'tag' and t.name = identifier::citext) or
        (lookup_type = 'refcode' and p.referral_code = identifier) or
        (lookup_type = 'address' and sa.address = identifier::citext) or
        (p.is_public and lookup_type = 'phone' and a.phone::text = identifier))
    and (p.is_public
     or ( select auth.uid() ) is not null
     or current_setting('role')::text = 'service_role')
    limit 1;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_jackpot_summary(num_runs integer)
 RETURNS TABLE(jackpot_run_id integer, jackpot_block_num numeric, jackpot_block_time numeric, winner bytea, win_amount numeric, total_tickets numeric, winner_tag_name citext)
 LANGUAGE sql
AS $function$
WITH cte AS (
  SELECT
    r.id AS jackpot_run_id,
    r.block_num AS jackpot_block_num,
    r.block_time AS jackpot_block_time,
    r.winner,
    r.win_amount,
    -- "prev_block_num" is the block_num of the previous jackpot (or 0 if none)
    COALESCE(
      LAG(r.block_num) OVER (ORDER BY r.block_num ASC),
      0
    ) AS prev_block_num
  FROM public.sendpot_jackpot_runs r
)
SELECT
  c.jackpot_run_id,
  c.jackpot_block_num,
  c.jackpot_block_time,
  c.winner,
  c.win_amount,
  (
    SELECT COALESCE(SUM(utp.tickets_purchased_total_bps), 0)
    FROM public.sendpot_user_ticket_purchases utp
    WHERE utp.block_num >= c.prev_block_num
      AND utp.block_num < c.jackpot_block_num
  ) AS total_tickets,
  pl.winner_tag_name
FROM cte c
LEFT JOIN LATERAL (
  SELECT COALESCE(pl.main_tag_name, pl.all_tags[1])::public.citext AS winner_tag_name
  FROM public.profile_lookup(
    'address'::public.lookup_type_enum,
    concat('0x', encode(c.winner, 'hex'))::text
  ) pl
  LIMIT 1
) pl ON c.winner IS NOT NULL
ORDER BY c.jackpot_block_num DESC
LIMIT num_runs;
$function$
;

