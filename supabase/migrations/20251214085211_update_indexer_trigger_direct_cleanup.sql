-- Phase 5: Update indexer trigger for direct cleanup using activity_id
-- This migration updates the send_account_transfers indexer trigger to:
-- 1. Query temporal table for note before inserting activity
-- 2. Delete temporal activity directly using activity_id (matching deposit pattern)

CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data jsonb;
    _note text;
begin
    select user_id into _f_user_id
    from send_accounts
    where address_bytes = NEW.f
      and chain_id = NEW.chain_id::integer
    limit 1;
    select user_id into _t_user_id
    from send_accounts
    where address_bytes = NEW.t
      and chain_id = NEW.chain_id::integer
    limit 1;

    -- Query temporal for note if it exists
    SELECT data->>'note' INTO _note
    FROM temporal.send_account_transfers
    WHERE send_account_transfers_activity_event_id = NEW.event_id
      AND send_account_transfers_activity_event_name = 'send_account_transfers'
      AND status <> 'failed'
      AND data ? 'note'
    LIMIT 1;

    -- cast v to text to avoid losing precision when converting to json when sending to clients
    _data := json_build_object(
        'log_addr', NEW.log_addr,
        'f', NEW.f,
        't', NEW.t,
        'v', NEW.v::text,
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    -- Add note to data if it exists
    IF _note IS NOT NULL THEN
        _data := _data || jsonb_build_object('note', _note);
    END IF;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_transfers',
            NEW.event_id,
            _f_user_id,
            _t_user_id,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = _t_user_id,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    -- *** CLEANUP LOGIC ***
    -- Delete temporal activities using activity_id for direct, efficient cleanup
    DELETE FROM public.activity
    WHERE id IN (
        SELECT activity_id
        FROM temporal.send_account_transfers
        WHERE send_account_transfers_activity_event_id = NEW.event_id
          AND send_account_transfers_activity_event_name = 'send_account_transfers'
          AND status <> 'failed'
          AND activity_id IS NOT NULL
    );
    -- *** END CLEANUP LOGIC ***

    return NEW;
end;
$function$
;
