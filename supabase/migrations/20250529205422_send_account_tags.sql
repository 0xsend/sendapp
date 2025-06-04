create sequence "public"."send_account_tags_id_seq";

create sequence "public"."tags_id_seq";

drop policy "delete_policy" on "public"."tags";

drop policy "insert_policy" on "public"."tags";

drop policy "select_policy" on "public"."tags";

drop policy "update_policy" on "public"."tags";

alter table "public"."tag_receipts" drop constraint "tag_receipts_tag_name_fkey";

alter table "public"."tags" drop constraint "tags_pkey";

drop index if exists "public"."tags_pkey";

ALTER TYPE "public"."tag_status" ADD VALUE 'available' AFTER 'confirmed';

create table "public"."send_account_tags" (
    "id" integer not null default nextval('send_account_tags_id_seq'::regclass),
    "send_account_id" uuid not null,
    "tag_id" bigint not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."send_account_tags" enable row level security;

alter table "public"."send_accounts" add column "main_tag_id" bigint;

alter table "public"."tag_receipts" add column "tag_id" bigint not null;

alter table "public"."tags" add column "id" bigint not null default nextval('tags_id_seq'::regclass);

alter table "public"."tags" add column "updated_at" timestamp with time zone not null default now();

alter table "public"."tags" alter column "user_id" drop default;

alter table "public"."tags" alter column "user_id" drop not null;

alter sequence "public"."send_account_tags_id_seq" owned by "public"."send_account_tags"."id";

CREATE INDEX idx_send_account_tags_send_account_id ON public.send_account_tags USING btree (send_account_id);

CREATE INDEX idx_send_account_tags_tag_id ON public.send_account_tags USING btree (tag_id);

CREATE UNIQUE INDEX idx_send_account_tags_unique ON public.send_account_tags USING btree (send_account_id, tag_id);

CREATE INDEX idx_send_accounts_main_tag_id ON public.send_accounts USING btree (main_tag_id);

CREATE UNIQUE INDEX send_account_tags_pkey ON public.send_account_tags USING btree (id);

CREATE UNIQUE INDEX tags_name_unique ON public.tags USING btree (name);

CREATE UNIQUE INDEX tags_pkey ON public.tags USING btree (id);

alter table "public"."send_account_tags" add constraint "send_account_tags_pkey" PRIMARY KEY using index "send_account_tags_pkey";

alter table "public"."tags" add constraint "tags_pkey" PRIMARY KEY using index "tags_pkey";

alter table "public"."send_account_tags" add constraint "send_account_tags_send_account_id_fkey" FOREIGN KEY (send_account_id) REFERENCES send_accounts(id) ON DELETE CASCADE not valid;

alter table "public"."send_account_tags" validate constraint "send_account_tags_send_account_id_fkey";

alter table "public"."send_account_tags" add constraint "send_account_tags_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE not valid;

alter table "public"."send_account_tags" validate constraint "send_account_tags_tag_id_fkey";

alter table "public"."send_accounts" add constraint "send_accounts_main_tag_id_fkey" FOREIGN KEY (main_tag_id) REFERENCES tags(id) ON DELETE SET NULL not valid;

alter table "public"."send_accounts" validate constraint "send_accounts_main_tag_id_fkey";

alter table "public"."tag_receipts" add constraint "tag_receipts_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE not valid;

alter table "public"."tag_receipts" validate constraint "tag_receipts_tag_id_fkey";

alter table "public"."tags" add constraint "tags_name_unique" UNIQUE using index "tags_name_unique";

CREATE OR REPLACE FUNCTION public.handle_send_account_tags_deleted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_tag_confirmation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.validate_main_tag_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only prevent setting to NULL if there are other confirmed tags available
  IF NEW.main_tag_id IS NULL AND OLD.main_tag_id IS NOT NULL AND EXISTS(
    SELECT
      1
    FROM
      send_account_tags sat
      JOIN tags t ON t.id = sat.tag_id
    WHERE
      sat.send_account_id = NEW.id AND t.status = 'confirmed') THEN
    RAISE EXCEPTION 'Cannot set main_tag_id to NULL while you have confirmed tags';
  END IF;
  -- Verify the new main_tag_id is one of the user's confirmed tags
  IF NEW.main_tag_id IS NOT NULL AND NOT EXISTS(
    SELECT
      1
    FROM
      send_account_tags sat
      JOIN tags t ON t.id = sat.tag_id
    WHERE
      sat.send_account_id = NEW.id AND t.status = 'confirmed' AND t.id = NEW.main_tag_id) THEN
    RAISE EXCEPTION 'main_tag_id must be one of your confirmed tags';
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.tag_receipts_insert_activity_trigger()
 RETURNS trigger
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
$function$
;

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
$function$
;

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
$function$
;

grant delete on table "public"."send_account_tags" to "anon";

grant insert on table "public"."send_account_tags" to "anon";

grant references on table "public"."send_account_tags" to "anon";

grant select on table "public"."send_account_tags" to "anon";

grant trigger on table "public"."send_account_tags" to "anon";

grant truncate on table "public"."send_account_tags" to "anon";

grant update on table "public"."send_account_tags" to "anon";

grant delete on table "public"."send_account_tags" to "authenticated";

grant insert on table "public"."send_account_tags" to "authenticated";

grant references on table "public"."send_account_tags" to "authenticated";

grant select on table "public"."send_account_tags" to "authenticated";

grant trigger on table "public"."send_account_tags" to "authenticated";

grant truncate on table "public"."send_account_tags" to "authenticated";

grant update on table "public"."send_account_tags" to "authenticated";

grant delete on table "public"."send_account_tags" to "service_role";

grant insert on table "public"."send_account_tags" to "service_role";

grant references on table "public"."send_account_tags" to "service_role";

grant select on table "public"."send_account_tags" to "service_role";

grant trigger on table "public"."send_account_tags" to "service_role";

grant truncate on table "public"."send_account_tags" to "service_role";

grant update on table "public"."send_account_tags" to "service_role";

create policy "delete_policy"
on "public"."tags"
as permissive
for delete
to authenticated
using (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid)))))));

create policy "insert_policy"
on "public"."tags"
as permissive
for insert
to public
with check (((( SELECT auth.uid() AS uid) = user_id) AND (user_id IS NOT NULL)));

create policy "select_policy"
on "public"."tags"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid))))));

CREATE POLICY "update_policy" ON "public"."tags" FOR UPDATE TO "authenticated"
USING (
    status = 'pending'::public.tag_status
    AND EXISTS (
        SELECT 1
        FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id
        AND sa.user_id = (SELECT auth.uid())
    )
)
WITH CHECK (
    EXISTS ( -- Ensure tag is associated with a send account
        SELECT 1
        FROM send_account_tags sat
        JOIN send_accounts sa ON sa.id = sat.send_account_id
        WHERE sat.tag_id = tags.id
        AND sa.user_id = (SELECT auth.uid())
    )
);

create policy "delete_policy"
on "public"."send_account_tags"
as permissive
for delete
to public
using ((EXISTS ( SELECT 1
   FROM send_accounts sa
  WHERE ((sa.id = send_account_tags.send_account_id) AND (sa.user_id = auth.uid())))));


create policy "select_policy"
on "public"."send_account_tags"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM send_accounts sa
  WHERE ((sa.id = send_account_tags.send_account_id) AND (sa.user_id = auth.uid())))));

CREATE TRIGGER send_account_tags_deleted AFTER DELETE ON public.send_account_tags FOR EACH ROW EXECUTE FUNCTION handle_send_account_tags_deleted();

CREATE TRIGGER validate_main_tag_update BEFORE UPDATE OF main_tag_id ON public.send_accounts FOR EACH ROW EXECUTE FUNCTION validate_main_tag_update();

CREATE TRIGGER set_main_tag_on_confirmation AFTER UPDATE ON public.tags FOR EACH ROW WHEN ((new.status = 'confirmed'::tag_status)) EXECUTE FUNCTION handle_tag_confirmation();

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE FUNCTION set_current_timestamp_updated_at();

-- Migration: Add constraint to prevent deletion of last confirmed sendtag
-- Users must always maintain at least one confirmed sendtag once they have one

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

-- Grant permissions on the function
GRANT ALL ON FUNCTION "public"."prevent_last_confirmed_tag_deletion"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_last_confirmed_tag_deletion"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_last_confirmed_tag_deletion"() TO "service_role";

-- Create trigger to enforce the constraint
CREATE TRIGGER "prevent_last_confirmed_tag_deletion"
    BEFORE DELETE ON "public"."send_account_tags"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."prevent_last_confirmed_tag_deletion"();

drop function if exists "public"."confirm_tags"(tag_names citext[], event_id text, referral_code_input text);

drop function if exists "public"."confirm_tags"(tag_names citext[], send_account_id uuid, _event_id text, _referral_code text);

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
