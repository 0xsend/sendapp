-- Types
-- Note: activity_feed_user is defined in types.sql

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."activity_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."activity_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."activity" (
    "id" integer NOT NULL,
    "event_name" "text" NOT NULL,
    "event_id" character varying(255) NOT NULL,
    "from_user_id" "uuid",
    "to_user_id" "uuid",
    "data" "jsonb",
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
ALTER TABLE "public"."activity" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."activity_id_seq" OWNED BY "public"."activity"."id";
ALTER TABLE ONLY "public"."activity" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."activity_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."activity"
    ADD CONSTRAINT "activity_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE INDEX "activity_created_at_idx" ON "public"."activity" USING "btree" ("created_at");
CREATE UNIQUE INDEX "activity_event_name_event_id_idx" ON "public"."activity" USING "btree" ("event_name", "event_id");
CREATE INDEX "activity_from_user_id_event_name_idx" ON "public"."activity" USING "btree" ("from_user_id", "created_at", "event_name");
CREATE INDEX "activity_to_user_id_event_name_idx" ON "public"."activity" USING "btree" ("to_user_id", "created_at", "event_name");

-- Foreign Keys
ALTER TABLE ONLY "public"."activity"
    ADD CONSTRAINT "activity_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;
ALTER TABLE ONLY "public"."activity"
    ADD CONSTRAINT "activity_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Views
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

-- Functions (that depend on activity_feed view)

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
        decode(replace(sa.address::text, '0x', ''), 'hex') = seb.owner
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
SELECT (counterparty).* -- only fields from activity feed
FROM with_user_id wui
INNER JOIN user_send_scores uss ON uss.user_id = wui.user_id
INNER JOIN user_earn_balances ueb ON ueb.user_id = wui.user_id
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
ALTER FUNCTION "public"."favourite_senders"() OWNER TO "postgres";

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

ALTER FUNCTION "public"."recent_senders"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.did_user_swap()
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM activity_feed af
        WHERE (
            EXISTS (
              SELECT 1 FROM liquidity_pools lp
              WHERE (af.data->>'f')::bytea = lp.pool_addr
            )
            OR EXISTS (
              SELECT 1 FROM swap_routers sr
              WHERE (af.data->>'f')::bytea = sr.router_addr
            )
            OR EXISTS (
              SELECT 1 FROM liquidity_pools lp
              WHERE (af.data->>'t')::bytea = lp.pool_addr
            )
            OR EXISTS (
              SELECT 1 FROM swap_routers sr
              WHERE (af.data->>'t')::bytea = sr.router_addr
            )
        )
        LIMIT 1
    );
END;
$function$
;

ALTER FUNCTION "public"."did_user_swap"() OWNER TO "postgres";

-- Functions (that depend on activity table directly)
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

-- Function

CREATE OR REPLACE FUNCTION public.update_transfer_activity_before_insert()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
DECLARE
    note text;
    temporal_event_id text;
BEGIN
    IF (
    NEW.event_name = 'send_account_transfers'
    OR NEW.event_name = 'send_account_receives'
    )
    AND NEW.from_user_id IS NOT NULL
    AND NEW.to_user_id IS NOT NULL
    THEN
        SELECT
            data->>'note',
            t_sat.workflow_id INTO note, temporal_event_id
        FROM temporal.send_account_transfers t_sat
        WHERE t_sat.send_account_transfers_activity_event_id = NEW.event_id
        AND t_sat.send_account_transfers_activity_event_name = NEW.event_name;

        IF note IS NOT NULL THEN
            NEW.data = NEW.data || jsonb_build_object('note', note);
        END IF;

        -- Delete any temporal activity that might exist
        IF temporal_event_id IS NOT NULL THEN
            DELETE FROM public.activity
            WHERE event_id = temporal_event_id
            AND event_name = 'temporal_send_account_transfers';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;


ALTER FUNCTION "public"."update_transfer_activity_before_insert"() OWNER TO "postgres";

-- Triggers
CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_update_transfer_activit" BEFORE INSERT ON "public"."activity" FOR EACH ROW EXECUTE FUNCTION "public"."update_transfer_activity_before_insert"();

-- RLS
alter table activity enable row level security;

-- Grants
GRANT ALL ON TABLE "public"."activity" TO "anon";
GRANT ALL ON TABLE "public"."activity" TO "authenticated";
GRANT ALL ON TABLE "public"."activity" TO "service_role";

GRANT ALL ON TABLE "public"."activity_feed" TO "anon";
GRANT ALL ON TABLE "public"."activity_feed" TO "authenticated";
GRANT ALL ON TABLE "public"."activity_feed" TO "service_role";

REVOKE ALL ON FUNCTION "public"."favourite_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."favourite_senders"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."recent_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."recent_senders"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."today_birthday_senders"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "anon";
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."today_birthday_senders"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."did_user_swap"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."did_user_swap"() TO "anon";
GRANT ALL ON FUNCTION "public"."did_user_swap"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."did_user_swap"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "service_role";

GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "service_role";
