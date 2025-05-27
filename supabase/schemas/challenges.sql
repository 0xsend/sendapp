-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."challenges_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."challenges_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" integer NOT NULL,
    "challenge" "bytea" DEFAULT "extensions"."gen_random_bytes"(64) NOT NULL,
    "created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expires_at" timestamp with time zone DEFAULT (CURRENT_TIMESTAMP + '00:15:00'::interval) NOT NULL
);
ALTER TABLE "public"."challenges" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."challenges_id_seq" OWNED BY "public"."challenges"."id";
ALTER TABLE ONLY "public"."challenges" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."challenges_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_challenge_key" UNIQUE ("challenge");

-- Functions
CREATE OR REPLACE FUNCTION public.insert_challenge()
 RETURNS challenges
 LANGUAGE plpgsql
AS $function$
    #variable_conflict use_column
    declare
            _created timestamptz := current_timestamp;
            _expires timestamptz := _created + interval '15 minute';
            _new_challenge challenges;
    begin
        INSERT INTO "public"."challenges"
        (created_at, expires_at)
        VALUES (_created, _expires)
        RETURNING * into _new_challenge;

        return _new_challenge;
    end
$function$
;

ALTER FUNCTION "public"."insert_challenge"() OWNER TO "postgres";

-- Indexes
-- No additional indexes

-- Foreign Keys
-- No foreign keys

-- Triggers
-- No triggers

-- RLS
alter table "public"."challenges" enable row level security;

-- Grants
GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";

GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."challenges_id_seq" TO "service_role";

REVOKE ALL ON FUNCTION "public"."insert_challenge"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."insert_challenge"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_challenge"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_challenge"() TO "service_role";
