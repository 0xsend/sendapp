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
CREATE OR REPLACE VIEW "public"."activity_feed" WITH ("security_barrier"='on') AS
 SELECT "a"."created_at",
    "a"."event_name",
        CASE
            WHEN ("a"."from_user_id" = "from_p"."id") THEN ROW(
            CASE
                WHEN ("a"."from_user_id" = ( SELECT "auth"."uid"() AS "uid")) THEN ( SELECT "auth"."uid"() AS "uid")
                ELSE NULL::"uuid"
            END, "from_p"."name", "from_p"."avatar_url", "from_p"."send_id", (( SELECT "array_agg"("tags"."name") AS "array_agg"
               FROM "public"."tags"
              WHERE (("tags"."user_id" = "from_p"."id") AND ("tags"."status" = 'confirmed'::"public"."tag_status"))))::"text"[])::"public"."activity_feed_user"
            ELSE NULL::"public"."activity_feed_user"
        END AS "from_user",
        CASE
            WHEN ("a"."to_user_id" = "to_p"."id") THEN ROW(
            CASE
                WHEN ("a"."to_user_id" = ( SELECT "auth"."uid"() AS "uid")) THEN ( SELECT "auth"."uid"() AS "uid")
                ELSE NULL::"uuid"
            END, "to_p"."name", "to_p"."avatar_url", "to_p"."send_id", (( SELECT "array_agg"("tags"."name") AS "array_agg"
               FROM "public"."tags"
              WHERE (("tags"."user_id" = "to_p"."id") AND ("tags"."status" = 'confirmed'::"public"."tag_status"))))::"text"[])::"public"."activity_feed_user"
            ELSE NULL::"public"."activity_feed_user"
        END AS "to_user",
    "a"."data"
   FROM (("public"."activity" "a"
     LEFT JOIN "public"."profiles" "from_p" ON (("a"."from_user_id" = "from_p"."id")))
     LEFT JOIN "public"."profiles" "to_p" ON (("a"."to_user_id" = "to_p"."id")))
  WHERE (("a"."from_user_id" = ( SELECT "auth"."uid"() AS "uid")) OR (("a"."to_user_id" = ( SELECT "auth"."uid"() AS "uid")) AND ("a"."event_name" !~~ 'temporal_%'::"text")))
  GROUP BY "a"."created_at", "a"."event_name", "a"."from_user_id", "a"."to_user_id", "from_p"."id", "from_p"."name", "from_p"."avatar_url", "from_p"."send_id", "to_p"."id", "to_p"."name", "to_p"."avatar_url", "to_p"."send_id", "a"."data";
ALTER TABLE "public"."activity_feed" OWNER TO "postgres";

-- Functions (that depend on activity_feed view)
CREATE OR REPLACE FUNCTION public.favourite_senders()
 RETURNS SETOF activity_feed_user
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

-- Functions (that depend on activity table directly)
CREATE OR REPLACE FUNCTION today_birthday_senders()
RETURNS SETOF activity_feed_user
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
RETURN QUERY
SELECT (
   (
    NULL,
    p.name,
    p.avatar_url,
    p.send_id,
    (
        SELECT ARRAY_AGG(name)
        FROM tags
        WHERE user_id = p.id
          AND status = 'confirmed'
    )
       )::activity_feed_user
).*
FROM profiles p
WHERE is_public = TRUE
  AND p.birthday IS NOT NULL
  AND p.avatar_url IS NOT NULL
  AND EXTRACT(MONTH FROM p.birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
  AND EXTRACT(DAY FROM p.birthday) = EXTRACT(DAY FROM CURRENT_DATE);
END;
$$;
ALTER FUNCTION "public"."today_birthday_senders"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.update_transfer_activity_before_insert()
 RETURNS trigger
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
$function$
;

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

REVOKE ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "service_role";

GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "service_role";
