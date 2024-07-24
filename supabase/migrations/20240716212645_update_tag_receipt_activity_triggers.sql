set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.tag_receipts_insert_activity_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    delete from activity
    where event_name = 'tag_receipt_usdc'
      and event_id in (select event_id from NEW_TABLE);

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    select
        'tag_receipt_usdc',
        NEW_TABLE.event_id,
        t.user_id,
        null,
        json_build_object(
                'log_addr',
                scr.log_addr,
                'block_num',
                scr.block_num,
                'tx_idx',
                scr.tx_idx,
                'log_idx',
                scr.log_idx,
                'tx_hash',
                scr.tx_hash,
                'tags',
                array_agg(t.name),
                'value',
            -- cast amount to text to avoid losing precision when converting to json when sending to clients
                scr.amount::text
        ),
        current_timestamp
    from NEW_TABLE
             join tags t on t.name = NEW_TABLE.tag_name
             join sendtag_checkout_receipts scr ON NEW_TABLE.event_id = scr.event_id
    group by t.user_id, NEW_TABLE.event_id, scr.event_id, scr.log_addr, scr.block_num, scr.tx_idx, scr.log_idx,  scr.tx_hash, scr.amount;

    return NULL;
end;
$function$
;


