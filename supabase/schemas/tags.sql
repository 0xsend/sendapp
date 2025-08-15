-- Types
-- Note: tag_status and tag_search_result are defined in types.sql and shared across tables

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."tags_id_seq"
    AS bigint START WITH 1
    INCREMENT BY 1
    NO MAXVALUE
    NO MINVALUE
    CACHE 1;

ALTER TABLE "public"."tags_id_seq" OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."tags" (
    "id" bigint NOT NULL DEFAULT nextval('tags_id_seq'),
    "name" "public"."citext" NOT NULL,
    "status" "public"."tag_status" DEFAULT 'pending'::"public"."tag_status" NOT NULL,
    "user_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);

alter table "public"."tags" add constraint "tags_name_check" CHECK (((length((name)::text) >= 1) AND (length((name)::text) <= 20) AND (name ~ '^[A-Za-z0-9_]+$'::citext))) not valid;

alter table "public"."tags" validate constraint "tags_name_check";

ALTER TABLE "public"."tags" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_name_unique" UNIQUE ("name");

-- Indexes
CREATE INDEX "idx_tags_status_created" ON "public"."tags" USING "btree" ("status", "created_at" DESC) WHERE ("status" = 'confirmed'::"public"."tag_status");
CREATE INDEX "tags_name_trigram_gin_idx" ON "public"."tags" USING "gin" ("name" "extensions"."gin_trgm_ops");
CREATE INDEX "tags_user_id_idx" ON "public"."tags" USING "btree" ("user_id");
CREATE INDEX "idx_tags_status" ON "public"."tags" USING "btree" ("status") WHERE ("status" = 'available'::"public"."tag_status");

-- Foreign Keys
ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Functions
CREATE OR REPLACE FUNCTION public.create_tag(tag_name citext, send_account_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _tag_id bigint;
    _original_error_code text;
    _original_error_message text;
BEGIN
    BEGIN
        -- Verify user owns the send_account
        IF NOT EXISTS (
            SELECT
                1
            FROM
                send_accounts
            WHERE
                id = send_account_id
                AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'User does not own this send_account';
    END IF;
    -- Check tag count before insert
    IF (
        SELECT
            COUNT(*)
        FROM
            tags t
            JOIN send_account_tags sat ON sat.tag_id = t.id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE
            sa.user_id = auth.uid()) >= 5 THEN
        RAISE EXCEPTION 'User can have at most 5 tags';
    END IF;
    -- Check if tag exists and is available
    WITH available_tag AS (
        UPDATE
            tags
        SET
            status = 'pending',
            user_id = auth.uid(),
            updated_at = NOW()
        WHERE
            name = tag_name
            AND status = 'available'
        RETURNING
            id
    ),
    new_tag AS (
        INSERT INTO tags(name, status, user_id)
        SELECT
            tag_name,
            'pending',
            auth.uid()
        WHERE
            NOT EXISTS (
                SELECT
                    1
                FROM
                    available_tag)
            RETURNING
                id
    )
    INSERT INTO send_account_tags(send_account_id, tag_id)
    SELECT
        send_account_id,
        id
    FROM (
        SELECT
            id
        FROM
            available_tag
        UNION ALL
        SELECT
            id
        FROM
            new_tag) tags
    RETURNING
        tag_id INTO _tag_id;

    EXCEPTION
        WHEN OTHERS THEN
            GET STACKED DIAGNOSTICS
                _original_error_code = RETURNED_SQLSTATE,
                _original_error_message = MESSAGE_TEXT;
            RAISE EXCEPTION USING
                ERRCODE = _original_error_code,
                MESSAGE = _original_error_message;
    END;
    RETURN _tag_id;
END;
$function$
;

ALTER FUNCTION "public"."create_tag"("tag_name" "public"."citext", "send_account_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.confirm_tags(tag_names citext[], send_account_id uuid, _event_id text, _referral_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _sender bytea;
    _user_id uuid;
    _send_account_id ALIAS FOR send_account_id;
    referrer_id uuid;
BEGIN
    -- Get the sender from the receipt
    SELECT
        scr.sender,
        sa.user_id INTO _sender,
        _user_id
    FROM
        sendtag_checkout_receipts scr
        JOIN send_accounts sa ON decode(substring(sa.address, 3), 'hex') = scr.sender
    WHERE
        scr.event_id = _event_id;
    -- Verify the sender matches the send_account
    IF NOT EXISTS (
        SELECT
            1
        FROM
            send_accounts sa
        WHERE
            id = _send_account_id
            AND decode(substring(sa.address, 3), 'hex') = _sender) THEN
        RAISE EXCEPTION 'Receipt event ID does not match the sender';
    END IF;

    -- Verify all tags being confirmed are associated with the send account
    IF (
        SELECT
            COUNT(*)
        FROM
            unnest(tag_names) AS tag_name
    ) > (
        SELECT
            COUNT(*)
        FROM
            tags t
            JOIN send_account_tags sat ON sat.tag_id = t.id
        WHERE
            t.name = ANY(tag_names)
            AND sat.send_account_id = _send_account_id
            AND t.status = 'pending'
    ) THEN
        RAISE EXCEPTION 'All tags must be associated with the send account before confirmation';
    END IF;

    -- Create receipt
    INSERT INTO receipts(event_id, user_id)
        VALUES (_event_id, _user_id);
    -- Update tags status which will trigger the verification
    UPDATE
        tags
    SET
        status = 'confirmed'
    WHERE
        name = ANY (tag_names)
        AND status = 'pending'
        AND id IN (
            SELECT
                t.id
            FROM
                tags t
                JOIN send_account_tags sat ON sat.tag_id = t.id
            WHERE
                sat.send_account_id = _send_account_id
        );
    -- Associate tags with event
    INSERT INTO tag_receipts(tag_name, tag_id, event_id)
    SELECT
        t.name,
        t.id,
        _event_id
    FROM
        tags t
        JOIN send_account_tags sat ON sat.tag_id = t.id
    WHERE
        t.name = ANY (tag_names)
        AND t.status = 'confirmed'
        AND sat.send_account_id = _send_account_id;
    -- Handle referral
    IF _referral_code IS NOT NULL AND _referral_code <> '' THEN
        SELECT
            id INTO referrer_id
        FROM
            public.profiles
        WHERE
            referral_code = _referral_code;
        IF referrer_id IS NOT NULL AND referrer_id != _user_id THEN
            -- Check if a referral already exists for this user
            IF NOT EXISTS (
                SELECT
                    1
                FROM
                    public.referrals
                WHERE
                    referred_id = _user_id) THEN
            -- Insert only one referral for the user
            INSERT INTO referrals(referrer_id, referred_id)
            VALUES (referrer_id, _user_id);
        END IF;
    END IF;
END IF;
END;
$function$
;

ALTER FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "send_account_id" "uuid", "_event_id" "text", "_referral_code" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.handle_tag_confirmation()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- If this is the first confirmed tag for the send account, set it as main
    -- But ensure we pick the earliest created tag if multiple are confirmed simultaneously
    UPDATE
        send_accounts sa
    SET
        main_tag_id = (
            SELECT t.id
            FROM send_account_tags sat
            JOIN tags t ON t.id = sat.tag_id
            WHERE sat.send_account_id = sa.id
              AND t.status = 'confirmed'
            ORDER BY sat.created_at ASC, t.id ASC
            LIMIT 1
        )
    FROM
        send_account_tags sat
    WHERE
        sat.tag_id = NEW.id
        AND sat.send_account_id = sa.id
        AND (sa.main_tag_id IS NULL OR NOT EXISTS(
            SELECT 1 FROM tags WHERE id = sa.main_tag_id AND status = 'confirmed'
        ));
    RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."handle_tag_confirmation"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."tags"("public"."profiles") RETURNS SETOF "public"."tags"
    LANGUAGE "sql" STABLE
    AS $_$
    SELECT * FROM tags WHERE user_id = $1.id
$_$;

ALTER FUNCTION "public"."tags"("public"."profiles") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.tags_after_insert_or_update_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Ensure that a user does not exceed the tag limit
    IF TG_OP = 'INSERT' AND(
        SELECT
            COUNT(DISTINCT t.id)
        FROM
            public.tags t
            JOIN send_account_tags sat ON sat.tag_id = t.id
            JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE
            sa.user_id = auth.uid()) > 5 THEN
        RAISE EXCEPTION 'User can have at most 5 tags';
    END IF;
    RETURN NEW;
END;
$function$;

ALTER FUNCTION "public"."tags_after_insert_or_update_func"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.tags_before_insert_or_update_func()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    _debug text;
    _is_first_sendtag boolean := false;
BEGIN
    -- Ensure user is not changing their confirmed tag name
    IF TG_OP = 'UPDATE' AND current_setting('role')::text = 'authenticated' AND NEW.status = 'confirmed'::public.tag_status AND OLD.name <> NEW.name THEN
        RAISE EXCEPTION 'Users cannot change the name of a confirmed tag';
    END IF;

    -- Ensure user is not confirming their own tag (except for first sendtag)
    IF NEW.status = 'confirmed'::public.tag_status
        AND current_setting('role')::text = 'authenticated'
        AND EXISTS (
            SELECT 1
            FROM tags t
            WHERE t.user_id = NEW.user_id
            AND t.status = 'confirmed'
            AND t.id != NEW.id)
    THEN
        RAISE EXCEPTION 'Users cannot confirm their own tags';
    END IF;
    -- For INSERT operations, handle existing tags
    IF TG_OP = 'INSERT' THEN
        -- Check for recent pending tags by other users first
        IF EXISTS (
            SELECT
                1
            FROM
                tags t
                JOIN send_account_tags sat ON sat.tag_id = t.id
                JOIN send_accounts sa ON sa.id = sat.send_account_id
            WHERE
                t.name = NEW.name
                AND t.status = 'pending'::public.tag_status
                AND (NOW() - t.created_at) < INTERVAL '30 minutes'
                AND sa.user_id != auth.uid()) THEN
        RAISE EXCEPTION 'Tag with same name already exists';
    END IF;
    -- Delete send_account_tags for expired pending tags
    DELETE FROM send_account_tags sat USING tags t, send_accounts sa
    WHERE sat.tag_id = t.id
        AND sat.send_account_id = sa.id
        AND t.name = NEW.name
        AND t.status = 'pending'::public.tag_status
        AND (NOW() - t.created_at) > INTERVAL '30 minutes'
        AND sa.user_id != auth.uid();
    -- If there's an available tag, update it instead of inserting
    UPDATE
        tags
    SET
        status = 'available',
        updated_at = now()
    WHERE
        name = NEW.name
        AND status != 'confirmed';
    -- If we found and updated a tag, skip the INSERT
    IF FOUND THEN
        RETURN NULL;
    END IF;
END IF;
    RETURN NEW;
END;
$function$;

ALTER FUNCTION "public"."tags_before_insert_or_update_func"() OWNER TO "postgres";

-- Triggers
CREATE OR REPLACE TRIGGER "trigger_tags_after_insert_or_update" AFTER INSERT OR UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."tags_after_insert_or_update_func"();

CREATE OR REPLACE TRIGGER "trigger_tags_before_insert_or_update" BEFORE INSERT OR UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."tags_before_insert_or_update_func"();

CREATE TRIGGER "set_timestamp"
    BEFORE UPDATE ON "public"."tags"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."set_current_timestamp_updated_at"();

CREATE TRIGGER "set_main_tag_on_confirmation"
    AFTER UPDATE ON "public"."tags"
    FOR EACH ROW
    WHEN(NEW.status = 'confirmed'::public.tag_status)
    EXECUTE FUNCTION "public"."handle_tag_confirmation"();

-- RLS
ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";

GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."tags_id_seq" TO "service_role";

REVOKE ALL ON FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "send_account_id" "uuid", "_event_id" "text", "_referral_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "send_account_id" "uuid", "_event_id" "text", "_referral_code" "text") TO "service_role";

GRANT EXECUTE ON FUNCTION "public"."create_tag"("tag_name" "public"."citext", "send_account_id" "uuid") TO "authenticated";

REVOKE ALL ON FUNCTION "public"."tags"("public"."profiles") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tags"("public"."profiles") TO "anon";
GRANT ALL ON FUNCTION "public"."tags"("public"."profiles") TO "authenticated";
GRANT ALL ON FUNCTION "public"."tags"("public"."profiles") TO "service_role";

REVOKE ALL ON FUNCTION "public"."tags_after_insert_or_update_func"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tags_after_insert_or_update_func"() TO "anon";
GRANT ALL ON FUNCTION "public"."tags_after_insert_or_update_func"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tags_after_insert_or_update_func"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."tags_before_insert_or_update_func"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tags_before_insert_or_update_func"() TO "anon";
GRANT ALL ON FUNCTION "public"."tags_before_insert_or_update_func"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."tags_before_insert_or_update_func"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_tag_confirmation"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_tag_confirmation"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_tag_confirmation"() TO "service_role";
