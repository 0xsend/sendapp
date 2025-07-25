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

-- Create function to prevent deletion of last confirmed tag
CREATE OR REPLACE FUNCTION public.prevent_last_confirmed_tag_deletion()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
    -- Check if this deletion would leave the user with zero confirmed tags
    -- Only prevent deletion if the tag being deleted is confirmed AND it's the last one
    IF current_setting('role')::text = 'authenticated' AND
        (SELECT status FROM tags WHERE id = OLD.tag_id) = 'confirmed' THEN
        -- Count remaining confirmed tags after this deletion
        IF (SELECT COUNT(*)
            FROM send_account_tags sat
            JOIN tags t ON t.id = sat.tag_id
            WHERE sat.send_account_id = OLD.send_account_id
            AND t.status = 'confirmed'
            AND sat.tag_id != OLD.tag_id) = 0 THEN
            RAISE EXCEPTION 'Cannot delete your last confirmed sendtag. Users must maintain at least one confirmed sendtag.';
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

GRANT ALL ON FUNCTION "public"."prevent_last_confirmed_tag_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_last_confirmed_tag_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_last_confirmed_tag_deletion"() TO "service_role";

GRANT ALL ON SEQUENCE "public"."send_account_tags_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."send_account_tags_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."send_account_tags_id_seq" TO "service_role";
