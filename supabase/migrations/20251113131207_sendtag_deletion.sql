set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_tag_deletion_verifications()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    tag_name_to_check citext;
    tag_user_id_to_check uuid;
BEGIN
    -- Get tag details before they potentially change
    SELECT t.name, t.user_id
    INTO tag_name_to_check, tag_user_id_to_check
    FROM tags t
    WHERE t.id = OLD.tag_id;

    -- Only delete verifications for ACTIVE distributions (in qualification period)
    DELETE FROM distribution_verifications dv
    WHERE dv.user_id = tag_user_id_to_check
        AND dv.type = 'tag_registration'
        AND dv.metadata->>'tag' = tag_name_to_check
        AND dv.distribution_id IN (
            SELECT id FROM distributions
            WHERE qualification_start <= NOW()
                AND qualification_end >= NOW()
        );

    RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_tag_registration_verifications(distribution_num integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Idempotent insert: avoid duplicating rows per (distribution_id, user_id, type, tag)
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at
    )
    SELECT
        (
            SELECT id
            FROM distributions
            WHERE "number" = distribution_num
            LIMIT 1
        ) AS distribution_id,
        t.user_id,
        'tag_registration'::public.verification_type AS type,
        jsonb_build_object('tag', t."name") AS metadata,
        CASE
            WHEN LENGTH(t.name) >= 6 THEN 1
            WHEN LENGTH(t.name) = 5 THEN 2
            WHEN LENGTH(t.name) = 4 THEN 3 -- Increase reward value of shorter tags
            WHEN LENGTH(t.name) > 0  THEN 4
            ELSE 0
        END AS weight,
        t.created_at AS created_at
    FROM tags t
    INNER JOIN tag_receipts tr ON tr.tag_name = t.name
    AND tr.id = (
        SELECT MAX(id)
        FROM tag_receipts
        WHERE tag_name = t.name
    )
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.distribution_verifications dv
        WHERE dv.distribution_id = (
            SELECT id FROM distributions WHERE "number" = distribution_num LIMIT 1
        )
        AND dv.user_id = t.user_id
        AND dv.type = 'tag_registration'::public.verification_type
        AND dv.metadata->>'tag' = t.name
    );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.prevent_last_confirmed_tag_deletion()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Check if this deletion would leave the user with zero PAID confirmed tags
    -- Only prevent deletion if the tag being deleted is confirmed AND has a receipt (paid)
    IF current_setting('role')::text = 'authenticated' AND
        (SELECT status FROM tags WHERE id = OLD.tag_id) = 'confirmed' THEN

        -- Count remaining PAID confirmed tags after this deletion
        -- A paid tag is one that has a receipt (not the free first sendtag)
        IF (SELECT COUNT(*)
            FROM send_account_tags sat
            JOIN tags t ON t.id = sat.tag_id
            WHERE sat.send_account_id = OLD.send_account_id
            AND t.status = 'confirmed'
            AND sat.tag_id != OLD.tag_id
            AND EXISTS (
                SELECT 1 FROM tag_receipts tr
                WHERE tr.tag_id = t.id
            )) = 0 THEN
            RAISE EXCEPTION 'Cannot delete your last paid sendtag. Users must maintain at least one paid sendtag.';
        END IF;
    END IF;

    RETURN OLD;
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

CREATE TRIGGER cleanup_active_distribution_verifications_on_tag_delete AFTER DELETE ON public.send_account_tags FOR EACH ROW EXECUTE FUNCTION handle_tag_deletion_verifications();


