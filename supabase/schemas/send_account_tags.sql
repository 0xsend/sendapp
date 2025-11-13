-- Table: send_account_tags
-- Junction table that links send accounts to tags
CREATE TABLE IF NOT EXISTS "public"."send_account_tags" (
    "id" serial PRIMARY KEY,
    "send_account_id" uuid NOT NULL,
    "tag_id" bigint NOT NULL,
    "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
    "updated_at" timestamp with time zone NOT NULL DEFAULT NOW()
);

ALTER TABLE "public"."send_account_tags" OWNER TO "postgres";

-- Indexes
CREATE INDEX "idx_send_account_tags_tag_id" ON "public"."send_account_tags" USING "btree" ("tag_id");
CREATE INDEX "idx_send_account_tags_send_account_id" ON "public"."send_account_tags" USING "btree" ("send_account_id");
CREATE UNIQUE INDEX "idx_send_account_tags_unique" ON "public"."send_account_tags" USING "btree" ("send_account_id", "tag_id");

-- Foreign Keys
ALTER TABLE ONLY "public"."send_account_tags"
    ADD CONSTRAINT "send_account_tags_send_account_id_fkey" FOREIGN KEY ("send_account_id") REFERENCES "public"."send_accounts"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."send_account_tags"
    ADD CONSTRAINT "send_account_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE CASCADE;

-- Functions
CREATE OR REPLACE FUNCTION public.handle_send_account_tags_deleted()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Update tag status and clear user_id if no other send_account_tags exist
    UPDATE
        tags t
    SET
        status = 'available',
        user_id = NULL,
        updated_at = NOW()
    WHERE
        t.id = OLD.tag_id
        AND NOT EXISTS(
            SELECT
                1
            FROM
                send_account_tags sat
            WHERE
                sat.tag_id = t.id);
    -- Try to update to next oldest confirmed tag if this was the main tag
    UPDATE
        send_accounts sa
    SET
        main_tag_id =(
            SELECT
                t.id
            FROM
                send_account_tags sat
                JOIN tags t ON t.id = sat.tag_id
            WHERE
                sat.send_account_id = OLD.send_account_id
                AND t.status = 'confirmed'
                AND t.id != OLD.tag_id -- Don't select the tag being deleted
            ORDER BY
                sat.created_at ASC, t.id ASC
            LIMIT 1)
    WHERE
        sa.id = OLD.send_account_id
        AND sa.main_tag_id = OLD.tag_id;
    -- If no other confirmed tags exist, the ON DELETE SET NULL will handle it
    RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."handle_send_account_tags_deleted"() OWNER TO "postgres";

-- Create function to cleanup distribution verifications for active distributions when tag is deleted
CREATE OR REPLACE FUNCTION public.handle_tag_deletion_verifications()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
    tag_name_to_check citext;
    tag_user_id_to_check uuid;
BEGIN
    -- Get tag details before they potentially change
    SELECT t.name, t.user_id
    INTO tag_name_to_check, tag_user_id_to_check
    FROM tags t
    WHERE t.id = OLD.tag_id;

    -- Only delete verifications for ACTIVE distributions (in qualification period)
    DELETE FROM distribution_verifications dv
    WHERE dv.user_id = tag_user_id_to_check
        AND dv.type = 'tag_registration'
        AND dv.metadata->>'tag' = tag_name_to_check
        AND dv.distribution_id IN (
            SELECT id FROM distributions
            WHERE qualification_start <= NOW()
                AND qualification_end >= NOW()
        );

    RETURN OLD;
END;
$$;

ALTER FUNCTION "public"."handle_tag_deletion_verifications"() OWNER TO "postgres";

-- Create function to prevent deletion of last confirmed tag
CREATE OR REPLACE FUNCTION public.prevent_last_confirmed_tag_deletion()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Check if this deletion would leave the user with zero PAID confirmed tags
    -- Only prevent deletion if the tag being deleted is confirmed AND has a receipt (paid)
    IF current_setting('role')::text = 'authenticated' AND
        (SELECT status FROM tags WHERE id = OLD.tag_id) = 'confirmed' THEN

        -- Count remaining PAID confirmed tags after this deletion
        -- A paid tag is one that has a receipt (not the free first sendtag)
        IF (SELECT COUNT(*)
            FROM send_account_tags sat
            JOIN tags t ON t.id = sat.tag_id
            WHERE sat.send_account_id = OLD.send_account_id
            AND t.status = 'confirmed'
            AND sat.tag_id != OLD.tag_id
            AND EXISTS (
                SELECT 1 FROM tag_receipts tr
                WHERE tr.tag_id = t.id
            )) = 0 THEN
            RAISE EXCEPTION 'Cannot delete your last paid sendtag. Users must maintain at least one paid sendtag.';
        END IF;
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."prevent_last_confirmed_tag_deletion"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION public.main_tag(profiles)
 RETURNS tags
 LANGUAGE sql
 STABLE
AS $function$
    SELECT t.* FROM tags t
    LEFT JOIN send_accounts sa ON sa.user_id = $1.id
    LEFT JOIN send_account_tags sat ON sat.send_account_id = sa.id
    WHERE sat.tag_id = sa.main_tag_id
    AND t.id = sat.tag_id
    LIMIT 1
$function$
;

ALTER FUNCTION "public"."main_tag"("public"."profiles") OWNER TO "postgres";

-- Triggers
CREATE TRIGGER "send_account_tags_deleted"
    AFTER DELETE ON "public"."send_account_tags"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_send_account_tags_deleted"();

CREATE TRIGGER "cleanup_active_distribution_verifications_on_tag_delete"
    AFTER DELETE ON "public"."send_account_tags"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."handle_tag_deletion_verifications"();

CREATE TRIGGER "prevent_last_confirmed_tag_deletion"
    BEFORE DELETE ON "public"."send_account_tags"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."prevent_last_confirmed_tag_deletion"();

-- RLS
ALTER TABLE "public"."send_account_tags" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "select_policy" ON "public"."send_account_tags"
    FOR SELECT
    USING (EXISTS (
        SELECT
            1
        FROM
            send_accounts sa
        WHERE
            sa.id = send_account_id AND sa.user_id = (select auth.uid())));

CREATE POLICY "delete_policy" ON "public"."send_account_tags"
    FOR DELETE
    USING (EXISTS (
        SELECT
            1
        FROM
            send_accounts sa
        WHERE
            sa.id = send_account_id AND sa.user_id = (select auth.uid())));

-- Grants
GRANT ALL ON TABLE "public"."send_account_tags" TO "anon";
GRANT ALL ON TABLE "public"."send_account_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."send_account_tags" TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_send_account_tags_deleted"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_send_account_tags_deleted"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_send_account_tags_deleted"() TO "service_role";

GRANT ALL ON FUNCTION "public"."handle_tag_deletion_verifications"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_tag_deletion_verifications"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_tag_deletion_verifications"() TO "service_role";

GRANT ALL ON FUNCTION "public"."prevent_last_confirmed_tag_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_last_confirmed_tag_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_last_confirmed_tag_deletion"() TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_account_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_tags_id_seq" TO "service_role";
