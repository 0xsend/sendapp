-- Step 1: Drop the generated column that depends on domain_name
ALTER TABLE "public"."link_in_bio" DROP COLUMN IF EXISTS "domain";

-- Step 2: Disable the updated_at trigger to prevent unwanted timestamp updates during schema changes
ALTER TABLE "public"."link_in_bio" DISABLE TRIGGER "update_link_in_bio_updated_at_trigger";

-- Step 3: Change domain_name column to text to remove enum dependency
ALTER TABLE "public"."link_in_bio" ALTER COLUMN "domain_name" TYPE text;

-- Step 4: Drop the old enum type
DROP TYPE "public"."link_in_bio_domain_names";

-- Step 5: Create new enum type with additional values
CREATE TYPE "public"."link_in_bio_domain_names" AS ENUM (
    'X',
    'Instagram',
    'YouTube',
    'TikTok',
    'GitHub',
    'Telegram',
    'Discord',
    'Facebook',
    'OnlyFans',
    'WhatsApp',
    'Snapchat',
    'Twitch'
);

-- Step 6: Change domain_name column back to use the new enum
ALTER TABLE "public"."link_in_bio" ALTER COLUMN "domain_name" TYPE "public"."link_in_bio_domain_names" USING "domain_name"::"public"."link_in_bio_domain_names";

-- Step 7: Recreate the generated column with all platforms (including new ones)
ALTER TABLE "public"."link_in_bio"
ADD COLUMN "domain" "text" GENERATED ALWAYS AS(
    CASE
        WHEN "domain_name" = 'X' THEN 'x.com/'
        WHEN "domain_name" = 'Instagram' THEN 'instagram.com/'
        WHEN "domain_name" = 'Discord' THEN 'discord.gg/'
        WHEN "domain_name" = 'YouTube' THEN 'youtube.com/@'
        WHEN "domain_name" = 'TikTok' THEN 'tiktok.com/@'
        WHEN "domain_name" = 'GitHub' THEN 'github.com/'
        WHEN "domain_name" = 'Telegram' THEN 't.me/'
        WHEN "domain_name" = 'Facebook' THEN 'facebook.com/'
        WHEN "domain_name" = 'OnlyFans' THEN 'onlyfans.com/'
        WHEN "domain_name" = 'WhatsApp' THEN 'wa.me/'
        WHEN "domain_name" = 'Snapchat' THEN 'snapchat.com/@'
        WHEN "domain_name" = 'Twitch' THEN 'twitch.tv/'
        ELSE NULL
    END
) STORED;

-- Step 8: Re-enable the updated_at trigger
ALTER TABLE "public"."link_in_bio" ENABLE TRIGGER "update_link_in_bio_updated_at_trigger";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_friends()
 RETURNS TABLE(avatar_url text, send_id int, x_username text, links_in_bio link_in_bio[], birthday date, tag citext, created_at timestamp with time zone)
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
(SELECT array_agg(link_in_bio_row)
                    FROM (
                        SELECT ROW(
                            id,
                            user_id,
                            handle,
                            domain_name,
                            created_at,
                            updated_at,
                            domain
                        )::link_in_bio as link_in_bio_row
                        FROM link_in_bio
                        WHERE user_id = p.id AND handle IS NOT NULL
                    ) sub)
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
(SELECT array_agg(link_in_bio_row)
            FROM (
                SELECT ROW(
                    id,
                    user_id,
                    handle,
                    domain_name,
                    created_at,
                    updated_at,
                    domain
                )::link_in_bio as link_in_bio_row
                FROM link_in_bio
                WHERE user_id = p.id AND handle IS NOT NULL
            ) sub)
        ELSE NULL
        END,
        p.banner_url::text
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


