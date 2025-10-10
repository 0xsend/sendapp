set check_function_bodies = off;

ALTER TYPE "public"."profile_lookup_result"
  ADD ATTRIBUTE "verified_at" timestamptz;

ALTER TYPE "public"."tag_search_result"
  ADD ATTRIBUTE "verified_at" timestamptz;

CREATE OR REPLACE FUNCTION public.verified_at(p profiles)
 RETURNS timestamptz
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
SELECT (
  SELECT CASE
    WHEN tag_at IS NOT NULL AND hodler_at IS NOT NULL AND earn_at IS NOT NULL
      THEN GREATEST(tag_at, hodler_at, earn_at)
    ELSE NULL
  END
  FROM (
    SELECT
      -- Active distribution (current window)
      d.id,
      -- Earliest time user satisfied tag_registration for this distribution
      (
        SELECT MIN(dv.created_at) AS tag_at
        FROM distribution_verifications dv
        WHERE dv.user_id = p.id
          AND dv.distribution_id = d.id
          AND dv.type = 'tag_registration'::verification_type
          AND dv.weight > 0
      ) AS tag_at,
      -- Earliest time user satisfied hodler threshold for this distribution
      (
        SELECT MIN(dv.created_at) AS hodler_at
        FROM distribution_verifications dv
        WHERE dv.user_id = p.id
          AND dv.distribution_id = d.id
          AND dv.type = 'send_token_hodler'::verification_type
          AND dv.weight >= d.hodler_min_balance
      ) AS hodler_at,
      -- Earliest time any of the user's earn balances met the threshold
      (
        SELECT MIN(to_timestamp(ebt.block_time) AT TIME ZONE 'UTC') AS earn_at
        FROM send_earn_balances_timeline ebt
        JOIN send_accounts sa
          ON decode(replace(sa.address::text, ('0x'::citext)::text, ''::text), 'hex') = ebt.owner
        WHERE sa.user_id = p.id
          AND ebt.assets >= d.earn_min_balance
      ) AS earn_at
    FROM (
      SELECT id, hodler_min_balance, earn_min_balance, qualification_start
      FROM distributions
      WHERE qualification_start <= (now() AT TIME ZONE 'UTC')
        AND qualification_end   >= (now() AT TIME ZONE 'UTC')
      ORDER BY qualification_start DESC
      LIMIT 1
    ) d
  ) s
);
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
        public.verified_at(p) IS NOT NULL AS is_verified,
        public.verified_at(p) AS verified_at
    from profiles p
    join auth.users a on a.id = p.id
    left join send_accounts sa on sa.user_id = p.id
    left join tags mt on mt.id = sa.main_tag_id
    left join send_account_tags sat on sat.send_account_id = sa.id
    left join tags t on t.id = sat.tag_id and t.status = 'confirmed'::tag_status
    where ((lookup_type = 'sendid' and p.send_id::text = identifier) or
           (lookup_type = 'tag'    and t.name = identifier::citext) or
           (lookup_type = 'refcode' and p.referral_code = identifier) or
           (lookup_type = 'address' and sa.address = identifier) or
           (p.is_public and lookup_type = 'phone' and a.phone::text = identifier))
      and (p.is_public
        or ( select auth.uid() ) is not null
        or current_setting('role')::text = 'service_role')
    limit 1;
end;
$function$;

create or replace view "public"."referrer" as  WITH referrer AS (
         SELECT p.send_id
           FROM (referrals r
             JOIN profiles p ON ((r.referrer_id = p.id)))
          WHERE (r.referred_id = ( SELECT auth.uid() AS uid))
          ORDER BY r.created_at
         LIMIT 1
        ), profile_lookup AS (
         SELECT pl.id,
            pl.avatar_url,
            pl.name,
            pl.about,
            pl.refcode,
            pl.x_username,
            pl.birthday,
            pl.tag,
            pl.address,
            pl.chain_id,
            pl.is_public,
            pl.sendid,
            pl.all_tags,
            pl.main_tag_id,
            pl.main_tag_name,
            pl.links_in_bio,
            pl.banner_url,
            pl.is_verified,
            pl.verified_at,
            referrer.send_id
           FROM profile_lookup('sendid'::lookup_type_enum, ( SELECT (referrer_1.send_id)::text AS send_id FROM referrer referrer_1)) AS pl
             JOIN referrer ON ((referrer.send_id IS NOT NULL))
        )
 SELECT profile_lookup.id,
    profile_lookup.avatar_url,
    profile_lookup.name,
    profile_lookup.about,
    profile_lookup.refcode,
    profile_lookup.x_username,
    profile_lookup.birthday,
    profile_lookup.tag,
    profile_lookup.address,
    profile_lookup.chain_id,
    profile_lookup.is_public,
    profile_lookup.sendid,
    profile_lookup.all_tags,
    profile_lookup.main_tag_id,
    profile_lookup.main_tag_name,
    profile_lookup.links_in_bio,
    profile_lookup.send_id,
    profile_lookup.banner_url,
    profile_lookup.is_verified,
    profile_lookup.verified_at
   FROM profile_lookup;


CREATE OR REPLACE FUNCTION public.tag_search(query text, limit_val integer, offset_val integer)
 RETURNS TABLE(send_id_matches tag_search_result[], tag_matches tag_search_result[], phone_matches tag_search_result[])
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
BEGIN
    IF limit_val IS NULL OR(limit_val <= 0 OR limit_val > 100) THEN
        RAISE EXCEPTION 'limit_val must be between 1 and 100';
    END IF;
    IF offset_val IS NULL OR offset_val < 0 THEN
        RAISE EXCEPTION 'offset_val must be greater than or equal to 0';
    END IF;
    RETURN query
    SELECT
        -- send_id matches
(
            SELECT
                array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone, sub.is_verified, sub.verified_at)::public.tag_search_result)
            FROM(
                SELECT
                    p.avatar_url,
                    t.name AS tag_name,
                    p.send_id,
                    NULL::text AS phone,
                    (public.verified_at(p) IS NOT NULL) AS is_verified,
                    public.verified_at(p) AS verified_at
                FROM
                    profiles p
                LEFT JOIN send_accounts sa ON sa.user_id = p.id
                LEFT JOIN send_account_tags sat ON sat.send_account_id = sa.id
                LEFT JOIN tags t ON t.id = sat.tag_id
                    AND t.status = 'confirmed'
            WHERE
                query SIMILAR TO '\d+'
                AND p.send_id::varchar LIKE '%' || query || '%'
            ORDER BY
                p.send_id
            LIMIT limit_val offset offset_val) sub) AS send_id_matches,
    -- tag matches
    (
        SELECT
            array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone, sub.is_verified, sub.verified_at)::public.tag_search_result)
        FROM (
            SELECT
                ranked_matches.avatar_url,
                ranked_matches.tag_name,
                ranked_matches.send_id,
                ranked_matches.phone,
                ranked_matches.is_verified,
                ranked_matches.verified_at
            FROM (
                WITH scores AS (
                    -- Aggregate user send scores, summing all scores for cumulative activity
                    SELECT
                        user_id,
                        SUM(score) AS total_score
                    FROM private.send_scores_history
                    GROUP BY user_id
                ),
                tag_matches AS (
                    SELECT
                        p.avatar_url,
                        t.name AS tag_name,
                        p.send_id,
                        NULL::text AS phone,
                        (public.verified_at(p) IS NOT NULL) AS is_verified,
                        public.verified_at(p) AS verified_at,
                        (t.name <-> query) AS distance,  -- Trigram distance (kept for debugging/ties)
                        COALESCE(scores.total_score, 0) AS send_score,
                        -- Compute exact match flag in CTE
                        LOWER(t.name) = LOWER(query) AS is_exact,
                        -- Primary ranking: exact matches (primary_rank=0) always outrank fuzzy matches (primary_rank=1)
                        CASE WHEN LOWER(t.name) = LOWER(query) THEN 0 ELSE 1 END AS primary_rank
                    FROM profiles p
                    JOIN send_accounts sa ON sa.user_id = p.id
                    JOIN send_account_tags sat ON sat.send_account_id = sa.id
                    JOIN tags t ON t.id = sat.tag_id
                        AND t.status = 'confirmed'
                    LEFT JOIN scores ON scores.user_id = p.id
                    WHERE
                        -- Use ILIKE '%' only when NOT exact to avoid excluding true exact matches like 'Ethen_'
                        LOWER(t.name) = LOWER(query)
                        OR (NOT (LOWER(t.name) = LOWER(query)) AND (t.name <<-> query < 0.7 OR t.name ILIKE '%' || query || '%'))
                )
                SELECT
                    tm.avatar_url,
                    tm.tag_name,
                    tm.send_id,
                    tm.phone,
                    tm.is_verified,
                    tm.distance,
                    tm.send_score,
                    tm.is_exact,
                    tm.primary_rank,
                    -- Verification bucket for ranking within fuzzy matches: 0 verified, 1 unverified. Exact bucket unaffected.
                    CASE WHEN tm.is_exact THEN 1 ELSE CASE WHEN tm.is_verified THEN 0 ELSE 1 END END AS verification_rank,
                    -- Higher score should sort earlier -> negative for ascending order
                    -tm.send_score AS score_rank,
                    ROW_NUMBER() OVER (
                        PARTITION BY tm.send_id
                        ORDER BY
                            tm.primary_rank,
                            CASE WHEN tm.is_exact THEN 1 ELSE CASE WHEN tm.is_verified THEN 0 ELSE 1 END END,
                            -tm.send_score
                    ) AS rn
                FROM tag_matches tm
            ) ranked_matches
            WHERE ranked_matches.rn = 1
            ORDER BY ranked_matches.primary_rank ASC,
                     ranked_matches.verification_rank ASC,
                     ranked_matches.score_rank ASC
            LIMIT limit_val OFFSET offset_val
        ) sub
    ) AS tag_matches,
    -- phone matches, disabled for now
    (null::public.tag_search_result[]) AS phone_matches;
END;
$function$
;