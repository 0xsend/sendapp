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

REVOKE ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_transfer_activity_before_insert"() TO "service_role";

GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."activity_id_seq" TO "service_role";
