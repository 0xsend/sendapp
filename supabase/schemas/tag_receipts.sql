-- Functions
CREATE OR REPLACE FUNCTION public.tag_receipts_insert_activity_trigger()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $function$
BEGIN
    DELETE FROM activity
    WHERE event_name = 'tag_receipt_usdc'
        AND event_id IN(
            SELECT
                event_id
            FROM
                NEW_TABLE);
    -- Insert activity records using send_account_id from the confirmation
    INSERT INTO activity(event_name, event_id, from_user_id, data)
    SELECT
        'tag_receipt_usdc',
        NEW_TABLE.event_id,
        r.user_id,
        jsonb_build_object('log_addr', scr.log_addr, 'block_num', scr.block_num, 'tx_idx', scr.tx_idx, 'log_idx', scr.log_idx, 'tx_hash', scr.tx_hash, 'tags', array_agg(NEW_TABLE.tag_name), 'value', scr.amount::text)
    FROM
        NEW_TABLE
        JOIN receipts r ON r.event_id = NEW_TABLE.event_id
        JOIN sendtag_checkout_receipts scr ON scr.event_id = NEW_TABLE.event_id
    GROUP BY
        r.user_id,
        NEW_TABLE.event_id,
        scr.event_id,
        scr.log_addr,
        scr.block_num,
        scr.tx_idx,
        scr.log_idx,
        scr.tx_hash,
        scr.amount;
    RETURN NULL;
END;
$function$;
ALTER FUNCTION "public"."tag_receipts_insert_activity_trigger"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.insert_verification_tag_registration_from_receipt()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
    curr_distribution_id bigint;
    tag_user_id uuid;
BEGIN
    -- Get the tag's user_id
    SELECT user_id INTO tag_user_id
    FROM tags
    WHERE name = NEW.tag_name;

    -- If no tag found, return
    IF tag_user_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- get the current distribution id
    curr_distribution_id := (
        SELECT id
        FROM distributions
        WHERE qualification_start <= (now() AT TIME ZONE 'UTC')
            AND qualification_end >= (now() AT TIME ZONE 'UTC')
        ORDER BY qualification_start DESC
        LIMIT 1
    );

    -- check if a verification for the same user, tag, and distribution already exists
    IF curr_distribution_id IS NOT NULL THEN
        -- insert new verification
        INSERT INTO public.distribution_verifications (
            distribution_id,
            user_id,
            type,
            metadata,
            weight
        )
        VALUES (
            curr_distribution_id,
            tag_user_id,
            'tag_registration'::public.verification_type,
            jsonb_build_object('tag', NEW.tag_name),
            CASE
                WHEN LENGTH(NEW.tag_name) >= 6 THEN 1
                WHEN LENGTH(NEW.tag_name) = 5 THEN 2
                WHEN LENGTH(NEW.tag_name) = 4 THEN 3
                WHEN LENGTH(NEW.tag_name) > 0  THEN 4
                ELSE 0
            END
        );
    END IF;

    RETURN NEW;
END;
$$;

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."tag_receipts_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER TABLE "public"."tag_receipts_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."tag_receipts" (
    "tag_name" "public"."citext" NOT NULL,
    "tag_id" bigint NOT NULL,
    "hash" "public"."citext",
    "event_id" "text",
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);
ALTER TABLE "public"."tag_receipts" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."tag_receipts_id_seq" OWNED BY "public"."tag_receipts"."id";
ALTER TABLE ONLY "public"."tag_receipts" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."tag_receipts_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."tag_receipts"
    ADD CONSTRAINT "tag_receipts_pkey" PRIMARY KEY ("id");

-- Indexes
CREATE UNIQUE INDEX "tag_receipts_event_id_idx" ON "public"."tag_receipts" USING "btree" ("tag_name", "event_id");

-- Foreign Keys
ALTER TABLE ONLY "public"."tag_receipts"
    ADD CONSTRAINT "tag_receipts_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;

-- Triggers
CREATE OR REPLACE TRIGGER "tag_receipts_insert_activity_trigger" AFTER INSERT ON "public"."tag_receipts" REFERENCING NEW TABLE AS "new_table" FOR EACH STATEMENT EXECUTE FUNCTION "public"."tag_receipts_insert_activity_trigger"();

CREATE TRIGGER insert_verification_tag_registration_from_receipt
AFTER INSERT ON public.tag_receipts
FOR EACH ROW
EXECUTE PROCEDURE public.insert_verification_tag_registration_from_receipt();

-- RLS
alter table "public"."tag_receipts" enable row level security;

-- Grants
GRANT ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tag_receipts_insert_activity_trigger"() TO "service_role";

GRANT ALL ON TABLE "public"."tag_receipts" TO "anon";
GRANT ALL ON TABLE "public"."tag_receipts" TO "authenticated";
GRANT ALL ON TABLE "public"."tag_receipts" TO "service_role";

GRANT ALL ON SEQUENCE "public"."tag_receipts_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tag_receipts_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tag_receipts_id_seq" TO "service_role";
