UPDATE distributions SET tranche_id = 10 WHERE number = 17;
UPDATE distributions SET merkle_drop_addr = '\x2c1630cd8f40d0458b7b5849e6cc2904a7d18a57'::bytea WHERE number = 17;

drop trigger if exists "distribution_ended_refresh_send_scores" on "public"."distributions";

drop function if exists "public"."refresh_send_scores_history_trigger"();

-- Insert distributions 18-22 (August through December 2025)
-- Using a loop to create the next 5 distributions until end of year

DO $$
DECLARE
    dist_num integer;
    tranche_num integer;
    dist_name text;
    dist_description text;
    qual_start timestamp with time zone;
    qual_end timestamp with time zone;
BEGIN
    -- Loop through distributions 18-22
    FOR i IN 18..22 LOOP
        dist_num := i;
        tranche_num := i - 7; -- tranche_id = distribution_number - 7 (18-7=11, 19-7=12, etc.)
        dist_name := 'Distribution #' || i;

        -- Set qualification dates for each month
        CASE i
            WHEN 18 THEN
                qual_start := '2025-08-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2025-09-01T00:00:00Z'::timestamp with time zone - interval '1 second';
                dist_description := 'Eighteenth distribution of 3,000,000 SEND tokens to early hodlers';
            WHEN 19 THEN
                qual_start := '2025-09-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2025-10-01T00:00:00Z'::timestamp with time zone - interval '1 second';
                dist_description := 'Nineteenth distribution of 3,000,000 SEND tokens to early hodlers';
            WHEN 20 THEN
                qual_start := '2025-10-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2025-11-01T00:00:00Z'::timestamp with time zone - interval '1 second';
                dist_description := 'Twentieth distribution of 3,000,000 SEND tokens to early hodlers';
            WHEN 21 THEN
                qual_start := '2025-11-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2025-12-01T00:00:00Z'::timestamp with time zone - interval '1 second';
                dist_description := 'Twenty-first distribution of 3,000,000 SEND tokens to early hodlers';
            WHEN 22 THEN
                qual_start := '2025-12-01T00:00:00Z'::timestamp with time zone;
                qual_end := '2026-01-01T00:00:00Z'::timestamp with time zone - interval '1 second';
                dist_description := 'Twenty-second distribution of 3,000,000 SEND tokens to early hodlers';
        END CASE;

        -- Insert distribution
        INSERT INTO public.distributions(
            number,
            name,
            description,
            amount,
            hodler_pool_bips,
            bonus_pool_bips,
            fixed_pool_bips,
            qualification_start,
            qualification_end,
            hodler_min_balance,
            earn_min_balance,
            claim_end,
            chain_id,
            merkle_drop_addr,
            token_decimals,
            token_addr,
            tranche_id
        ) VALUES (
            dist_num,
            dist_name,
            dist_description,
            3000000000000000000000000, -- 3,000,000 SEND
            10000,
            0,
            10000,
            qual_start,
            qual_end,
            1000000000000000000000, -- 1,000 SEND
            5e6, -- 5 USDC
            'infinity',
            8453, -- Base chain
            '\x2c1630cd8f40d0458b7b5849e6cc2904a7d18a57',
            18,
            '\xEab49138BA2Ea6dd776220fE26b7b8E446638956',
            tranche_num
        );

        -- Insert verification values for each distribution
        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'tag_registration'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'create_passkey'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'send_ten'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'send_one_hundred'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'total_tag_referrals'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'tag_referral'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'send_streak'::public.verification_type
        );

        PERFORM insert_verification_value(
            distribution_number => dist_num,
            type => 'send_ceiling'::public.verification_type
        );

        -- Insert send slash config
        PERFORM insert_send_slash(distribution_number => dist_num);

        RAISE NOTICE 'Inserted distribution % with tranche_id %', dist_num, tranche_num;
    END LOOP;
END $$;

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
    FROM send_scores ss
    GROUP BY ss.user_id
    HAVING COALESCE(SUM(ss.score), 0) > 0
       AND COALESCE(SUM(ss.unique_sends), 0) > 0
),
user_earn_balances AS (
    SELECT
        sa.user_id,
        COALESCE(MAX(seb.assets), 0) AS earn_balance
    FROM send_accounts sa
    INNER JOIN send_earn_balances seb ON (
        decode(replace(sa.address::text, '0x', ''), 'hex') = seb.owner
    )
    GROUP BY sa.user_id
),
valid_users AS (
    SELECT
        p.*,
        us.send_score,
        ARRAY_AGG(t.name) AS tag_names
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
    GROUP BY p.id, p.avatar_url, p.name, p.about, p.referral_code, p.is_public, p.send_id, p.x_username, p.birthday, us.send_score
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
        WHERE t.user_id = p.id
    )
),
user_send_scores AS (
    SELECT
        ss.user_id,
        COALESCE(SUM(ss.unique_sends), 0) AS total_sends,
        COALESCE(SUM(ss.score), 0) AS total_score
    FROM send_scores ss
    GROUP BY ss.user_id
),
user_earn_balances AS (
    SELECT
        sa.user_id,
        COALESCE(MAX(seb.assets), 0) AS earn_balance
    FROM send_accounts sa
    INNER JOIN send_earn_balances seb ON (
        decode(replace(sa.address::text, '0x', ''), 'hex') = seb.owner
    )
    GROUP BY sa.user_id
),
-- Ensure user has historical send activity and sufficient earn balance
filtered_profiles AS (
    SELECT bp.*, uss.total_score as send_score
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
        )
   )::activity_feed_user
).*
FROM filtered_profiles fp
LEFT JOIN send_accounts sa ON sa.user_id = fp.id
LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
ORDER BY fp.send_score DESC;
END;
$function$
;
