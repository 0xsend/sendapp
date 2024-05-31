create or replace function referrals_insert_activity_trigger() returns trigger
    language plpgsql
    security definer as
$$
begin
    delete from activity
    where event_name = 'referrals'
      and event_id in (select sha256(decode(replace(NEW_TABLE.referred_id::text, '-', ''), 'hex'))::text from NEW_TABLE);
    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select
        'referrals',
        referred_id,
        NEW_TABLE.referrer_id,
        NEW_TABLE.referred_id,
        json_build_object('tags', array_agg(NEW_TABLE.tag)),
        current_timestamp
    from NEW_TABLE
    group by NEW_TABLE.referred_id, NEW_TABLE.referrer_id;
    return NULL;
end;
$$;

create trigger referrals_insert_activity_trigger
    after insert on referrals
    referencing new table as NEW_TABLE
    for each statement execute function referrals_insert_activity_trigger();

create or replace function referrals_delete_activity_trigger() returns trigger
    language plpgsql
    security definer as
$$
begin
    delete from activity
    where event_name = 'referrals'
      and event_id in (select sha256(decode(replace(OLD_TABLE.referred_id::text, '-', ''), 'hex'))::text from OLD_TABLE);
    return NULL;
end;
$$;

create trigger referrals_delete_activity_trigger
    after delete on referrals
    referencing old table as OLD_TABLE
    for each statement execute function referrals_delete_activity_trigger();
