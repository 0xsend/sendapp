-- Functions
CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS TABLE(id uuid, avatar_url text, name text, about text, refcode text, x_username text, birthday date, tag citext, address citext, chain_id integer, is_public boolean, sendid integer, all_tags text[])
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
begin
    if identifier is null or identifier = '' then raise exception 'identifier cannot be null or empty'; end if;
    if lookup_type is null then raise exception 'lookup_type cannot be null'; end if;
return query --
select case when p.id = ( select auth.uid() ) then p.id end              as id,
       p.avatar_url::text                                                as avatar_url,
        p.name::text                                                      as name,
        p.about::text                                                     as about,
        p.referral_code                                                   as refcode,
       CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
       CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
       t.name                                                            as tag,
       sa.address                                                        as address,
       sa.chain_id                                                       as chain_id,
       case when current_setting('role')::text = 'service_role' then p.is_public
            when p.is_public then true
            else false end                                               as is_public,
       p.send_id                                                         as sendid,
       ( select array_agg(t.name::text)
         from tags t
         where t.user_id = p.id and t.status = 'confirmed'::tag_status ) as all_tags
from profiles p
    join auth.users a on a.id = p.id
    left join tags t on t.user_id = p.id and t.status = 'confirmed'::tag_status
    left join send_accounts sa on sa.user_id = p.id
where ((lookup_type = 'sendid' and p.send_id::text = identifier) or
    (lookup_type = 'tag' and t.name = identifier::citext) or
    (lookup_type = 'refcode' and p.referral_code = identifier) or
    (lookup_type = 'address' and sa.address = identifier) or
    (p.is_public and lookup_type = 'phone' and a.phone::text = identifier))
  and (p.is_public
   or ( select auth.uid() ) is not null
   or current_setting('role')::text = 'service_role')
    limit 1;
end;
$function$
;

ALTER FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "tags" "text"[]) RETURNS "text"
    LANGUAGE "sql" IMMUTABLE
    AS $$
select encode(sha256(referrer_id::text::bytea), 'hex') || '/' ||
       array_to_string(array(select distinct unnest(tags) order by 1), ',');
$$;

ALTER FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "tags" "text"[]) OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "referred_id" "uuid") RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN sha256(decode(replace(referrer_id::text, '-', '') || replace(referred_id::text, '-', ''), 'hex'))::text;
END;
$$;

ALTER FUNCTION "private"."generate_referral_event_id"("referrer_id" "uuid", "referred_id" "uuid") OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "private"."update_leaderboard_referrals_all_time_referrals"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    _referrer_id uuid;
begin
    -- update the referral count for the user
    insert into private.leaderboard_referrals_all_time (user_id, referrals, updated_at)
    values (NEW.referrer_id, 1, now())
    on conflict (user_id) do update set referrals = private.leaderboard_referrals_all_time.referrals + 1,
                                        updated_at = now();
    return NEW;
end
$$;

ALTER FUNCTION "private"."update_leaderboard_referrals_all_time_referrals"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "private"."update_leaderboard_referrals_all_time_sendtag_checkout_receipts"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
    _referrer_id uuid;
begin
    select user_id into _referrer_id from public.send_accounts sa where decode(substring(sa.address, 3), 'hex') = NEW.referrer;
    if _referrer_id is not null then
        -- update the rewards_usdc for the user
        insert into private.leaderboard_referrals_all_time (user_id, rewards_usdc, updated_at)
        values (_referrer_id, NEW.reward, now())
        on conflict (user_id) do update set rewards_usdc = private.leaderboard_referrals_all_time.rewards_usdc + NEW.reward,
                                            updated_at   = now();
    end if;
    return NEW;
end;
$$;

ALTER FUNCTION "private"."update_leaderboard_referrals_all_time_sendtag_checkout_receipts"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."get_affiliate_referrals"() RETURNS TABLE("send_plus_minus" numeric, "avatar_url" "text", "tag" "public"."citext", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
    RETURN QUERY
        WITH ordered_referrals AS(
            SELECT
                COALESCE(a.send_plus_minus, 0)::numeric AS send_plus_minus,
                p.avatar_url,
                t.name AS tag,
                t.created_at,
                COALESCE((
                             SELECT
                                 SUM(amount)
                             FROM distribution_shares ds
                             WHERE
                                 ds.user_id = r.referred_id
                               AND distribution_id >= 6), 0) AS send_score
            FROM
                referrals r
                    LEFT JOIN affiliate_stats a ON a.user_id = r.referred_id
                    LEFT JOIN profiles p ON p.id = r.referred_id
                    LEFT JOIN tags t ON t.user_id = r.referred_id
            WHERE
                r.referrer_id = auth.uid())
        SELECT
            o.send_plus_minus,
            o.avatar_url,
            o.tag,
            o.created_at
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$$;

ALTER FUNCTION "public"."get_affiliate_referrals"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."insert_verification_referral"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  curr_distribution_id bigint;
BEGIN
  -- Get the current distribution id
  SELECT
    id INTO curr_distribution_id
  FROM
    distributions
  WHERE
    qualification_start <= now()
    AND qualification_end >= now()
  ORDER BY
    qualification_start DESC
  LIMIT 1;

  -- Return early if current distribution doesn't exist
  IF curr_distribution_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert verification for referrer
  INSERT INTO public.distribution_verifications(
    distribution_id,
    user_id,
    type,
    metadata,
    weight
  )
  VALUES (
    curr_distribution_id,
    NEW.referrer_id,
    'tag_referral'::public.verification_type,
    jsonb_build_object(
      'referred_id', NEW.referred_id
    ),
    0
  );
  RETURN NEW;
END;
$$;

ALTER FUNCTION "public"."insert_verification_referral"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."leaderboard_referrals_all_time"() RETURNS TABLE("rewards_usdc" numeric, "referrals" integer, "user" "public"."activity_feed_user")
    LANGUAGE "plpgsql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
    return query select l.rewards_usdc,
                        l.referrals,
                        (case when l.user_id = ( select auth.uid() ) then ( select auth.uid() ) end, -- user_id
                         p.name, -- name
                         p.avatar_url, -- avatar_url
                         p.send_id, -- send_id
                         ( select array_agg(name) from tags where user_id = p.id and status = 'confirmed' ) -- tags
                            )::activity_feed_user                      as "user"
                 from private.leaderboard_referrals_all_time l
                          join profiles p on p.id = user_id
                 where p.is_public = true;
end
$$;

ALTER FUNCTION "public"."leaderboard_referrals_all_time"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."referrals_delete_activity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  delete
    from activity
    where exists (
      select 1
        from OLD_TABLE
        where activity.from_user_id = OLD_TABLE.referrer_id
          and activity.to_user_id = OLD_TABLE.referred_id
          and activity.event_name = 'referrals'
      );
  RETURN NULL;
END;
$$;

ALTER FUNCTION "public"."referrals_delete_activity_trigger"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."referrals_insert_activity_trigger"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select 'referrals',
           private.generate_referral_event_id(NEW_TABLE.referrer_id, NEW_TABLE.referred_id),
           NEW_TABLE.referrer_id,
           NEW_TABLE.referred_id,
           jsonb_build_object('tags', (
             select array_agg(name)
             from tags
             where user_id = NEW_TABLE.referred_id
               and status = 'confirmed'
           )),
           current_timestamp
    from NEW_TABLE
    group by NEW_TABLE.referrer_id, NEW_TABLE.referred_id;
  RETURN NULL;
END;
$$;

ALTER FUNCTION "public"."referrals_insert_activity_trigger"() OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."user_referrals_count"() RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
return (select count(*) from referrals
where referrer_id=auth.uid());
end;$$;

ALTER FUNCTION "public"."user_referrals_count"() OWNER TO "postgres";

-- Sequences
CREATE SEQUENCE IF NOT EXISTS "public"."referrals_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER TABLE "public"."referrals_id_seq" OWNER TO "postgres";

-- Tables
CREATE TABLE IF NOT EXISTS "private"."leaderboard_referrals_all_time" (
    "user_id" "uuid" NOT NULL,
    "referrals" integer DEFAULT 0,
    "rewards_usdc" numeric DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"()
);

ALTER TABLE "private"."leaderboard_referrals_all_time" OWNER TO "postgres";

CREATE TABLE IF NOT EXISTS "public"."referrals" (
    "referrer_id" "uuid" NOT NULL,
    "referred_id" "uuid" NOT NULL,
    "id" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "referrals_different_referrer_and_referred" CHECK (("referrer_id" <> "referred_id"))
);

ALTER TABLE "public"."referrals" OWNER TO "postgres";

-- Sequence ownership and defaults
ALTER SEQUENCE "public"."referrals_id_seq" OWNED BY "public"."referrals"."id";
ALTER TABLE ONLY "public"."referrals" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."referrals_id_seq"'::"regclass");

-- Primary Keys and Constraints
ALTER TABLE ONLY "private"."leaderboard_referrals_all_time"
    ADD CONSTRAINT "leaderboard_referrals_all_time_pkey" PRIMARY KEY ("user_id");

ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_pkey" PRIMARY KEY ("id");

ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "unique_referred_id" UNIQUE ("referred_id");

-- Indexes
CREATE INDEX "leaderboard_referrals_all_time_referral_count_idx" ON "private"."leaderboard_referrals_all_time" USING "btree" ("referrals" DESC);
CREATE INDEX "leaderboard_referrals_all_time_total_reward_idx" ON "private"."leaderboard_referrals_all_time" USING "btree" ("rewards_usdc" DESC);

-- Foreign Keys
ALTER TABLE ONLY "private"."leaderboard_referrals_all_time"
    ADD CONSTRAINT "leaderboard_referrals_all_time_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referred_id_fkey" FOREIGN KEY ("referred_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."referrals"
    ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;

-- Triggers
CREATE OR REPLACE TRIGGER "insert_verification_referral" AFTER INSERT ON "public"."referrals" FOR EACH ROW EXECUTE FUNCTION "public"."insert_verification_referral"();

CREATE OR REPLACE TRIGGER "referrals_delete_activity_trigger" AFTER DELETE ON "public"."referrals" REFERENCING OLD TABLE AS "old_table" FOR EACH STATEMENT EXECUTE FUNCTION "public"."referrals_delete_activity_trigger"();

CREATE OR REPLACE TRIGGER "referrals_insert_activity_trigger" AFTER INSERT ON "public"."referrals" REFERENCING NEW TABLE AS "new_table" FOR EACH STATEMENT EXECUTE FUNCTION "public"."referrals_insert_activity_trigger"();

CREATE OR REPLACE TRIGGER "update_leaderboard_referrals_all_time_referrals" AFTER INSERT ON "public"."referrals" FOR EACH ROW EXECUTE FUNCTION "private"."update_leaderboard_referrals_all_time_referrals"();

-- RLS
ALTER TABLE "public"."referrals" ENABLE ROW LEVEL SECURITY;

-- Grants
REVOKE ALL ON FUNCTION "private"."update_leaderboard_referrals_all_time_referrals"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "private"."update_leaderboard_referrals_all_time_sendtag_checkout_receipts"() FROM PUBLIC;

REVOKE ALL ON FUNCTION "public"."get_affiliate_referrals"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_affiliate_referrals"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_affiliate_referrals"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_affiliate_referrals"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."leaderboard_referrals_all_time"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."referrals_delete_activity_trigger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."referrals_delete_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."referrals_delete_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."referrals_delete_activity_trigger"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."referrals_insert_activity_trigger"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."referrals_insert_activity_trigger"() TO "anon";
GRANT ALL ON FUNCTION "public"."referrals_insert_activity_trigger"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."referrals_insert_activity_trigger"() TO "service_role";

REVOKE ALL ON FUNCTION "public"."user_referrals_count"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."user_referrals_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_referrals_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_referrals_count"() TO "service_role";

GRANT ALL ON TABLE "public"."referrals" TO "anon";
GRANT ALL ON TABLE "public"."referrals" TO "authenticated";
GRANT ALL ON TABLE "public"."referrals" TO "service_role";

GRANT ALL ON SEQUENCE "public"."referrals_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."referrals_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."referrals_id_seq" TO "service_role";

REVOKE ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."profile_lookup"("lookup_type" "public"."lookup_type_enum", "identifier" "text") TO "service_role";

-- Functions

CREATE OR REPLACE FUNCTION public.get_friends()
 RETURNS TABLE(avatar_url text, x_username text, birthday date, tag citext, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    RETURN QUERY
        WITH ordered_referrals AS(
            SELECT
                DISTINCT ON (r.referred_id)
                p.avatar_url,
                CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
                CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday,
                t.name AS tag,
                t.created_at,
                COALESCE((
                             SELECT
                                 SUM(amount)
                             FROM distribution_shares ds
                             WHERE
                                 ds.user_id = r.referred_id
                               AND distribution_id >= 6), 0) AS send_score
            FROM
                referrals r
                    LEFT JOIN affiliate_stats a ON a.user_id = r.referred_id
                    LEFT JOIN profiles p ON p.id = r.referred_id
                    LEFT JOIN tags t ON t.user_id = r.referred_id
            WHERE
                r.referrer_id = auth.uid()
            ORDER BY
                r.referred_id,
                t.created_at DESC)
        SELECT
            o.avatar_url,
            o.x_username,
            o.birthday,
            o.tag,
            o.created_at
        FROM
            ordered_referrals o
        ORDER BY
            send_score DESC;
END;
$function$
;

ALTER FUNCTION "public"."get_friends"() OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."get_friends"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."get_friends"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_friends"() TO "service_role";

-- Views
CREATE OR REPLACE VIEW "public"."referrer" WITH ("security_barrier"='on') AS
 WITH "referrer" AS (
         SELECT "p"."send_id"
           FROM ("public"."referrals" "r"
             JOIN "public"."profiles" "p" ON (("r"."referrer_id" = "p"."id")))
          WHERE ("r"."referred_id" = ( SELECT "auth"."uid"() AS "uid"))
          ORDER BY "r"."created_at"
         LIMIT 1
        ), "profile_lookup" AS (
         SELECT "p"."id",
            "p"."avatar_url",
            "p"."name",
            "p"."about",
            "p"."refcode",
            "p"."x_username",
            "p"."birthday",
            "p"."tag",
            "p"."address",
            "p"."chain_id",
            "p"."is_public",
            "p"."sendid",
            "p"."all_tags",
            "referrer"."send_id"
           FROM ("public"."profile_lookup"('sendid'::"public"."lookup_type_enum", ( SELECT ("referrer_1"."send_id")::"text" AS "send_id"
                   FROM "referrer" "referrer_1")) "p"("id", "avatar_url", "name", "about", "refcode", "x_username", "birthday", "tag", "address", "chain_id", "is_public", "sendid", "all_tags")
             JOIN "referrer" ON (("referrer"."send_id" IS NOT NULL)))
        )
 SELECT "profile_lookup"."id",
    "profile_lookup"."avatar_url",
    "profile_lookup"."name",
    "profile_lookup"."about",
    "profile_lookup"."refcode",
    "profile_lookup"."x_username",
    "profile_lookup"."birthday",
    "profile_lookup"."tag",
    "profile_lookup"."address",
    "profile_lookup"."chain_id",
    "profile_lookup"."is_public",
    "profile_lookup"."sendid",
    "profile_lookup"."all_tags",
    "profile_lookup"."send_id"
   FROM "profile_lookup";

ALTER TABLE "public"."referrer" OWNER TO "postgres";

CREATE OR REPLACE FUNCTION "public"."referrer_lookup"("referral_code" "text" DEFAULT NULL::"text") RETURNS TABLE("referrer" "public"."profile_lookup_result", "new_referrer" "public"."profile_lookup_result")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
ref_result profile_lookup_result;
    new_ref_result profile_lookup_result;
    referrer_send_id text;
BEGIN
    -- Find the current user's referrer's send_id (if exists)
SELECT send_id INTO referrer_send_id
FROM referrals r
         JOIN profiles p ON r.referrer_id = p.id
WHERE r.referred_id = auth.uid()
    LIMIT 1;

IF referrer_send_id IS NOT NULL AND referrer_send_id != '' THEN
SELECT * INTO ref_result
FROM profile_lookup('sendid'::lookup_type_enum, referrer_send_id)
         LIMIT 1;
END IF;

    -- Look up new referrer if:
    -- 1. referral_code is valid AND
    -- 2. No existing referrer found
    IF referral_code IS NOT NULL AND referral_code != '' AND referrer_send_id IS NULL THEN
        -- Try tag lookup first, then refcode if needed
SELECT * INTO new_ref_result
FROM profile_lookup('tag'::lookup_type_enum, referral_code)
         LIMIT 1;

IF new_ref_result IS NULL THEN
SELECT * INTO new_ref_result
FROM profile_lookup('refcode'::lookup_type_enum, referral_code)
         LIMIT 1;
END IF;
END IF;

RETURN QUERY
SELECT ref_result, new_ref_result;
END;
$$;
ALTER FUNCTION "public"."referrer_lookup"("referral_code" "text") OWNER TO "postgres";
REVOKE ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."referrer_lookup"("referral_code" "text") TO "service_role";
