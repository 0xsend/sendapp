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
                sat.log_addr,
                'block_num',
                sat.block_num,
                'tx_idx',
                sat.tx_idx,
                'log_idx',
                sat.log_idx,
                'tx_hash',
                sat.tx_hash,
                'tags',
                array_agg(t.name),
                'value',
            -- cast v to text to avoid losing precision when converting to json when sending to clients
                sat.v::text
        ),
        current_timestamp
    from NEW_TABLE
             join tags t on t.name = NEW_TABLE.tag_name
             join send_account_transfers sat ON NEW_TABLE.event_id = sat.event_id
    group by t.user_id, NEW_TABLE.event_id, sat.event_id, sat.log_addr, sat.block_num, sat.tx_idx, sat.log_idx,  sat.tx_hash, sat.v;

    return NULL;
end;
$function$
;


