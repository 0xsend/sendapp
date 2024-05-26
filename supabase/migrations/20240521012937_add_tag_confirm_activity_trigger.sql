create or replace function tag_receipts_insert_activity_trigger() returns trigger
    language plpgsql
    security definer as
$$
begin
    delete from activity where event_name = 'tag_receipts' and event_id in (select hash from NEW_TABLE);
    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select
        'tag_receipts',
        NEW_TABLE.hash,
        t.user_id,
        null,
        json_build_object('tx_hash', srsr.tx_hash, 'tags', array_agg(t.name), 'value', srsr.v::text), -- cast v to text to avoid losing precision when converting to json when sending to clients
        current_timestamp
    from NEW_TABLE
         join tags t on t.name = NEW_TABLE.tag_name
         join send_revenues_safe_receives srsr ON NEW_TABLE.hash = '0x' || encode(srsr.tx_hash, 'hex')
    group by t.user_id, srsr.tx_hash, srsr.v, NEW_TABLE.hash;

    return NULL;
end;
$$;

create trigger tag_receipts_insert_activity_trigger
    after insert on tag_receipts
    referencing new table as NEW_TABLE
    for each statement execute function tag_receipts_insert_activity_trigger();
