-- Drop the view first (it depends on the type)
drop view if exists "public"."activity_feed";

-- Drop functions that depend on the type
drop function if exists "public"."recent_senders"();
drop function if exists "public"."favourite_senders"();
drop function if exists "public"."today_birthday_senders"();
drop function if exists "public"."top_senders"(integer, integer);
drop function if exists "public"."leaderboard_referrals_all_time"();

-- Now we can drop the type
drop type "public"."activity_feed_user";

-- Create the new type with additional fields
create type "public"."activity_feed_user" as ("id" uuid, "name" text, "avatar_url" text, "send_id" integer, "main_tag_id" bigint, "main_tag_name" text, "tags" text[]);

set check_function_bodies = off;

-- Recreate the view with the new type
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
              WHERE ((sa.user_id = from_p.id) AND (t.status = 'confirmed'::tag_status))))::text[])::activity_feed_user
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
              WHERE ((sa.user_id = to_p.id) AND (t.status = 'confirmed'::tag_status))))::text[])::activity_feed_user
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
  GROUP BY a.created_at, a.event_name, a.from_user_id, a.to_user_id, from_p.id, from_p.name, from_p.avatar_url, from_p.send_id, to_p.id, to_p.name, to_p.avatar_url, to_p.send_id, a.data, from_sa.main_tag_id, from_main_tag.name, to_sa.main_tag_id, to_main_tag.name;

CREATE OR REPLACE FUNCTION public.today_birthday_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY

WITH filtered_profiles AS (
    SELECT *
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
        WHERE t.user_id = p.id
    )
    -- Ensure user is part of the most recent distribution, means user have sent SEND at least once in current month and has min balance
    AND EXISTS (
        SELECT 1
        FROM distribution_shares ds
        WHERE ds.user_id = p.id
        AND ds.distribution_id = (
            SELECT MAX(d.id)
            FROM distributions d
        )
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
        )
   )::activity_feed_user
).*
FROM filtered_profiles fp
LEFT JOIN send_accounts sa ON sa.user_id = fp.id
LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
LEFT JOIN LATERAL (
    SELECT COALESCE(SUM(ds.amount), 0) AS send_score
    FROM distribution_shares ds
    WHERE ds.user_id = fp.id
    AND ds.distribution_id >= 6
) score ON TRUE
ORDER BY score.send_score DESC;
END;
$function$
;

-- Recreate favourite_senders function
CREATE OR REPLACE FUNCTION favourite_senders()
RETURNS SETOF activity_feed_user
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY


-- Step 1: Filter relevant transfers and determine the counterparty
    WITH user_transfers AS (
    SELECT *,
        -- Determine the counterparty: if the current user is the sender, use the recipient, and vice versa
        CASE
            WHEN (from_user).id = (select auth.uid()) THEN to_user
            ELSE from_user
        END AS counterparty
    FROM activity_feed
    -- Only include rows where both from_user and to_user have a send_id (indicates a transfer between users)
    WHERE created_at >= NOW() - INTERVAL '60 days' -- only last 30 days
      AND (from_user).send_id IS NOT NULL
      AND (to_user).send_id IS NOT NULL
      AND ((from_user).id = (select auth.uid()) OR (to_user).id = (select auth.uid())) -- only tx with user involved
),

-- Count how many interactions the current user has with each counterparty
counterparty_counts AS (
    SELECT counterparty,
           COUNT(*) AS interaction_count
    FROM user_transfers
    WHERE (counterparty).id IS NULL -- ignore if users were sending to their selves
    GROUP BY counterparty
    ORDER BY interaction_count DESC
    LIMIT 30 -- top 30 most frequent users
),

-- need users ids to count send score, activity feed doesnt have it, its not returned by this function, just used in calculations
with_user_id AS (
  SELECT *, (SELECT id FROM profiles WHERE send_id = (counterparty).send_id) AS user_id
  FROM counterparty_counts
)

-- Select the top 10 counterparties by send score
SELECT (counterparty).* -- only fields from activity feed
FROM with_user_id
    LEFT JOIN LATERAL ( -- calculate send score for top 30 frequent users
        SELECT COALESCE(SUM(ds.amount), 0) AS send_score
        FROM distribution_shares ds
        WHERE ds.user_id = with_user_id.user_id
        AND ds.distribution_id >= 6
    ) score ON TRUE
ORDER BY score.send_score DESC
LIMIT 10; -- return top 10 send score users

END;
$$;

-- Recreate recent_senders function
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

-- Step 3: Select only the most recent transfer for each counterparty
SELECT (counterparty).*  -- Return only the counterparty details
FROM numbered
WHERE occurrence_counter = 1  -- Only the most recent interaction with each counterparty
ORDER BY created_at DESC      -- Order the result by most recent transfer
    LIMIT 10;                     -- Return only the 10 most recent counterparties

END;
$function$
;

-- Recreate top_senders function
CREATE OR REPLACE FUNCTION public.top_senders(limit_count integer DEFAULT 10, latest_distribution_count integer DEFAULT NULL::integer)
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
RETURN QUERY

-- Get latest distributions ids
WITH recent_distributions AS (
  SELECT id
  FROM distributions
  ORDER BY "number" DESC -- changed id to number
  LIMIT COALESCE(latest_distribution_count, GREATEST((SELECT COUNT(*) FROM distributions) - 8, 0)) -- always skip 8 first distributions, no send_ceiling in previous
),
-- Get all users with scores (no limit yet)
user_scores AS (
    SELECT
        dv.user_id,
        SUM(dv.weight) AS send_score -- changed to be weight of send_ceiling instead of distribution amount
    FROM distribution_verifications dv
    INNER JOIN recent_distributions rd ON dv.distribution_id = rd.id
    WHERE dv.type = 'send_ceiling'
    GROUP BY dv.user_id
),
-- Filter for valid profiles with tags
valid_users AS (
    SELECT
        p.*,
        us.send_score,
        ARRAY_AGG(t.name) AS tag_names
    FROM user_scores us
    INNER JOIN profiles p ON p.id = us.user_id
    INNER JOIN tags t ON t.user_id = p.id
    WHERE p.is_public = TRUE
      AND p.avatar_url IS NOT NULL
      AND t.status = 'confirmed'
    GROUP BY p.id, p.name, p.avatar_url, p.send_id, us.send_score
)
-- Return top N with all requirements met
SELECT (
    (
        NULL,
        vu.name,
        vu.avatar_url,
        vu.send_id,
        NULL::bigint,  -- Hide main_tag_id for privacy
        main_tag.name,
        vu.tag_names
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

-- Recreate leaderboard_referrals_all_time function
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
                         ( select array_agg(name) from tags where user_id = p.id and status = 'confirmed' ) -- tags
                            )::activity_feed_user                      as "user"
                 from private.leaderboard_referrals_all_time l
                          join profiles p on p.id = user_id
                          left join send_accounts sa on sa.user_id = p.id
                          left join tags mt on mt.id = sa.main_tag_id
                 where p.is_public = true;
end
$function$
;

-- Revoke access from anon role for leaderboard function
revoke all on function leaderboard_referrals_all_time from anon;
