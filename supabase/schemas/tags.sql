-- Types
-- Note: tag_status and tag_search_result are defined in prod.sql and shared across tables

-- Functions
CREATE OR REPLACE FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "event_id" "text", "referral_code_input" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $_$
DECLARE
  tag_owner_ids uuid[];
  distinct_user_ids int;
  tag_owner_id uuid;
  referrer_id uuid;
  _event_id alias FOR $2;
BEGIN
  -- Check if the tags exist and fetch their owners.
  SELECT
    array_agg(user_id) INTO tag_owner_ids
  FROM
    public.tags
  WHERE
    name = ANY (tag_names)
    AND status = 'pending'::public.tag_status;
  -- If any of the tags do not exist or are not in pending status, throw an error.
  IF array_length(tag_owner_ids, 1) <> array_length(tag_names, 1) THEN
    RAISE EXCEPTION 'One or more tags do not exist or are not in pending status.';
  END IF;
  -- Check if all tags belong to the same user
  SELECT
    count(DISTINCT user_id) INTO distinct_user_ids
  FROM
    unnest(tag_owner_ids) AS user_id;
  IF distinct_user_ids <> 1 THEN
    RAISE EXCEPTION 'Tags must belong to the same user.';
  END IF;
  -- Fetch single user_id
  SELECT DISTINCT
    user_id INTO tag_owner_id
  FROM
    unnest(tag_owner_ids) AS user_id;
  IF event_id IS NULL OR event_id = '' THEN
    RAISE EXCEPTION 'Receipt event ID is required for paid tags.';
  END IF;
  -- Ensure event_id matches the sender
  IF (
    SELECT
      count(DISTINCT scr.sender)
    FROM
      public.sendtag_checkout_receipts scr
      JOIN send_accounts sa ON decode(substring(sa.address, 3), 'hex') = scr.sender
    WHERE
      scr.event_id = _event_id AND sa.user_id = tag_owner_id) <> 1 THEN
    RAISE EXCEPTION 'Receipt event ID does not match the sender';
  END IF;
  -- save receipt event_id
  INSERT INTO public.receipts(
    event_id,
    user_id)
  VALUES (
    _event_id,
    tag_owner_id);
  -- Associate the tags with the onchain event
  INSERT INTO public.tag_receipts(
    tag_name,
    event_id)
  SELECT
    unnest(tag_names),
    event_id;
  -- Confirm the tags
  UPDATE
    public.tags
  SET
    status = 'confirmed'::public.tag_status
  WHERE
    name = ANY (tag_names)
    AND status = 'pending'::public.tag_status;
  -- Create referral code redemption (only if it doesn't exist)
  IF referral_code_input IS NOT NULL AND referral_code_input <> '' THEN
    SELECT
      id INTO referrer_id
    FROM
      public.profiles
    WHERE
      referral_code = referral_code_input;
    IF referrer_id IS NOT NULL AND referrer_id <> tag_owner_id THEN
      -- Referrer cannot be the tag owner.
      -- Check if a referral already exists for this user
      IF NOT EXISTS (
        SELECT
          1
        FROM
          public.referrals
        WHERE
          referred_id = tag_owner_id) THEN
      -- Insert only one referral for the user
      INSERT INTO public.referrals(
        referrer_id,
        referred_id)
      SELECT
        referrer_id,
        tag_owner_id
      LIMIT 1;
    END IF;
  END IF;
END IF;
END;
$_$;

ALTER FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "event_id" "text", "referral_code_input" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."tags"("public"."profiles") RETURNS SETOF "public"."tags"
    LANGUAGE "sql" STABLE
    AS $_$
    SELECT * FROM tags WHERE user_id = $1.id
$_$;

ALTER FUNCTION "public"."tags"("public"."profiles") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."tags_after_insert_or_update_func"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ BEGIN -- Ensure that a user does not exceed the tag limit
    IF (
        SELECT COUNT(*)
        FROM public.tags
        WHERE user_id = NEW.user_id
            AND TG_OP = 'INSERT'
    ) > 5 THEN RAISE EXCEPTION 'User can have at most 5 tags';

END IF;

RETURN NEW;

END;

$$;

ALTER FUNCTION "public"."tags_after_insert_or_update_func"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."tags_before_insert_or_update_func"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    -- Ensure users can only insert or update their own tags
    if new.user_id <> auth.uid() then
        raise exception 'Users can only create or modify tags for themselves';

    end if;
    -- Ensure user is not changing their confirmed tag name
    if new.status = 'confirmed'::public.tag_status and old.name <> new.name and
	current_setting('role')::text = 'authenticated' then
        raise exception 'Users cannot change the name of a confirmed tag';

    end if;
    -- Ensure user is not confirming their own tag
    if new.status = 'confirmed'::public.tag_status and current_setting('role')::text =
	'authenticated' then
        raise exception 'Users cannot confirm their own tags';

    end if;
    -- Ensure no existing pending tag with same name within the last 30 minutes by another user
    if exists(
        select
            1
        from
            public.tags
        where
            name = new.name
            and status = 'pending'::public.tag_status
            and(NOW() - created_at) < INTERVAL '30 minutes'
            and user_id != new.user_id) then
    raise exception 'Tag with same name already exists';

end if;
    -- Delete older pending tags if they belong to the same user, to avoid duplicates
    delete from public.tags
    where name = new.name
        and user_id != new.user_id
        and status = 'pending'::public.tag_status;
    -- Return the new record to be inserted or updated
    return NEW;

end;

$$;

ALTER FUNCTION "public"."tags_before_insert_or_update_func"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) RETURNS TABLE("send_id_matches" "public"."tag_search_result"[], "tag_matches" "public"."tag_search_result"[], "phone_matches" "public"."tag_search_result"[])
    LANGUAGE "plpgsql" IMMUTABLE SECURITY DEFINER
    AS $_$
begin
    if limit_val is null or (limit_val <= 0 or limit_val > 100) then
        raise exception 'limit_val must be between 1 and 100';
    end if;
    if offset_val is null or offset_val < 0 then
        raise exception 'offset_val must be greater than or equal to 0';
    end if;
    return query --
        select ( select array_agg(row (sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
                 from ( select p.avatar_url, t.name as tag_name, p.send_id, null::text as phone
                        from profiles p
                                left join tags t on t.user_id = p.id and t.status = 'confirmed'
                        where query similar to '\d+'
                          and p.send_id::varchar like '%' || query || '%'
                        order by p.send_id
                        limit limit_val offset offset_val ) sub ) as send_id_matches,
               ( select array_agg(row (sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
                 from ( select p.avatar_url, t.name as tag_name, p.send_id, null::text as phone
                        from profiles p
                                join tags t on t.user_id = p.id
                        where t.status = 'confirmed'
                          and (t.name <<-> query < 0.7 or t.name ilike '%' || query || '%')
                        order by (t.name <-> query)
                        limit limit_val offset offset_val ) sub ) as tag_matches,
               ( select array_agg(row (sub.avatar_url, sub.tag_name, sub.send_id, sub.phone)::public.tag_search_result)
                 from ( select p.avatar_url, t.name as tag_name, p.send_id, u.phone
                        from profiles p
                                 left join tags t on t.user_id = p.id and t.status = 'confirmed'
                                 join auth.users u on u.id = p.id
                        where p.is_public
                          and query ~ '^\d{8,}$'
                          and u.phone like query || '%'
                        order by u.phone
                        limit limit_val offset offset_val ) sub ) as phone_matches;
end;
$_$;

ALTER FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_verification_tag_registration"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare curr_distribution_id bigint;

begin --
    -- check if tag is confirmed
if NEW.status <> 'confirmed'::public.tag_status then return NEW;

end if;

curr_distribution_id := (
    select id
    from distributions
    where qualification_start <= now()
        and qualification_end >= now()
    order by qualification_start desc
    limit 1
);

if curr_distribution_id is not null
and not exists (
    select 1
    from public.distribution_verifications
    where user_id = NEW.user_id
        and metadata->>'tag' = NEW.name
        and type = 'tag_registration'::public.verification_type
) then -- insert new verification
insert into public.distribution_verifications (distribution_id, user_id, type, metadata)
values (
    curr_distribution_id,
    NEW.user_id,
    'tag_registration'::public.verification_type,
    jsonb_build_object('tag', NEW.name)
);

end if;

return NEW;

end;

$$;

ALTER FUNCTION "public"."insert_verification_tag_registration"() OWNER TO "postgres";

-- Table
CREATE TABLE IF NOT EXISTS "public"."tags" (
    "name" "public"."citext" NOT NULL,
    "status" "public"."tag_status" DEFAULT 'pending'::"public"."tag_status" NOT NULL,
    "user_id" "uuid" DEFAULT "auth"."uid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "tags_name_check" CHECK (((("length"(("name")::"text") >= 1) AND ("length"(("name")::"text") <= 20)) AND ("name" OPERATOR("public".~) '^[A-Za-z0-9_]+$'::"public"."citext")))
);

ALTER TABLE "public"."tags" OWNER TO "postgres";

-- Primary Keys and Constraints
ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_pkey" PRIMARY KEY ("name");

-- Indexes
CREATE INDEX "idx_tags_status_created" ON "public"."tags" USING "btree" ("status", "created_at" DESC) WHERE ("status" = 'confirmed'::"public"."tag_status");
CREATE INDEX "tags_name_trigram_gin_idx" ON "public"."tags" USING "gin" ("name" "extensions"."gin_trgm_ops");
CREATE INDEX "tags_user_id_idx" ON "public"."tags" USING "btree" ("user_id");

-- Foreign Keys
ALTER TABLE ONLY "public"."tags"
    ADD CONSTRAINT "tags_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Triggers
CREATE OR REPLACE TRIGGER "insert_verification_tag_registration" AFTER INSERT OR UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_tag_registration"();

CREATE OR REPLACE TRIGGER "trigger_tags_after_insert_or_update" AFTER INSERT OR UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."tags_after_insert_or_update_func"();

CREATE OR REPLACE TRIGGER "trigger_tags_before_insert_or_update" BEFORE INSERT OR UPDATE ON "public"."tags" FOR EACH ROW EXECUTE FUNCTION "public"."tags_before_insert_or_update_func"();

-- RLS
ALTER TABLE "public"."tags" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "delete_policy" ON "public"."tags" FOR DELETE TO "authenticated" USING ((("auth"."uid"() = "user_id") AND ("status" = 'pending'::"public"."tag_status")));

CREATE POLICY "insert_policy" ON "public"."tags" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));

CREATE POLICY "select_policy" ON "public"."tags" FOR SELECT USING (("auth"."uid"() = "user_id"));

CREATE POLICY "update_policy" ON "public"."tags" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));

-- Grants
GRANT ALL ON TABLE "public"."tags" TO "anon";
GRANT ALL ON TABLE "public"."tags" TO "authenticated";
GRANT ALL ON TABLE "public"."tags" TO "service_role";

REVOKE ALL ON FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "event_id" "text", "referral_code_input" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."confirm_tags"("tag_names" "public"."citext"[], "event_id" "text", "referral_code_input" "text") TO "service_role";

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

REVOKE ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."tag_search"("query" "text", "limit_val" integer, "offset_val" integer) TO "service_role";

GRANT ALL ON FUNCTION "public"."insert_verification_tag_registration"() TO "anon";
GRANT ALL ON FUNCTION "public"."insert_verification_tag_registration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."insert_verification_tag_registration"() TO "service_role";