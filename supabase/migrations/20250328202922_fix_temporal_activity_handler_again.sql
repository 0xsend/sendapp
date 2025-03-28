-- When a send_account_transfer is inserted, delete older temporal_send_account_transfers
-- We know they are indexed if its inserting newer blocks.
-- This prevents duplicate activities once a transfer is completed.
-- keep failed so we can show it to the user, we can garbage collect later
create or replace function send_account_transfers_delete_temporal_activity() returns trigger
language plpgsql
security definer as
$$
declare
    paymaster bytea = '\xb1b01dc21a6537af7f9a46c76276b14fd7ceac67'::bytea;
    workflow_ids text[];
begin
    -- Check if it's from or to paymaster
    if (NEW.f is not null and NEW.f = paymaster) or
       (NEW.t is not null and NEW.t = paymaster) then
        return NEW;
    end if;

    -- First get the workflow IDs into an array
    select array_agg(t_sat.workflow_id)
    into workflow_ids
    from temporal.send_account_transfers t_sat
    where t_sat.created_at_block_num <= NEW.block_num
    and t_sat.status != 'failed';

    -- Only proceed with deletions if we have workflow IDs
    if workflow_ids is not null and array_length(workflow_ids, 1) > 0 then
        -- Delete from activity table
        delete from public.activity a
        where a.event_name = 'temporal_send_account_transfers'
        and a.event_id = any(workflow_ids);
    end if;

    return NEW;
end;
$$;


CREATE OR REPLACE FUNCTION temporal.temporal_transfer_after_upsert()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
DECLARE
  _to_user_id uuid;
  _data jsonb;
BEGIN
  -- Do nothing if we haven't sent the transfer yet
  IF NOT NEW.data ? 'log_addr' THEN
    RETURN NEW;
  END IF;

  -- Do nothing if we have already indexed the transfer and its not failed
  IF NEW.status != 'failed' AND NEW.created_at_block_num <= (
    SELECT block_num
    FROM public.send_account_transfers
    ORDER BY block_num DESC
    LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  IF NEW.data ? 't' THEN
    SELECT user_id INTO _to_user_id
    FROM send_accounts
    WHERE address = concat('0x', encode((NEW.data->>'t')::bytea, 'hex'))::citext;

    _data := json_build_object(
        'status', NEW.status::text,
        'user_op_hash', (NEW.data->'user_op_hash'),
        'log_addr', (NEW.data->>'log_addr'),
        'f', (NEW.data->>'f'),
        't', (NEW.data->>'t'),
        'v', NEW.data->>'v'::text,
        'tx_hash', (NEW.data->>'tx_hash'),
        'block_num', NEW.data->>'block_num'::text
    );
  ELSE
    SELECT user_id INTO _to_user_id
    FROM send_accounts
    WHERE address = concat('0x', encode((NEW.data->>'log_addr')::bytea, 'hex'))::citext;

    _data := json_build_object(
        'status', NEW.status::text,
        'user_op_hash', (NEW.data->'user_op_hash'),
        'log_addr', (NEW.data->>'log_addr'),
        'sender', (NEW.data->>'sender'),
        'value', NEW.data->>'value'::text,
        'tx_hash', (NEW.data->>'tx_hash'),
        'block_num', NEW.data->>'block_num'::text
    );
  END IF;

  INSERT INTO activity(
    event_name,
    event_id,
    from_user_id,
    to_user_id,
    data
  )
  VALUES (
    'temporal_send_account_transfers',
    NEW.workflow_id,
    NEW.user_id,
    _to_user_id,
    _data
  )
  ON CONFLICT (event_name, event_id)
  DO UPDATE SET
    data = EXCLUDED.data;
  RETURN NEW;
END;
$$;