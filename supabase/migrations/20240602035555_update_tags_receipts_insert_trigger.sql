create or replace function public.tag_receipts_insert_activity_trigger()
returns trigger
language plpgsql
security definer
as $function$
begin
    delete from activity
    where event_name = 'tag_receipts'
      and event_id in (select event_id from NEW_TABLE);

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select
        'tag_receipts',
        NEW_TABLE.event_id,
        t.user_id,
        null,
        json_build_object(
                'log_addr',
                srsr.log_addr,
                'block_num',
                srsr.block_num,
                'tx_idx',
                srsr.tx_idx,
                'log_idx',
                srsr.log_idx,
                'tx_hash',
                srsr.tx_hash,
                'tags',
                array_agg(t.name),
                'value',
            -- cast v to text to avoid losing precision when converting to json when sending to clients
                srsr.v::text
        ),
        current_timestamp
    from NEW_TABLE
             join tags t on t.name = NEW_TABLE.tag_name
             join send_revenues_safe_receives srsr ON NEW_TABLE.event_id = srsr.event_id
    group by t.user_id, NEW_TABLE.event_id, srsr.event_id, srsr.log_addr, srsr.block_num, srsr.tx_idx, srsr.log_idx,  srsr.tx_hash, srsr.v;

    return NULL;
end;
$function$;
