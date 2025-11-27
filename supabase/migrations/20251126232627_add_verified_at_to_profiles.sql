-- Step 1: Add verified_at column to profiles
alter table "public"."profiles" add column "verified_at" timestamp with time zone;

-- Step 2: Create index
CREATE INDEX profiles_verified_at_idx ON public.profiles USING btree (verified_at) WHERE (verified_at IS NOT NULL);

set check_function_bodies = off;

-- Step 3: Create trigger functions (before type is recreated)

CREATE OR REPLACE FUNCTION public.refresh_profile_verification_status()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    curr_distribution_id bigint;
BEGIN
    -- Get current distribution
    SELECT id INTO curr_distribution_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    IF curr_distribution_id IS NULL THEN
        -- No current distribution, set all verified_at to NULL
        UPDATE profiles SET verified_at = NULL WHERE verified_at IS NOT NULL;
    ELSE
        -- Set verified_at for users with shares in current distribution
        UPDATE profiles
        SET verified_at = NOW()
        WHERE id IN (
            SELECT DISTINCT user_id
            FROM distribution_shares
            WHERE distribution_id = curr_distribution_id
        )
        AND verified_at IS NULL;

        -- Clear verified_at for users without shares in current distribution
        UPDATE profiles
        SET verified_at = NULL
        WHERE id NOT IN (
            SELECT DISTINCT user_id
            FROM distribution_shares
            WHERE distribution_id = curr_distribution_id
        )
        AND verified_at IS NOT NULL;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_profile_verified_at_on_share_delete()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    curr_distribution_id bigint;
    remaining_shares integer;
BEGIN
    -- Get current distribution
    SELECT id INTO curr_distribution_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Only update if deleting a share for the current distribution
    IF curr_distribution_id IS NOT NULL AND OLD.distribution_id = curr_distribution_id THEN
        -- Check if user has any other shares in current distribution
        SELECT COUNT(*) INTO remaining_shares
        FROM distribution_shares
        WHERE user_id = OLD.user_id
          AND distribution_id = curr_distribution_id;

        -- If no shares remain, set verified_at to NULL
        IF remaining_shares = 0 THEN
            UPDATE profiles
            SET verified_at = NULL
            WHERE id = OLD.user_id;
        END IF;
    END IF;

    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_profile_verified_at_on_share_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    curr_distribution_id bigint;
BEGIN
    -- Get current distribution
    SELECT id INTO curr_distribution_id
    FROM distributions
    WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY qualification_start DESC
    LIMIT 1;

    -- Only update if inserting a share for the current distribution
    IF curr_distribution_id IS NOT NULL AND NEW.distribution_id = curr_distribution_id THEN
        UPDATE profiles
        SET verified_at = NOW()
        WHERE id = NEW.user_id
          AND verified_at IS NULL;
    END IF;

    RETURN NEW;
END;
$function$
;

-- Step 4: Drop old type and recreate with new is_verified field
-- This will cascade to all dependent views and functions
drop type "public"."activity_feed_user" cascade;

-- Step 5: Recreate type with new field
create type "public"."activity_feed_user" as ("id" uuid, "name" text, "avatar_url" text, "send_id" integer, "main_tag_id" bigint, "main_tag_name" text, "tags" text[], "is_verified" boolean);

-- Step 6: Recreate all dependent views and functions
create or replace view "public"."activity_feed" as  SELECT a.created_at,
    a.event_name,
        CASE
            WHEN (a.from_user_id = from_p.id) THEN ROW(
            CASE
                WHEN (a.from_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
                ELSE NULL::uuid
            END, from_p.name, from_p.avatar_url, from_p.send_id,
            CASE
                WHEN (a.from_user_id = ( SELECT auth.uid() AS uid)) THEN from_sa.main_tag_id
                ELSE NULL::bigint
            END, (from_main_tag.name)::text, (( SELECT array_agg(t.name) AS array_agg
               FROM ((tags t
                 JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
                 JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
              WHERE ((sa.user_id = from_p.id) AND (t.status = 'confirmed'::tag_status))))::text[], (from_p.verified_at IS NOT NULL))::activity_feed_user
            ELSE NULL::activity_feed_user
        END AS from_user,
        CASE
            WHEN (a.to_user_id = to_p.id) THEN ROW(
            CASE
                WHEN (a.to_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
                ELSE NULL::uuid
            END, to_p.name, to_p.avatar_url, to_p.send_id,
            CASE
                WHEN (a.to_user_id = ( SELECT auth.uid() AS uid)) THEN to_sa.main_tag_id
                ELSE NULL::bigint
            END, (to_main_tag.name)::text, (( SELECT array_agg(t.name) AS array_agg
               FROM ((tags t
                 JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
                 JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
              WHERE ((sa.user_id = to_p.id) AND (t.status = 'confirmed'::tag_status))))::text[], (to_p.verified_at IS NOT NULL))::activity_feed_user
            ELSE NULL::activity_feed_user
        END AS to_user,
    a.data
   FROM ((((((activity a
     LEFT JOIN profiles from_p ON ((a.from_user_id = from_p.id)))
     LEFT JOIN profiles to_p ON ((a.to_user_id = to_p.id)))
     LEFT JOIN send_accounts from_sa ON ((from_sa.user_id = from_p.id)))
     LEFT JOIN tags from_main_tag ON ((from_main_tag.id = from_sa.main_tag_id)))
     LEFT JOIN send_accounts to_sa ON ((to_sa.user_id = to_p.id)))
     LEFT JOIN tags to_main_tag ON ((to_main_tag.id = to_sa.main_tag_id)))
  WHERE ((a.from_user_id = ( SELECT auth.uid() AS uid)) OR ((a.to_user_id = ( SELECT auth.uid() AS uid)) AND (a.event_name !~~ 'temporal_%'::text)))
  GROUP BY a.created_at, a.event_name, a.from_user_id, a.to_user_id, from_p.id, from_p.name, from_p.avatar_url, from_p.send_id, to_p.id, to_p.name, to_p.avatar_url, to_p.send_id, a.data, from_sa.main_tag_id, from_main_tag.name, to_sa.main_tag_id, to_main_tag.name, from_p.verified_at, to_p.verified_at;

CREATE OR REPLACE FUNCTION public.favourite_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY

-- Query each expensive view exactly once
WITH user_send_scores AS (
    SELECT
        ss.user_id,
        COALESCE(SUM(ss.score), 0) AS total_score
    FROM (
        SELECT user_id, score FROM private.send_scores_history
        UNION ALL
        SELECT user_id, score FROM public.send_scores_current
    ) ss
    GROUP BY ss.user_id
),
user_earn_balances AS (
    SELECT
        sa.user_id,
        COALESCE(MAX(seb.assets), 0) AS earn_balance
    FROM send_accounts sa
    INNER JOIN send_earn_balances seb ON (
        sa.address_bytes = seb.owner
    )
    GROUP BY sa.user_id
),
-- Filter relevant transfers and determine the counterparty
user_transfers AS (
    SELECT *,
        -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
        CASE
            WHEN (from_user).id = (select auth.uid()) THEN to_user
            ELSE from_user
        END AS counterparty
    FROM activity_feed
    -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
    WHERE created_at >= NOW() - INTERVAL '60 days' -- only last 60 days
      AND (from_user).send_id IS NOT NULL
      AND (to_user).send_id IS NOT NULL
      AND ((from_user).id = (select auth.uid()) OR (to_user).id = (select auth.uid())) -- only tx with user involved
),
-- Count how many interactions the current user has with each counterparty
counterparty_counts AS (
    SELECT counterparty,
           COUNT(*) AS interaction_count
    FROM user_transfers
    WHERE (counterparty).id IS NULL -- include only valid counterparties
    GROUP BY counterparty
    ORDER BY interaction_count DESC
    LIMIT 30 -- top 30 most frequent users
),
-- Get user IDs for counterparties
with_user_id AS (
    SELECT *, (SELECT id FROM profiles WHERE send_id = (counterparty).send_id) AS user_id
    FROM counterparty_counts
    WHERE (SELECT id FROM profiles WHERE send_id = (counterparty).send_id) IS NOT NULL
)

-- Select the top 10 counterparties by send score with earn balance requirement
SELECT (
    (
        (counterparty).id,
        (counterparty).name,
        (counterparty).avatar_url,
        (counterparty).send_id,
        (counterparty).main_tag_id,
        (counterparty).main_tag_name,
        (counterparty).tags,
        (p.verified_at IS NOT NULL)::boolean
    )::activity_feed_user
).*
FROM with_user_id wui
INNER JOIN user_send_scores uss ON uss.user_id = wui.user_id
INNER JOIN user_earn_balances ueb ON ueb.user_id = wui.user_id
INNER JOIN profiles p ON p.id = wui.user_id
WHERE ueb.earn_balance >= (
    SELECT d.earn_min_balance
    FROM distributions d
    WHERE d.qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
      AND d.qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
    ORDER BY d.qualification_start DESC
    LIMIT 1
)
ORDER BY uss.total_score DESC
LIMIT 10; -- return top 10 send score users

END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_friends()
 RETURNS TABLE(avatar_url text, name text, sendid integer, x_username text, links_in_bio link_in_bio[], birthday date, tag citext, created_at timestamp with time zone, is_verified boolean)
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
                p.name,
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
                (p.verified_at IS NOT NULL) AS is_verified,
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
            o.name,
            o.send_id as sendid, -- so it's the same as return type in profile lookup
            o.x_username,
            o.links_in_bio,
            o.birthday,
            o.tag,
            o.created_at,
            o.is_verified
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.leaderboard_referrals_all_time()
 RETURNS TABLE(rewards_usdc numeric, referrals integer, "user" activity_feed_user)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
    return query select l.rewards_usdc,
                        l.referrals,
                        (case when l.user_id = ( select auth.uid() ) then ( select auth.uid() ) end, -- user_id
                         p.name, -- name
                         p.avatar_url, -- avatar_url
                         p.send_id, -- send_id
                         sa.main_tag_id, -- main_tag_id
                         mt.name, -- main_tag_name
                         ( select array_agg(name) from tags where user_id = p.id and status = 'confirmed' ), -- tags
                         (p.verified_at IS NOT NULL)::boolean -- is_verified
                            )::activity_feed_user                      as "user"
                 from private.leaderboard_referrals_all_time l
                          join profiles p on p.id = user_id
                          left join send_accounts sa on sa.user_id = p.id
                          left join tags mt on mt.id = sa.main_tag_id
                 where p.is_public = true;
end
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
        p.banner_url::text,
        (p.verified_at IS NOT NULL) AS is_verified
    from profiles p
    join auth.users a on a.id = p.id
    left join send_accounts sa on sa.user_id = p.id
    left join tags mt on mt.id = sa.main_tag_id
    left join send_account_tags sat on sat.send_account_id = sa.id
    left join tags t on t.id = sat.tag_id and t.status = 'confirmed'::tag_status
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

CREATE OR REPLACE FUNCTION public.recent_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
AS $function$
BEGIN
RETURN QUERY

    -- Step 1: Filter relevant transfers and determine the counterparty
    WITH user_transfers AS (
        SELECT *,
            -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
            CASE
                WHEN (from_user).id = (select auth.uid()) THEN to_user -- only change is to use (select auth.uid()) instead of auth.uid()
                ELSE from_user
            END AS counterparty
        FROM activity_feed
        -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
        WHERE (from_user).send_id IS NOT NULL
          AND (to_user).send_id IS NOT NULL
    ),

    -- Step 2: Assign a row number to each transfer per counterparty, ordered by most recent
    numbered AS (
        SELECT *,
            ROW_NUMBER() OVER (
                PARTITION BY (counterparty).send_id  -- Group by each unique counterparty
                ORDER BY created_at DESC             -- Order by most recent transfer first
            ) AS occurrence_counter
        FROM user_transfers
    )

-- Step 3: Select only the most recent transfer for each counterparty with profile data
SELECT (
    (
        (counterparty).id,
        (counterparty).name,
        (counterparty).avatar_url,
        (counterparty).send_id,
        (counterparty).main_tag_id,
        (counterparty).main_tag_name,
        (counterparty).tags,
        (p.verified_at IS NOT NULL)::boolean
    )::activity_feed_user
).*
FROM numbered
LEFT JOIN profiles p ON p.send_id = (counterparty).send_id
WHERE occurrence_counter = 1  -- Only the most recent interaction with each counterparty
ORDER BY created_at DESC      -- Order the result by most recent transfer
    LIMIT 10;                     -- Return only the 10 most recent counterparties

END;
$function$
;

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
                array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone, sub.is_verified)::public.tag_search_result)
            FROM(
                SELECT
                    p.avatar_url,
                    t.name AS tag_name,
                    p.send_id,
                    NULL::text AS phone,
                    (p.verified_at IS NOT NULL) AS is_verified
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
            array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone, sub.is_verified)::public.tag_search_result)
        FROM (
            SELECT
                ranked_matches.avatar_url,
                ranked_matches.tag_name,
                ranked_matches.send_id,
                ranked_matches.phone,
                ranked_matches.is_verified
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
                        (p.verified_at IS NOT NULL) AS is_verified,
                        (t.name <-> query) AS distance,  -- Trigram distance: 0=exact, higher=different
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
                    (
                        -- Secondary ranking varies by match type:
                        -- For exact matches (primary_rank=0): use negative send_score (higher score = better/lower secondary rank)
                        -- For fuzzy matches (primary_rank=1): use old trigram + send_score formula
                        CASE
                            WHEN tm.is_exact THEN
                                -tm.send_score  -- Negative for DESC ordering within exact matches
                            ELSE
                                -- Old fuzzy ranking formula: distance - (send_score / 1M)
                                CASE WHEN tm.distance IS NULL THEN 0 ELSE tm.distance END
                                - (tm.send_score / 1000000.0)
                        END
                    ) AS secondary_rank,
                    ROW_NUMBER() OVER (PARTITION BY tm.send_id ORDER BY (
                        -- Deduplication uses same ranking logic as main ordering
                        tm.primary_rank,  -- Primary: exact vs fuzzy
                        CASE
                            WHEN tm.is_exact THEN
                                -tm.send_score  -- Secondary: send_score DESC for exact
                            ELSE
                                CASE WHEN tm.distance IS NULL THEN 0 ELSE tm.distance END
                                - (tm.send_score / 1000000.0)  -- Secondary: old formula for fuzzy
                        END
                    )) AS rn
                FROM tag_matches tm
            ) ranked_matches
            WHERE ranked_matches.rn = 1
            ORDER BY ranked_matches.primary_rank ASC, ranked_matches.secondary_rank ASC
            LIMIT limit_val OFFSET offset_val
        ) sub
    ) AS tag_matches,
    -- phone matches, disabled for now
    (null::public.tag_search_result[]) AS phone_matches;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.today_birthday_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY

WITH birthday_profiles AS (
    SELECT p.*
    FROM profiles p
    WHERE p.is_public = TRUE -- only public profiles
    AND p.birthday IS NOT NULL -- Ensure birthday is set
    AND p.avatar_url IS NOT NULL -- Ensure avatar is set
    AND EXTRACT(MONTH FROM p.birthday) = EXTRACT(MONTH FROM CURRENT_DATE) -- Match current month
    AND EXTRACT(DAY FROM p.birthday) = EXTRACT(DAY FROM CURRENT_DATE) -- Match current day
    -- Ensure user has at least one tag associated via tag_receipts, 1 paid tag
    -- This where can be removed after
    AND EXISTS (
        SELECT 1
        FROM tags t
        JOIN tag_receipts tr ON tr.tag_name = t.name
        JOIN receipts r ON r.event_id = tr.event_id
        WHERE t.user_id = p.id
        AND t.status = 'confirmed'  -- Only confirmed tags
        AND r.user_id = t.user_id  -- Ensure receipt belongs to current owner
        AND tr.id = (
            SELECT MAX(id)
            FROM tag_receipts
            WHERE tag_name = t.name
        )
    )
),
user_send_scores AS (
    SELECT
        ss.user_id,
        COALESCE(SUM(ss.unique_sends), 0) AS total_sends,
        COALESCE(SUM(ss.score), 0) AS total_score
    FROM (
        SELECT user_id, score, unique_sends
        FROM private.send_scores_history
        WHERE user_id IN (SELECT id FROM birthday_profiles)
        UNION ALL
        SELECT user_id, score, unique_sends
        FROM public.send_scores_current
        WHERE user_id IN (SELECT id FROM birthday_profiles)
    ) ss
    GROUP BY ss.user_id
),
user_earn_balances AS (
    SELECT
        sa.user_id,
        COALESCE(MAX(seb.assets), 0) AS earn_balance
    FROM send_accounts sa
    JOIN birthday_profiles bp ON bp.id = sa.user_id
    INNER JOIN send_earn_balances seb ON (
        sa.address_bytes = seb.owner
    )
    GROUP BY sa.user_id
),
-- Ensure user has historical send activity and sufficient earn balance
filtered_profiles AS (
    SELECT bp.*, uss.total_score as send_score, (bp.verified_at IS NOT NULL) AS is_verified
    FROM birthday_profiles bp
    INNER JOIN user_send_scores uss ON uss.user_id = bp.id
    INNER JOIN user_earn_balances ueb ON ueb.user_id = bp.id
WHERE uss.total_sends > 100
      AND uss.total_score > (
          SELECT hodler_min_balance
          FROM distributions
          WHERE qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
            AND qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
          ORDER BY qualification_start DESC
          LIMIT 1
      )
      AND ueb.earn_balance >= (
          SELECT d.earn_min_balance
          FROM distributions d
          WHERE d.qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
            AND d.qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
          ORDER BY d.qualification_start DESC
          LIMIT 1
      )
)

SELECT (
   (
        NULL, -- Placeholder for the 'id' field in activity_feed_user, don't want to show users' IDs
        fp.name,
        fp.avatar_url,
        fp.send_id,
        sa.main_tag_id,
        main_tag.name,
        (
            -- Aggregate all confirmed tags for the user into an array
            SELECT ARRAY_AGG(t.name)
            FROM tags t
            WHERE t.user_id = fp.id
              AND t.status = 'confirmed'
        ),
        fp.is_verified
   )::activity_feed_user
).*
FROM filtered_profiles fp
LEFT JOIN send_accounts sa ON sa.user_id = fp.id
LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
ORDER BY fp.send_score DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.top_senders(limit_count integer DEFAULT 10)
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY
WITH user_scores AS (
    SELECT
        ss.user_id,
        COALESCE(SUM(ss.score), 0) AS send_score,
        COALESCE(SUM(ss.unique_sends), 0) AS total_sends
    FROM (
        SELECT user_id, score, unique_sends FROM private.send_scores_history
        UNION ALL
        SELECT user_id, score, unique_sends FROM public.send_scores_current
    ) ss
    GROUP BY ss.user_id
    HAVING COALESCE(SUM(ss.score), 0) > 0
       AND COALESCE(SUM(ss.unique_sends), 0) > 0
),
user_earn_balances AS (
    SELECT
        sa.user_id,
        COALESCE(MAX(seb.assets), 0) AS earn_balance
    FROM send_accounts sa
    JOIN user_scores us ON us.user_id = sa.user_id
    LEFT JOIN (
        SELECT
            owner,
            SUM(assets) AS assets
        FROM send_earn_balances
        GROUP BY owner
    ) seb ON sa.address_bytes = seb.owner
    GROUP BY sa.user_id
),
valid_users AS (
    SELECT
        p.id,
        p.name,
        p.avatar_url,
        p.send_id,
        us.send_score,
        ARRAY_AGG(t.name) AS tag_names,
        (p.verified_at IS NOT NULL) AS is_verified
    FROM user_scores us
    INNER JOIN user_earn_balances ueb ON ueb.user_id = us.user_id
    INNER JOIN profiles p ON p.id = us.user_id
    INNER JOIN tags t ON t.user_id = p.id
    WHERE p.is_public = TRUE
      AND p.avatar_url IS NOT NULL
      AND t.status = 'confirmed'
      AND ueb.earn_balance >= (
          SELECT d.earn_min_balance
          FROM distributions d
          WHERE d.qualification_start <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
            AND d.qualification_end >= CURRENT_TIMESTAMP AT TIME ZONE 'UTC'
          ORDER BY d.qualification_start DESC
          LIMIT 1
      )
    GROUP BY p.id, p.name, p.avatar_url, p.send_id, us.send_score, p.verified_at
)
-- Return top N with all requirements met
SELECT (
    (
        NULL, -- Placeholder for the 'id' field in activity_feed_user, don't want to show users' IDs
        vu.name,
        vu.avatar_url,
        vu.send_id,
        NULL::bigint,  -- Hide main_tag_id for privacy
        main_tag.name,
        vu.tag_names,
        vu.is_verified
    )::activity_feed_user
).*
FROM valid_users vu
LEFT JOIN send_accounts sa ON sa.user_id = vu.id
LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
ORDER BY vu.send_score DESC
LIMIT limit_count;
END;
$function$
;

CREATE TRIGGER update_profile_verified_at_on_delete AFTER DELETE ON public.distribution_shares FOR EACH ROW EXECUTE FUNCTION update_profile_verified_at_on_share_delete();

CREATE TRIGGER update_profile_verified_at_on_insert AFTER INSERT ON public.distribution_shares FOR EACH ROW EXECUTE FUNCTION update_profile_verified_at_on_share_insert();

-- Step 7: Restore function permissions for all functions that were dropped/recreated by CASCADE

-- leaderboard_referrals_all_time: authenticated + service_role only
REVOKE ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() FROM anon;
GRANT ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() TO "service_role";

-- favourite_senders: anon + authenticated + service_role
REVOKE ALL ON FUNCTION "public"."favourite_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "service_role";

-- recent_senders: anon + authenticated + service_role
REVOKE ALL ON FUNCTION "public"."recent_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "service_role";

-- today_birthday_senders: anon + authenticated + service_role
REVOKE ALL ON FUNCTION "public"."today_birthday_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "service_role";

-- top_senders: anon + authenticated + service_role
REVOKE ALL ON FUNCTION "public"."top_senders"(integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."top_senders"(integer) TO "anon";
GRANT ALL ON FUNCTION "public"."top_senders"(integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."top_senders"(integer) TO "service_role";

-- tag_search: authenticated + service_role only (no anon)
REVOKE ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) TO "service_role";

-- profile_lookup: authenticated + service_role only (no anon)
REVOKE ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") TO "service_role";

-- get_friends: authenticated + service_role only (no anon)
REVOKE ALL ON FUNCTION "public"."get_friends"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_friends"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_friends"() TO "service_role";

-- refresh_profile_verification_status: service_role ONLY (security sensitive - can reset all verification)
REVOKE ALL ON FUNCTION "public"."refresh_profile_verification_status"() FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."refresh_profile_verification_status"() FROM anon;
REVOKE ALL ON FUNCTION "public"."refresh_profile_verification_status"() FROM authenticated;
GRANT ALL ON FUNCTION "public"."refresh_profile_verification_status"() TO "service_role";

-- Step 8: Update update_distribution_shares to call refresh_profile_verification_status
-- This ensures verified_at is synced after batch updates to distribution_shares
CREATE OR REPLACE FUNCTION "public"."update_distribution_shares"("distribution_id" integer, "shares" "public"."distribution_shares"[]) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
BEGIN
  -- get the distribution
  IF(
    SELECT
      1
    FROM
      distributions d
    WHERE
      d.id = $1
    LIMIT 1) IS NULL THEN
    RAISE EXCEPTION 'Distribution not found.';
  END IF;
  -- validate shares are for the correct distribution
  IF(
    SELECT
      count(DISTINCT id)
    FROM
      distributions
    WHERE
      id IN(
      SELECT
        shares.distribution_id
      FROM
        unnest(shares) shares)) <> 1 THEN
    RAISE EXCEPTION 'Shares are for the wrong distribution.';
  END IF;
  -- delete existing shares
  DELETE FROM distribution_shares
  WHERE distribution_shares.distribution_id = $1;
  -- insert new shares
  INSERT INTO distribution_shares(
    distribution_id,
    user_id,
    address,
    amount,
    hodler_pool_amount,
    bonus_pool_amount,
    fixed_pool_amount,
    "index")
  SELECT
    update_distribution_shares.distribution_id,
    shares.user_id,
    shares.address,
    shares.amount,
    shares.hodler_pool_amount,
    shares.bonus_pool_amount,
    shares.fixed_pool_amount,
    row_number() OVER(PARTITION BY update_distribution_shares.distribution_id ORDER BY shares.address) - 1 AS "index"
  FROM
    unnest(shares) shares
ORDER BY
  shares.address;
  -- Refresh profile verification status after batch update
  -- This ensures verified_at is correctly set based on the updated shares
  PERFORM refresh_profile_verification_status();
END;
$_$;

-- Step 9: Backfill existing data
SELECT refresh_profile_verification_status();
