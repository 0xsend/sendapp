alter type "public"."tag_search_result" add attribute "verified_at" timestamptz;
alter type "public"."profile_lookup_result" add attribute "verified_at" timestamptz;

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.send_token_balance(p_user_id uuid)
 RETURNS numeric
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  account_address bytea;
  account_block_time numeric;
  result_balance numeric;
BEGIN
  -- Get account address and convert created_at to block_time
  SELECT
    decode(replace(sa.address::text, ('0x'::citext)::text, ''::text), 'hex'),
    EXTRACT(EPOCH FROM sa.created_at)
  INTO account_address, account_block_time
  FROM public.send_accounts sa
  WHERE sa.user_id = p_user_id;

  -- Return 0 if no account found
  IF account_address IS NULL THEN
    RETURN 0;
  END IF;

  -- Sum transfers starting from account creation (with 1 hour buffer)
  SELECT COALESCE(SUM(
    CASE
      WHEN stt.t = account_address AND stt.f = account_address THEN 0::numeric  -- Self-transfer = net 0
      WHEN stt.t = account_address THEN stt.v::numeric
      WHEN stt.f = account_address THEN -stt.v::numeric
      ELSE 0::numeric
    END
  ), 0::numeric)
  INTO result_balance
  FROM public.send_token_transfers stt
  WHERE stt.block_time >= (account_block_time - 3600)  -- Subtract 1 hour buffer
    AND (stt.t = account_address OR stt.f = account_address);

  RETURN result_balance;
END;
$function$
;

CREATE OR REPLACE FUNCTION "public"."verified_at"("public"."profiles") RETURNS timestamp with time zone
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET search_path TO 'public'
AS $function$
DECLARE
  v_has_tag boolean := false;
  v_has_hodler boolean := false;
  v_has_earn boolean := false;
  v_hodler_min numeric;
  v_earn_min numeric;
BEGIN
  -- Active distribution thresholds
  SELECT hodler_min_balance::numeric, earn_min_balance::numeric
    INTO v_hodler_min, v_earn_min
  FROM distributions
  WHERE (now() AT TIME ZONE 'UTC') >= qualification_start
    AND (now() AT TIME ZONE 'UTC') <  qualification_end
  ORDER BY qualification_start DESC
  LIMIT 1;

  -- If there is no active distribution, not verified
  IF v_hodler_min IS NULL THEN
    RETURN NULL;
  END IF;

  -- 1) Quick check: must have at least one purchased tag receipt
  SELECT EXISTS (
    SELECT 1
    FROM public.sendtag_checkout_receipts scr
    JOIN public.send_accounts sa
      ON decode(replace(sa.address::text, ('0x'::citext)::text, ''::text), 'hex') = scr.sender
    WHERE sa.user_id = $1.id
  ) INTO v_has_tag;
  IF NOT v_has_tag THEN
    RETURN NULL;
  END IF;

  -- 2) Quick check: any earn balance meets threshold
  SELECT EXISTS (
    SELECT 1
    FROM public.send_earn_balances seb
    JOIN public.send_accounts sa
      ON seb.owner = decode(replace(sa.address::text, ('0x'::citext)::text, ''::text), 'hex')
    WHERE sa.user_id = $1.id
      AND seb.assets >= v_earn_min
  ) INTO v_has_earn;
  IF NOT v_has_earn THEN
    RETURN NULL;
  END IF;

  -- 3) Hodler balance meets threshold
  v_has_hodler := public.send_token_balance($1.id) >= v_hodler_min;
  IF NOT v_has_hodler THEN
    RETURN NULL;
  END IF;

  -- All checks passed
  RETURN (now() AT TIME ZONE 'UTC');
END;
$function$
;

ALTER FUNCTION "public"."verified_at"("public"."profiles") OWNER TO "postgres";

REVOKE ALL ON FUNCTION "public"."verified_at"("public"."profiles") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."verified_at"("public"."profiles") TO "anon";
GRANT ALL ON FUNCTION "public"."verified_at"("public"."profiles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."verified_at"("public"."profiles") TO "service_role";


CREATE OR REPLACE FUNCTION public.tag_search(query text, limit_val integer, offset_val integer)
 RETURNS TABLE(send_id_matches tag_search_result[], tag_matches tag_search_result[], phone_matches tag_search_result[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
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
            FROM (
                WITH candidates AS (
                    SELECT
                        p.id AS user_id,
                        p.avatar_url,
                        p.send_id,
                        NULL::text AS phone
                    FROM profiles p
                    WHERE
                        query SIMILAR TO '\d+'
                        AND p.send_id::varchar LIKE '%' || query || '%'
                    ORDER BY p.send_id
                ),
                page AS (
                    SELECT
                        c.user_id,
                        c.avatar_url,
                        c.send_id,
                        c.phone
                    FROM candidates c
                    ORDER BY c.send_id ASC
                    LIMIT limit_val OFFSET offset_val
                ),
                enriched AS (
                    SELECT
                        page.avatar_url,
                        ct.tag_name AS tag_name,
                        page.send_id,
                        page.phone,
                        (va.verified_at_result IS NOT NULL) AS is_verified,
                        va.verified_at_result AS verified_at
                    FROM page
                    LEFT JOIN LATERAL (
                        SELECT t.name AS tag_name
                        FROM send_accounts sa2
                        JOIN send_account_tags sat2 ON sat2.send_account_id = sa2.id
                        JOIN tags t ON t.id = sat2.tag_id AND t.status = 'confirmed'
                        WHERE sa2.user_id = page.user_id
                        ORDER BY t.name ASC
                        LIMIT 1
                    ) ct ON true
                    JOIN profiles p2 ON p2.id = page.user_id
                    CROSS JOIN LATERAL (
                        SELECT public.verified_at(p2) AS verified_at_result
                    ) va
                )
                SELECT * FROM enriched
            ) sub) AS send_id_matches,
    -- tag matches
    (
        SELECT
            array_agg(ROW(sub.avatar_url, sub.tag_name, sub.send_id, sub.phone, sub.is_verified, sub.verified_at)::public.tag_search_result)
        FROM (
            WITH scores AS (
                -- Aggregate user send scores, summing all scores for cumulative activity
                SELECT
                    user_id,
                    SUM(score) AS total_score
                FROM private.send_scores_history
                GROUP BY user_id
            ),
            candidates AS (
                SELECT
                    p.id AS user_id,
                    p.avatar_url,
                    t.name AS tag_name,
                    p.send_id,
                    NULL::text AS phone,
                    (t.name <-> query) AS distance,
                    COALESCE(scores.total_score, 0) AS send_score,
                    LOWER(t.name) = LOWER(query) AS is_exact,
                    CASE WHEN LOWER(t.name) = LOWER(query) THEN 0 ELSE 1 END AS primary_rank
                FROM profiles p
                JOIN send_accounts sa ON sa.user_id = p.id
                JOIN send_account_tags sat ON sat.send_account_id = sa.id
                JOIN tags t ON t.id = sat.tag_id
                    AND t.status = 'confirmed'
                LEFT JOIN scores ON scores.user_id = p.id
                WHERE
                    LOWER(t.name) = LOWER(query)
                    OR (NOT (LOWER(t.name) = LOWER(query)) AND (t.name <<-> query < 0.7 OR t.name ILIKE '%' || query || '%'))
            ),
            ranked AS (
                SELECT
                    c.user_id,
                    c.avatar_url,
                    c.tag_name,
                    c.send_id,
                    c.phone,
                    c.distance,
                    c.send_score,
                    c.is_exact,
                    c.primary_rank,
                    (
                        CASE
                            WHEN c.is_exact THEN
                                -c.send_score
                            ELSE
                                CASE WHEN c.distance IS NULL THEN 0 ELSE c.distance END
                                - (c.send_score / 1000000.0)
                        END
                    ) AS secondary_rank,
                    ROW_NUMBER() OVER (PARTITION BY c.send_id ORDER BY (
                        c.primary_rank,
                        CASE
                            WHEN c.is_exact THEN
                                -c.send_score
                            ELSE
                                CASE WHEN c.distance IS NULL THEN 0 ELSE c.distance END
                                - (c.send_score / 1000000.0)
                        END
                    )) AS rn
                FROM candidates c
            ),
            page AS (
                SELECT
                    r.user_id,
                    r.avatar_url,
                    r.tag_name,
                    r.send_id,
                    r.phone,
                    r.primary_rank,
                    r.secondary_rank
                FROM ranked r
                WHERE r.rn = 1
                ORDER BY r.primary_rank ASC, r.secondary_rank ASC
                LIMIT limit_val OFFSET offset_val
            ),
            enriched AS (
                SELECT
                    page.avatar_url,
                    page.tag_name,
                    page.send_id,
                    page.phone,
                    (va.verified_at_result IS NOT NULL) AS is_verified,
                    va.verified_at_result AS verified_at
                FROM page
                JOIN profiles p2 ON p2.id = page.user_id
                CROSS JOIN LATERAL (
                    SELECT public.verified_at(p2) AS verified_at_result
                ) va
            )
            SELECT * FROM enriched
        ) sub
    ) AS tag_matches,
    -- phone matches, disabled for now
    (null::public.tag_search_result[]) AS phone_matches;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS SETOF profile_lookup_result
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
AS $function$
begin
    if identifier is null or identifier = '' then raise exception 'identifier cannot be null or empty'; end if;
    if lookup_type is null then raise exception 'lookup_type cannot be null'; end if;

    RETURN QUERY
    SELECT
      CASE WHEN p.id = (SELECT auth.uid()) THEN p.id END AS id,
      p.avatar_url::text AS avatar_url,
      p.name::text AS name,
      p.about::text AS about,
      p.referral_code AS refcode,
      CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
      CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
      COALESCE(mt.name, t.name) AS tag,
      sa.address AS address,
      sa.chain_id AS chain_id,
      CASE WHEN current_setting('role')::text = 'service_role' THEN p.is_public
           WHEN p.is_public THEN true ELSE false END AS is_public,
      p.send_id AS sendid,
      (
        SELECT array_agg(t2.name::text)
        FROM tags t2
        JOIN send_account_tags sat2 ON sat2.tag_id = t2.id
        JOIN send_accounts sa2 ON sa2.id = sat2.send_account_id
        WHERE sa2.user_id = p.id AND t2.status = 'confirmed'::tag_status
      ) AS all_tags,
      CASE WHEN p.id = (SELECT auth.uid()) THEN sa.main_tag_id END AS main_tag_id,
      mt.name::text AS main_tag_name,
      CASE WHEN p.is_public THEN (
        SELECT array_agg(link_in_bio_row)
        FROM (
          SELECT ROW(
            CASE WHEN lib.user_id = (SELECT auth.uid()) THEN lib.id ELSE NULL END,
            CASE WHEN lib.user_id = (SELECT auth.uid()) THEN lib.user_id ELSE NULL END,
            lib.handle,
            lib.domain_name,
            lib.created_at,
            lib.updated_at,
            lib.domain
          )::link_in_bio AS link_in_bio_row
          FROM link_in_bio lib
          WHERE lib.user_id = p.id AND lib.handle IS NOT NULL
        ) sub
      ) ELSE NULL END AS links_in_bio,
      p.banner_url::text AS banner_url,
      (verified_at_result IS NOT NULL) AS is_verified,
      verified_at_result AS verified_at
    FROM (
      SELECT
        p.*,
        public.verified_at(p) AS verified_at_result
      FROM profiles p
      JOIN auth.users a ON a.id = p.id
      LEFT JOIN send_accounts sa ON sa.user_id = p.id
      LEFT JOIN tags mt ON mt.id = sa.main_tag_id
      LEFT JOIN send_account_tags sat ON sat.send_account_id = sa.id
      LEFT JOIN tags t ON t.id = sat.tag_id AND t.status = 'confirmed'::tag_status
      WHERE ((lookup_type = 'sendid'  AND p.send_id::text = identifier) OR
             (lookup_type = 'tag'     AND t.name = identifier::citext) OR
             (lookup_type = 'refcode' AND p.referral_code = identifier) OR
             (lookup_type = 'address' AND sa.address = identifier) OR
             (p.is_public AND lookup_type = 'phone' AND a.phone::text = identifier))
        AND (p.is_public OR (SELECT auth.uid()) IS NOT NULL OR current_setting('role')::text = 'service_role')
      LIMIT 1
    ) p
    LEFT JOIN auth.users a ON a.id = p.id
    LEFT JOIN send_accounts sa ON sa.user_id = p.id
    LEFT JOIN tags mt ON mt.id = sa.main_tag_id
    LEFT JOIN send_account_tags sat ON sat.send_account_id = sa.id
    LEFT JOIN tags t ON t.id = sat.tag_id AND t.status = 'confirmed'::tag_status;
end;
$function$
;

create or replace view "public"."referrer" as  WITH referrer AS (
         SELECT p.send_id
           FROM (referrals r
             JOIN profiles p ON ((r.referrer_id = p.id)))
          WHERE (r.referred_id = ( SELECT auth.uid() AS uid))
          ORDER BY r.created_at
         LIMIT 1
        ), profile_lookup AS (
         SELECT p.id,
            p.avatar_url,
            p.name,
            p.about,
            p.refcode,
            p.x_username,
            p.birthday,
            p.tag,
            p.address,
            p.chain_id,
            p.is_public,
            p.sendid,
            p.all_tags,
            p.main_tag_id,
            p.main_tag_name,
            p.links_in_bio,
            p.banner_url,
            referrer.send_id,
            p.is_verified,
            p.verified_at
           FROM (profile_lookup('sendid'::lookup_type_enum, ( SELECT (referrer_1.send_id)::text AS send_id
                   FROM referrer referrer_1)) p(id, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio, banner_url, is_verified, verified_at)
             JOIN referrer ON ((referrer.send_id IS NOT NULL)))
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
    profile_lookup.verified_at,
    profile_lookup.is_verified
   FROM profile_lookup;