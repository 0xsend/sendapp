drop view if exists "public"."referrer";

drop function if exists "public"."profile_lookup"(lookup_type lookup_type_enum, identifier text);

set check_function_bodies = off;

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
    -- Create receipt
    INSERT INTO receipts(event_id, user_id)
        VALUES (_event_id, _user_id);
    -- First create send_account_tags entries
    INSERT INTO send_account_tags(send_account_id, tag_id)
    SELECT DISTINCT
        _send_account_id,
        t.id
    FROM
        tags t
    WHERE
        t.name = ANY (tag_names)
        AND t.status = 'pending'
        AND NOT EXISTS (
            SELECT
                1
            FROM
                send_account_tags sat
            WHERE
                sat.send_account_id = _send_account_id
                AND sat.tag_id = t.id);
    -- Then update tags status which will trigger the verification
    UPDATE
        tags
    SET
        status = 'confirmed'
    WHERE
        name = ANY (tag_names)
        AND status = 'pending';
    -- Associate tags with event
    INSERT INTO tag_receipts(tag_name, tag_id, event_id)
    SELECT
        t.name,
        t.id,
        _event_id
    FROM
        tags t
    WHERE
        t.name = ANY (tag_names)
        AND t.status = 'confirmed';
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

CREATE OR REPLACE FUNCTION public.profile_lookup(lookup_type lookup_type_enum, identifier text)
 RETURNS TABLE(id uuid, avatar_url text, name text, about text, refcode text, x_username text, birthday date, tag citext, address citext, chain_id integer, is_public boolean, sendid integer, all_tags text[], main_tag_id bigint, main_tag_name text)
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
       CASE WHEN p.is_public THEN p.x_username ELSE NULL END AS x_username, -- changed to be null if profile is private
       CASE WHEN p.is_public THEN p.birthday ELSE NULL END AS birthday, -- added birthday to return type, returns null if profile is private
       COALESCE(mt.name, t.name)                                         as tag,
       sa.address                                                        as address,
       sa.chain_id                                                       as chain_id,
       case when current_setting('role')::text = 'service_role' then p.is_public
            when p.is_public then true
            else false end                                               as is_public,
       p.send_id                                                         as sendid,
       ( select array_agg(t2.name::text)
         from tags t2
         join send_account_tags sat2 on sat2.tag_id = t2.id
         join send_accounts sa2 on sa2.id = sat2.send_account_id
         where sa2.user_id = p.id and t2.status = 'confirmed'::tag_status ) as all_tags,
       sa.main_tag_id                                                    as main_tag_id,
       mt.name::text                                                     as main_tag_name
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
    (p.is_public and lookup_type = 'phone' and a.phone::text = identifier)) -- lookup by phone number when profile is public
  and (p.is_public -- allow public profiles to be returned
   or ( select auth.uid() ) is not null -- allow profiles to be returned if the user is authenticated
   or current_setting('role')::text = 'service_role') -- allow public profiles to be returned to service role
    limit 1;
end;
$function$
;

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
            referrer.send_id
           FROM (profile_lookup('sendid'::lookup_type_enum, ( SELECT (referrer_1.send_id)::text AS send_id
                   FROM referrer referrer_1)) p(id, avatar_url, name, about, refcode, x_username, birthday, tag, address, chain_id, is_public, sendid, all_tags, main_tag_id, main_tag_name)
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
    profile_lookup.send_id
   FROM profile_lookup;



