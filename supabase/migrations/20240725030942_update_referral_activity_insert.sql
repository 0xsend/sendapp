set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.generate_referral_event_id(referrer_id uuid, tags text[])
 RETURNS text
 LANGUAGE sql
 IMMUTABLE
AS $function$
select encode(sha256(referrer_id::text::bytea), 'hex') || '/' ||
       array_to_string(array(select distinct unnest(tags) order by 1), ',');
$function$
;

CREATE OR REPLACE FUNCTION public.referrals_delete_activity_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    delete
    from activity
    where event_name = 'referrals'
      and event_id in ( select generate_referral_event_id(OLD_TABLE.referrer_id, array_agg(distinct OLD_TABLE.tag))
                        from OLD_TABLE
                        group by OLD_TABLE.referrer_id );
    return null;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.referrals_insert_activity_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select 'referrals',
           generate_referral_event_id(NEW_TABLE.referrer_id, array_agg(distinct NEW_TABLE.tag)),
           NEW_TABLE.referrer_id,
           NEW_TABLE.referred_id,
           jsonb_build_object('tags', array_agg(distinct NEW_TABLE.tag order by NEW_TABLE.tag)),
           current_timestamp
    from NEW_TABLE
    group by NEW_TABLE.referrer_id, NEW_TABLE.referred_id;

    return null;
end;
$function$
;


