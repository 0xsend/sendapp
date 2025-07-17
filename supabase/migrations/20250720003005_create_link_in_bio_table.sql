create type "public"."link_in_bio_domain_names" as enum ('X', 'Instagram', 'YouTube', 'TikTok', 'GitHub', 'Telegram', 'Discord');

create sequence "public"."link_in_bio_id_seq";

drop function if exists "public"."get_friends"();

drop view if exists "public"."referrer";

drop function if exists "public"."profile_lookup"(lookup_type lookup_type_enum, identifier text);

drop function if exists "public"."referrer_lookup"("referral_code" "text");

drop type "public"."profile_lookup_result";

create table "public"."link_in_bio" (
    "id" integer not null default nextval('link_in_bio_id_seq'::regclass),
    "user_id" uuid not null,
    "handle" text,
    "domain_name" link_in_bio_domain_names not null,
    "domain" text generated always as (
CASE
    WHEN (domain_name = 'X'::link_in_bio_domain_names) THEN 'x.com/'::text
    WHEN (domain_name = 'Instagram'::link_in_bio_domain_names) THEN 'instagram.com/'::text
    WHEN (domain_name = 'Discord'::link_in_bio_domain_names) THEN 'discord.gg/'::text
    WHEN (domain_name = 'YouTube'::link_in_bio_domain_names) THEN 'youtube.com/@'::text
    WHEN (domain_name = 'TikTok'::link_in_bio_domain_names) THEN 'tiktok.com/@'::text
    WHEN (domain_name = 'GitHub'::link_in_bio_domain_names) THEN 'github.com/'::text
    WHEN (domain_name = 'Telegram'::link_in_bio_domain_names) THEN 't.me/'::text
    ELSE NULL::text
END) stored,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
);


alter table "public"."link_in_bio" enable row level security;

alter sequence "public"."link_in_bio_id_seq" owned by "public"."link_in_bio"."id";

CREATE INDEX link_in_bio_domain_name_idx ON public.link_in_bio USING btree (domain_name);

CREATE UNIQUE INDEX link_in_bio_pkey ON public.link_in_bio USING btree (id);

CREATE UNIQUE INDEX link_in_bio_user_domain_unique ON public.link_in_bio USING btree (user_id, domain_name);

CREATE INDEX link_in_bio_user_id_domain_name_handle_idx ON public.link_in_bio USING btree (user_id, domain_name, handle);

CREATE INDEX link_in_bio_user_id_idx ON public.link_in_bio USING btree (user_id);

alter table "public"."link_in_bio" add constraint "link_in_bio_pkey" PRIMARY KEY using index "link_in_bio_pkey";

alter table "public"."link_in_bio" add constraint "link_in_bio_handle_format" CHECK (((handle IS NULL) OR ((handle ~ '^[a-zA-Z0-9_.-]+$'::text) AND ((length(handle) >= 1) AND (length(handle) <= 100))))) not valid;

alter table "public"."link_in_bio" validate constraint "link_in_bio_handle_format";

alter table "public"."link_in_bio" add constraint "link_in_bio_user_domain_unique" UNIQUE using index "link_in_bio_user_domain_unique";

alter table "public"."link_in_bio" add constraint "link_in_bio_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."link_in_bio" validate constraint "link_in_bio_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.links_in_bio(profiles)
 RETURNS SETOF link_in_bio
 LANGUAGE sql
 STABLE
AS $function$
    SELECT * FROM link_in_bio WHERE user_id = $1.id
$function$
;

CREATE OR REPLACE FUNCTION public.update_link_in_bio_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_friends()
 RETURNS TABLE(avatar_url text, send_id integer, x_username text, links_in_bio link_in_bio[], birthday date, tag citext, created_at timestamp with time zone)
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
                p.send_id,
                CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username,
                CASE WHEN p.is_public THEN
                    (SELECT array_agg((NULL::integer, NULL::uuid, sl.handle, sl.domain_name, sl.domain, sl.created_at, sl.updated_at)::link_in_bio)
                     FROM link_in_bio sl
                     WHERE sl.user_id = p.id AND sl.handle IS NOT NULL)
                ELSE NULL
                END AS links_in_bio,
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
                r.referrer_id = (SELECT auth.uid())
                AND t.status = 'confirmed'::tag_status
            ORDER BY
                r.referred_id,
                t.created_at DESC)
        SELECT
            o.avatar_url,
            o.send_id,
            o.x_username,
            o.links_in_bio,
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

create type "public"."profile_lookup_result" as ("id" uuid, "avatar_url" text, "name" text, "about" text, "refcode" text, "x_username" text, "birthday" date, "tag" citext, "address" citext, "chain_id" integer, "is_public" boolean, "sendid" integer, "all_tags" text[], "main_tag_id" bigint, "main_tag_name" text, "links_in_bio" link_in_bio[]);

CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS SETOF profile_lookup_result
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
AS $function$
begin
    if identifier is null or identifier = '' then raise exception 'identifier cannot be null or empty'; end if;
    if lookup_type is null then raise exception 'lookup_type cannot be null'; end if;

    RETURN QUERY
    SELECT
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
        mt.name::text,
        CASE WHEN p.is_public THEN
            (SELECT array_agg((NULL::integer, NULL::uuid, sl2.handle, sl2.domain_name, sl2.domain, sl2.created_at, sl2.updated_at)::link_in_bio)
            FROM link_in_bio sl2
            WHERE sl2.user_id = p.id AND sl2.handle IS NOT NULL)
        ELSE NULL
        END
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
$function$;

create or replace view "public"."referrer" as  WITH referrer AS (
         SELECT p.send_id
           FROM (referrals r
             JOIN profiles p ON ((r.referrer_id = p.id)))
          WHERE (r.referred_id = ( SELECT auth.uid() AS uid))
          ORDER BY r.created_at
         LIMIT 1
        ), profile_lookup AS (
         SELECT p.id,
            p.avatar_url,
            p.name,
            p.about,
            p.refcode,
            p.x_username,
            p.birthday,
            p.tag,
            p.address,
            p.chain_id,
            p.is_public,
            p.sendid,
            p.all_tags,
            p.main_tag_id,
            p.main_tag_name,
            p.links_in_bio,
            referrer.send_id
           FROM (profile_lookup('sendid'::lookup_type_enum, ( SELECT (referrer_1.send_id)::text AS send_id
                   FROM referrer referrer_1)) p(id, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name, links_in_bio)
             JOIN referrer ON ((referrer.send_id IS NOT NULL)))
        )
 SELECT profile_lookup.id,
    profile_lookup.avatar_url,
    profile_lookup.name,
    profile_lookup.about,
    profile_lookup.refcode,
    profile_lookup.x_username,
    profile_lookup.birthday,
    profile_lookup.tag,
    profile_lookup.address,
    profile_lookup.chain_id,
    profile_lookup.is_public,
    profile_lookup.sendid,
    profile_lookup.all_tags,
    profile_lookup.main_tag_id,
    profile_lookup.main_tag_name,
    profile_lookup.links_in_bio,
    profile_lookup.send_id
   FROM profile_lookup;


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

grant delete on table "public"."link_in_bio" to "anon";

grant insert on table "public"."link_in_bio" to "anon";

grant references on table "public"."link_in_bio" to "anon";

grant select on table "public"."link_in_bio" to "anon";

grant trigger on table "public"."link_in_bio" to "anon";

grant truncate on table "public"."link_in_bio" to "anon";

grant update on table "public"."link_in_bio" to "anon";

grant delete on table "public"."link_in_bio" to "authenticated";

grant insert on table "public"."link_in_bio" to "authenticated";

grant references on table "public"."link_in_bio" to "authenticated";

grant select on table "public"."link_in_bio" to "authenticated";

grant trigger on table "public"."link_in_bio" to "authenticated";

grant truncate on table "public"."link_in_bio" to "authenticated";

grant update on table "public"."link_in_bio" to "authenticated";

grant delete on table "public"."link_in_bio" to "service_role";

grant insert on table "public"."link_in_bio" to "service_role";

grant references on table "public"."link_in_bio" to "service_role";

grant select on table "public"."link_in_bio" to "service_role";

grant trigger on table "public"."link_in_bio" to "service_role";

grant truncate on table "public"."link_in_bio" to "service_role";

grant update on table "public"."link_in_bio" to "service_role";

create policy "Link in bios are viewable by users who created them."
on "public"."link_in_bio"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can delete own link in bios."
on "public"."link_in_bio"
as permissive
for delete
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can insert their own link in bios."
on "public"."link_in_bio"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "Users can update own link in bios."
on "public"."link_in_bio"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = user_id));


CREATE TRIGGER update_link_in_bio_updated_at_trigger BEFORE UPDATE ON public.link_in_bio FOR EACH ROW EXECUTE FUNCTION update_link_in_bio_updated_at();

INSERT INTO link_in_bio (user_id, domain_name, handle)
SELECT
    p.id as user_id,
    'X'::link_in_bio_domain_names as domain_name,
    TRIM(p.x_username) as handle
FROM profiles p
WHERE p.x_username IS NOT NULL
  AND p.x_username != ''
  AND LENGTH(TRIM(p.x_username)) > 0
  -- Only insert if the trimmed username matches the handle format constraint
  AND TRIM(p.x_username) ~ '^[a-zA-Z0-9_.-]+$'
  AND LENGTH(TRIM(p.x_username)) BETWEEN 1 AND 100
  AND NOT EXISTS (
    -- Avoid duplicates: only insert if there's no existing X entry for this user
    SELECT 1
    FROM link_in_bio lib
    WHERE lib.user_id = p.id
      AND lib.domain_name = 'X'
  );