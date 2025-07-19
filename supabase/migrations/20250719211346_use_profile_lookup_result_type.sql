drop view if exists "public"."referrer";

drop function if exists "public"."referrer_lookup"(referral_code text);
drop function if exists "public"."profile_lookup"(lookup_type lookup_type_enum, identifier text);

drop type "public"."profile_lookup_result";

create type "public"."profile_lookup_result" as ("id" uuid, "avatar_url" text, "name" text, "about" text, "refcode" text, "x_username" text, "birthday" date, "tag" citext, "address" citext, "chain_id" integer, "is_public" boolean, "sendid" integer, "all_tags" text[], "main_tag_id" integer, "main_tag_name" text);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS SETOF profile_lookup_result
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
begin
    if identifier is null or identifier = '' then raise exception 'identifier cannot be null or empty'; end if;
    if lookup_type is null then raise exception 'lookup_type cannot be null'; end if;

    RETURN QUERY
    SELECT ROW(
        case when p.id = ( select auth.uid() ) then p.id end,
        p.avatar_url::text,
        p.name::text,
        p.about::text,
        p.referral_code,
        CASE WHEN p.is_public THEN p.x_username ELSE NULL END,
        CASE WHEN p.is_public THEN p.birthday ELSE NULL END,
        COALESCE(mt.name, t.name),
        sa.address,
        sa.chain_id,
        case when current_setting('role')::text = 'service_role' then p.is_public
            when p.is_public then true
            else false end,
        p.send_id,
        ( select array_agg(t2.name::text)
          from tags t2
          join send_account_tags sat2 on sat2.tag_id = t2.id
          join send_accounts sa2 on sa2.id = sat2.send_account_id
          where sa2.user_id = p.id and t2.status = 'confirmed'::tag_status ),
        case when p.id = ( select auth.uid() ) then sa.main_tag_id end,
        mt.name::text
    )::profile_lookup_result
    from profiles p
    join auth.users a on a.id = p.id
    left join send_accounts sa on sa.user_id = p.id
    left join tags mt on mt.id = sa.main_tag_id
    left join send_account_tags sat on sat.send_account_id = sa.id
    left join tags t on t.id = sat.tag_id and t.status = 'confirmed'::tag_status
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

-- Update the referrer view to work with SETOF profile_lookup function
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
            "p"."main_tag_id",
            "p"."main_tag_name",
            "referrer"."send_id"
           FROM ("public"."profile_lookup"('sendid'::"public"."lookup_type_enum", ( SELECT ("referrer_1"."send_id")::"text" AS "send_id"
                   FROM "referrer" "referrer_1")) "p"("id", "avatar_url", "name", "about", "refcode", "x_username", "birthday", "tag", "address", "chain_id", "is_public", "sendid", "all_tags", "main_tag_id", "main_tag_name")
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
    "profile_lookup"."main_tag_id", "profile_lookup"."main_tag_name",
    "profile_lookup"."send_id"
   FROM "profile_lookup";

CREATE OR REPLACE FUNCTION public.referrer_lookup(referral_code text DEFAULT NULL::text)
 RETURNS TABLE(referrer profile_lookup_result, new_referrer profile_lookup_result)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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

    -- Look up existing referrer if valid send_id exists
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
$function$
;


