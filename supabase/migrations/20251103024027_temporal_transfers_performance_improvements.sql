set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_send_scores_history()
 RETURNS TABLE(user_id uuid, distribution_id integer, score numeric, unique_sends bigint, send_ceiling numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$

BEGIN
    -- Authenticated users see only their own scores
    IF current_setting('role') = 'authenticated' AND auth.uid() IS NOT NULL THEN
        RETURN QUERY SELECT * FROM private.send_scores_history WHERE send_scores_history.user_id = auth.uid();
    -- Admin callers see all scores
    -- Check both 'service_role' explicitly (when current_setting returns it) and 'none' (when called from SECURITY DEFINER contexts)
    ELSIF current_setting('role')::text = 'service_role'
       OR current_setting('role') = 'none' THEN  -- 'none' covers both postgres and service_role in SECURITY DEFINER contexts
        RETURN QUERY SELECT * FROM private.send_scores_history;
    ELSE
        RETURN;
    END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_transfers_delete_temporal_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    paymaster bytea = '\xb1b01dc21a6537af7f9a46c76276b14fd7ceac67'::bytea;
begin
    -- Check if it's from or to paymaster
    if (NEW.f is not null and NEW.f = paymaster) or
       (NEW.t is not null and NEW.t = paymaster) then
        return NEW;
    end if;
    delete from public.activity a
    using temporal.send_account_transfers t_sat
    where a.event_name = 'temporal_send_account_transfers'
      and a.event_id = t_sat.workflow_id
      and t_sat.created_at_block_num <= NEW.block_num
      and t_sat.status IN ('initialized', 'submitted', 'sent', 'confirmed', 'cancelled');
    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data jsonb;
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

    return NEW;
end;
$function$
;


CREATE INDEX send_account_transfers_created_at_block_num_idx ON temporal.send_account_transfers USING btree (created_at_block_num DESC) WHERE (status = ANY (ARRAY['initialized'::temporal.transfer_status, 'submitted'::temporal.transfer_status, 'sent'::temporal.transfer_status, 'confirmed'::temporal.transfer_status, 'cancelled'::temporal.transfer_status]));

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION temporal.temporal_transfer_after_upsert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  _to_user_id uuid;
  _data jsonb;
BEGIN
    -- Do nothing if we haven't sent the transfer yet
    IF NEW.status = 'initialized' THEN
        RETURN NEW;
    END IF;

    -- Update send_account_transfers activity with note
    IF NEW.status = 'confirmed' THEN
        IF EXISTS (
            SELECT 1 FROM public.activity a
            WHERE event_name = NEW.send_account_transfers_activity_event_name
            AND event_id = NEW.send_account_transfers_activity_event_id
        ) THEN
            IF NEW.data ? 'note' THEN
                UPDATE public.activity a
                SET data = a.data || jsonb_build_object('note', NEW.data->>'note')
                WHERE event_name = NEW.send_account_transfers_activity_event_name
                AND event_id = NEW.send_account_transfers_activity_event_id;
            END IF;

            DELETE FROM public.activity
            WHERE event_id = NEW.workflow_id
            AND event_name = 'temporal_send_account_transfers';

            RETURN NEW;
        END IF;
    END IF;

    -- Do nothing if we have already indexed the transfer and its not failed
    -- Use the index on block_num for efficient lookup
    IF NEW.status != 'failed' AND NEW.created_at_block_num IS NOT NULL THEN
        IF EXISTS (
            SELECT 1
            FROM public.send_account_transfers
            WHERE block_num >= NEW.created_at_block_num
            LIMIT 1
        ) THEN
            RETURN NEW;
        END IF;
    END IF;

    -- token transfers
    IF NEW.data ? 't' THEN
        SELECT user_id INTO _to_user_id
        FROM send_accounts
        WHERE address_bytes = (NEW.data->>'t')::bytea
        LIMIT 1;

        _data := jsonb_build_object(
            'status', NEW.status,
            'user_op_hash', NEW.data->'user_op_hash',
            'log_addr', NEW.data->>'log_addr',
            'f', NEW.data->>'f',
            't', NEW.data->>'t',
            'v', NEW.data->>'v',
            'tx_hash', NEW.data->>'tx_hash',
            'block_num', NEW.data->>'block_num',
            'note', NEW.data->>'note'
        );
    -- eth transfers
    ELSE
        SELECT user_id INTO _to_user_id
        FROM send_accounts
        WHERE address_bytes = (NEW.data->>'log_addr')::bytea
        LIMIT 1;

        _data := jsonb_build_object(
            'status', NEW.status,
            'user_op_hash', NEW.data->'user_op_hash',
            'log_addr', NEW.data->>'log_addr',
            'sender', NEW.data->>'sender',
            'value', NEW.data->>'value',
            'tx_hash', NEW.data->>'tx_hash',
            'block_num', NEW.data->>'block_num',
            'note', NEW.data->>'note'
        );
    END IF;

    _data := jsonb_strip_nulls(_data);

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
$function$
;

CREATE OR REPLACE FUNCTION temporal.temporal_transfer_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
  _user_id uuid;
  _address_bytes bytea;
BEGIN
  IF NEW.data ? 'f' THEN
    _address_bytes := (NEW.data->>'f')::bytea;
  ELSIF NEW.data ? 'sender' THEN
    _address_bytes := (NEW.data->>'sender')::bytea;
  ELSE
    RAISE NOTICE E'No sender address. workflow_id: %\n', NEW.workflow_id;
    RETURN NEW;
  END IF;

  SELECT user_id INTO _user_id
  FROM send_accounts
  WHERE address_bytes = _address_bytes
  LIMIT 1;

  IF _user_id IS NULL THEN
    RAISE NOTICE E'No user found for address bytes, workflow_id: %\n', NEW.workflow_id;
    RETURN NEW;
  END IF;

  NEW.user_id = _user_id;

  RETURN NEW;
END;
$function$
;


