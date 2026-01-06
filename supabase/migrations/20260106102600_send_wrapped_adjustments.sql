set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.wrapped_send_score_rank()
 RETURNS TABLE(rank bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'private'
AS $function$
BEGIN
RETURN QUERY
    WITH distributions_2025 AS (
        SELECT id
        FROM distributions
        WHERE qualification_start >= '2025-01-01'::timestamptz
            AND qualification_start < '2025-12-20'::timestamptz
    ),
    user_scores AS (
        SELECT
            ss.user_id,
            SUM(ss.score) AS score_sum
        FROM private.send_scores_history ss
        WHERE ss.distribution_id IN (SELECT id FROM distributions_2025)
        GROUP BY ss.user_id
    ),
    ranked_users AS (
        SELECT
            user_id,
            score_sum,
            ROW_NUMBER() OVER (ORDER BY score_sum DESC) AS user_rank
        FROM user_scores
    )
SELECT
    ru.user_rank AS rank
FROM ranked_users ru
WHERE ru.user_id = (SELECT auth.uid() AS uid)
    LIMIT 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.wrapped_top_counterparties()
 RETURNS TABLE(name text, avatar_url text, send_id integer, tag_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
RETURN QUERY
    WITH user_transactions AS (
        SELECT
            created_at,
            -- Determine the counterparty: if current user is sender, get recipient; otherwise get sender
            CASE
                WHEN from_user_id = (SELECT auth.uid() AS uid) THEN to_user_id
                ELSE from_user_id
            END AS counterparty_id
        FROM activity
        WHERE
            -- Filter for 2025 transactions (Jan 1 - Dec 19)
            created_at >= '2025-01-01'::timestamptz
            AND created_at < '2025-12-20'::timestamptz
            -- Include transactions where user is either sender or recipient
            AND (from_user_id = (SELECT auth.uid() AS uid) OR to_user_id = (SELECT auth.uid() AS uid))
            -- Only include transfers between users (both IDs must exist)
            AND from_user_id IS NOT NULL
            AND to_user_id IS NOT NULL
            -- Exclude self-transactions
            AND from_user_id != to_user_id
    ),
    counterparty_counts AS (
        SELECT
            counterparty_id,
            COUNT(*) AS transaction_count
        FROM user_transactions
        WHERE counterparty_id IS NOT NULL
        GROUP BY counterparty_id
    )
SELECT
    p.name,
    p.avatar_url,
    p.send_id,
    t.name::text AS tag_name
FROM counterparty_counts cc
         JOIN profiles p ON p.id = cc.counterparty_id AND p.is_public = TRUE
         LEFT JOIN send_accounts sa ON sa.user_id = p.id
         LEFT JOIN tags t ON t.id = sa.main_tag_id AND t.status = 'confirmed'
ORDER BY cc.transaction_count DESC
    LIMIT 5;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.wrapped_total_transfers()
 RETURNS TABLE(count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
RETURN QUERY
SELECT COUNT(*) AS count
FROM activity
WHERE from_user_id = (SELECT auth.uid() AS uid)
  AND to_user_id IS NOT NULL
  AND from_user_id != to_user_id
  AND created_at >= '2025-01-01'::timestamptz
  AND created_at < '2025-12-20'::timestamptz;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.wrapped_unique_recipients()
 RETURNS TABLE(count bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
RETURN QUERY
SELECT COUNT(DISTINCT to_user_id) AS count
FROM activity
WHERE from_user_id = (SELECT auth.uid() AS uid)
  AND to_user_id IS NOT NULL
  AND from_user_id != to_user_id
  AND created_at >= '2025-01-01'::timestamptz
  AND created_at < '2025-12-20'::timestamptz;
END;
$function$
;


