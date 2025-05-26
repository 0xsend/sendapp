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
CREATE OR REPLACE FUNCTION "public"."favourite_senders"() RETURNS SETOF "public"."activity_feed_user"
    LANGUAGE "sql" STABLE
    AS $$
    WITH recent_transfers AS (
        SELECT "from_user" AS user, COUNT(*) AS activity_count
        FROM activity_feed
        WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
        AND event_name = 'send_account_transfers'
        AND (to_user).id = auth.uid()
        AND from_user IS NOT NULL
        GROUP BY from_user
        HAVING COUNT(*) >= 3
        ORDER BY activity_count DESC
        LIMIT 5
    )
    SELECT DISTINCT (recent_transfers.user).*
    FROM recent_transfers
$$;
ALTER FUNCTION "public"."favourite_senders"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."recent_senders"() RETURNS SETOF "public"."activity_feed_user"
    LANGUAGE "sql" STABLE
    AS $$
    WITH recent_transfers AS (
        SELECT "from_user" AS user, MAX(created_at) AS last_transfer_date
        FROM activity_feed
        WHERE created_at >= CURRENT_DATE - INTERVAL '60 days'
        AND event_name = 'send_account_transfers'
        AND (to_user).id = auth.uid()
        AND from_user IS NOT NULL
        GROUP BY from_user
        ORDER BY last_transfer_date DESC
        LIMIT 10
    )
    SELECT DISTINCT (recent_transfers.user).*
    FROM recent_transfers
$$;
ALTER FUNCTION "public"."recent_senders"() OWNER TO "postgres";

-- Functions (that depend on activity table directly)
CREATE OR REPLACE FUNCTION "public"."today_birthday_senders"() RETURNS SETOF "public"."activity_feed_user"
    LANGUAGE "sql" STABLE
    AS $$
   WITH unique_senders AS (
       SELECT DISTINCT from_user_id
       FROM activity
       WHERE to_user_id = auth.uid()
         AND event_name = 'send_account_transfers'
         AND from_user_id IS NOT NULL
   )
   SELECT (
       profiles.id,
       profiles.name,
       profiles.avatar_url,
       profiles.send_id,
       ARRAY(
           SELECT tags.name
           FROM public.tags
           WHERE tags.user_id = profiles.id
             AND tags.status = 'confirmed'
       )
   )::activity_feed_user
   FROM profiles
   INNER JOIN unique_senders ON profiles.id = unique_senders.from_user_id
   WHERE EXTRACT(MONTH FROM profiles.birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
     AND EXTRACT(DAY FROM profiles.birthday) = EXTRACT(DAY FROM CURRENT_DATE)
$$;
ALTER FUNCTION "public"."today_birthday_senders"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."update_transfer_activity_before_insert"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    tmp_data jsonb;
    note_id uuid;
    note_text text;
    temporal_status temporal.transfer_status;
BEGIN
    -- Check if the event name contains '_transfers'
    IF position('_transfers' in NEW.event_name) > 0 THEN
        -- Query the temporal.send_account_transfers table
        SELECT note, status INTO note_id, temporal_status
        FROM temporal.send_account_transfers
        WHERE id::text = NEW.event_id AND status = 'confirmed';

        -- Check if a confirmed record was found
        IF note_id IS NOT NULL THEN
            -- Parse the JSON data to get the note_text
            note_text := NEW.data ->> 'note';

            -- Create the temporary JSON object
            tmp_data := jsonb_build_object('note_id', note_id, 'note', note_text);

            -- Merge tmp_data into NEW.data
            NEW.data := NEW.data || tmp_data;
        END IF;
    END IF;

    -- Return the modified row
    RETURN NEW;
END;
$$;
ALTER FUNCTION "public"."update_transfer_activity_before_insert"() OWNER TO "postgres";

-- Triggers
CREATE OR REPLACE TRIGGER "temporal_send_account_transfers_trigger_update_transfer_activit" BEFORE INSERT ON "public"."activity" FOR EACH ROW EXECUTE FUNCTION "public"."update_transfer_activity_before_insert"();

-- RLS
-- Note: RLS is not enabled on the activity table

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