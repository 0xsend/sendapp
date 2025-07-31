set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_friends()
 RETURNS TABLE(avatar_url text, send_id integer, x_username text, links_in_bio link_in_bio[], birthday date, tag citext, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
        WITH ordered_referrals AS(
            SELECT
                DISTINCT ON (r.referred_id)
                p.avatar_url,
                p.send_id,
                CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
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
                END AS links_in_bio,
                CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
                t.name AS tag,
                t.created_at,
                COALESCE((
                             SELECT
                                 SUM(amount)
                             FROM distribution_shares ds
                             WHERE
                                 ds.user_id = r.referred_id
                               AND distribution_id >= 6), 0) AS send_score
            FROM
                referrals r
                    LEFT JOIN affiliate_stats a ON a.user_id = r.referred_id
                    LEFT JOIN profiles p ON p.id = r.referred_id
                    LEFT JOIN tags t ON t.user_id = r.referred_id
            WHERE
                r.referrer_id = (SELECT auth.uid())
                AND t.status = 'confirmed'::tag_status
            ORDER BY
                r.referred_id,
                t.created_at DESC)
        SELECT
            o.avatar_url,
            o.send_id,
            o.x_username,
            o.links_in_bio,
            o.birthday,
            o.tag,
            o.created_at
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
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
        p.banner_url::text
    from profiles p
    join auth.users a on a.id = p.id
    left join send_accounts sa on sa.user_id = p.id
    left join tags mt on mt.id = sa.main_tag_id
    left join send_account_tags sat on sat.send_account_id = sa.id
    left join tags t on t.id = sat.tag_id and t.status = 'confirmed'::tag_status
    where ((lookup_type = 'sendid' and p.send_id::text = identifier) or
        (lookup_type = 'tag' and t.name = identifier::citext) or
        (lookup_type = 'refcode' and p.referral_code = identifier) or
        (lookup_type = 'address' and sa.address = identifier) or
        (p.is_public and lookup_type = 'phone' and a.phone::text = identifier))
    and (p.is_public
     or ( select auth.uid() ) is not null
     or current_setting('role')::text = 'service_role')
    limit 1;
end;
$function$
;


