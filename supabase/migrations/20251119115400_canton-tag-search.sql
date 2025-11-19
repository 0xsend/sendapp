set check_function_bodies = off;

-- Create type first
CREATE TYPE "public"."canton_tag_search_result" AS (
    "avatar_url" text,
    "name" text,
    "send_id" integer,
    "main_tag_name" citext,
    "matched_tag_name" citext,
    "tags" citext[],
    "canton_wallet_address" text
);

ALTER TYPE "public"."canton_tag_search_result" OWNER TO "postgres";

-- Create function
CREATE OR REPLACE FUNCTION public.canton_tag_search(query text, page_number integer DEFAULT 0, page_size integer DEFAULT 10)
 RETURNS SETOF canton_tag_search_result
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Validate and cap page_size to prevent abuse
    IF page_size > 50 THEN
        page_size := 50;
    END IF;

    IF page_size < 1 THEN
        page_size := 1;
    END IF;

    -- Ensure page_number is not negative
    IF page_number < 0 THEN
        page_number := 0;
    END IF;

    RETURN QUERY
    WITH scores AS (
        -- Aggregate user send scores, summing all scores for cumulative activity
        SELECT
            user_id,
            SUM(score) AS total_score
        FROM (
            SELECT user_id, score FROM private.send_scores_history
            UNION ALL
            SELECT user_id, score FROM public.send_scores_current
        ) ss
        GROUP BY user_id
    ),
    tag_matches AS (
        SELECT
            p.id AS user_id,
            p.avatar_url,
            p.name,
            p.send_id,
            t.name AS tag_name,
            cpv.canton_wallet_address,
            (t.name <-> query) AS distance,  -- Trigram distance: 0=exact, higher=different
            COALESCE(scores.total_score, 0) AS send_score,
            -- Compute exact match flag
            LOWER(t.name) = LOWER(query) AS is_exact,
            -- Primary ranking: exact matches (primary_rank=0) always outrank fuzzy matches (primary_rank=1)
            CASE WHEN LOWER(t.name) = LOWER(query) THEN 0 ELSE 1 END AS primary_rank
        FROM canton_party_verifications cpv
        INNER JOIN profiles p ON p.id = cpv.user_id
        INNER JOIN tags t ON t.user_id = p.id
        LEFT JOIN scores ON scores.user_id = p.id
        WHERE p.is_public = TRUE
          AND t.status = 'confirmed'
          AND cpv.is_discoverable = TRUE
          AND (
              -- Use ILIKE '%' only when NOT exact to avoid excluding true exact matches
              LOWER(t.name) = LOWER(query)
              OR (NOT (LOWER(t.name) = LOWER(query)) AND (t.name <<-> query < 0.7 OR t.name ILIKE '%' || query || '%'))
          )
    ),
    ranked_matches AS (
        SELECT
            tm.user_id,
            tm.avatar_url,
            tm.name,
            tm.send_id,
            tm.tag_name,
            tm.canton_wallet_address,
            tm.distance,
            tm.send_score,
            tm.is_exact,
            tm.primary_rank,
            (
                -- Secondary ranking varies by match type:
                -- For exact matches (primary_rank=0): use negative send_score (higher score = better/lower secondary rank)
                -- For fuzzy matches (primary_rank=1): use trigram distance + send_score formula
                CASE
                    WHEN tm.is_exact THEN
                        -tm.send_score  -- Negative for DESC ordering within exact matches
                    ELSE
                        -- Fuzzy ranking formula: distance - (send_score / 1M)
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
    ),
    deduplicated_matches AS (
        SELECT
            rm.user_id,
            rm.avatar_url,
            rm.name,
            rm.send_id,
            rm.tag_name AS matched_tag_name,
            rm.canton_wallet_address,
            rm.primary_rank,
            rm.secondary_rank
        FROM ranked_matches rm
        WHERE rm.rn = 1
    ),
    users_with_tags AS (
        SELECT
            dm.user_id,
            dm.avatar_url,
            dm.name,
            dm.send_id,
            dm.matched_tag_name,
            dm.canton_wallet_address,
            dm.primary_rank,
            dm.secondary_rank,
            ARRAY_AGG(t.name) AS tag_names
        FROM deduplicated_matches dm
        INNER JOIN tags t ON t.user_id = dm.user_id
        WHERE t.status = 'confirmed'
        GROUP BY dm.user_id, dm.avatar_url, dm.name, dm.send_id, dm.matched_tag_name, dm.canton_wallet_address, dm.primary_rank, dm.secondary_rank
    )
    SELECT
        uwt.avatar_url,
        uwt.name,
        uwt.send_id,
        main_tag.name AS main_tag_name,
        uwt.matched_tag_name,
        uwt.tag_names,
        uwt.canton_wallet_address
    FROM users_with_tags uwt
    LEFT JOIN send_accounts sa ON sa.user_id = uwt.user_id
    LEFT JOIN tags main_tag ON main_tag.id = sa.main_tag_id
    ORDER BY uwt.primary_rank ASC, uwt.secondary_rank ASC
    LIMIT page_size
    OFFSET page_number * page_size;
END;
$function$
;

ALTER FUNCTION "public"."canton_tag_search"(text, integer, integer) OWNER TO "postgres";

-- Grant public access to canton_tag_search function (used directly via Supabase API)
REVOKE ALL ON FUNCTION "public"."canton_tag_search"(text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."canton_tag_search"(text, integer, integer) TO "anon";
GRANT EXECUTE ON FUNCTION "public"."canton_tag_search"(text, integer, integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."canton_tag_search"(text, integer, integer) TO "service_role";

-- Grant type access for anon users
REVOKE USAGE ON TYPE "public"."canton_tag_search_result" FROM PUBLIC;
GRANT USAGE ON TYPE "public"."canton_tag_search_result" TO "anon";
GRANT USAGE ON TYPE "public"."canton_tag_search_result" TO "authenticated";
GRANT USAGE ON TYPE "public"."canton_tag_search_result" TO "service_role";
