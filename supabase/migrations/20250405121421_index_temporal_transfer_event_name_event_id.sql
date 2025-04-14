-- First, update all rows to strip nulls from data
UPDATE temporal.send_account_transfers
SET data = jsonb_strip_nulls(data);

-- Then, remove empty string notes
UPDATE temporal.send_account_transfers
SET data = data - 'note'
WHERE data->>'note' = '';

ALTER TABLE temporal.send_account_transfers
    ADD COLUMN send_account_transfers_activity_event_id text NULL,
    ADD COLUMN send_account_transfers_activity_event_name text NULL;

CREATE INDEX temporal_send_account_transfers_activity_event_name_event_id_idx
    ON temporal.send_account_transfers using btree (send_account_transfers_activity_event_id, send_account_transfers_activity_event_name);

UPDATE temporal.send_account_transfers
SET send_account_transfers_activity_event_id = (data->>'event_id')::text,
    send_account_transfers_activity_event_name = (data->>'event_name')::text;

WITH transfers_with_notes AS (
    SELECT
        send_account_transfers_activity_event_id,
        send_account_transfers_activity_event_name,
        data->>'note' as note
    FROM temporal.send_account_transfers
    WHERE data ? 'note'
)

UPDATE public.activity AS a
SET data = a.data || jsonb_build_object('note', t.note)
FROM transfers_with_notes t
WHERE a.event_name = t.send_account_transfers_activity_event_name
AND a.event_id = t.send_account_transfers_activity_event_id;

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
    IF NEW.status != 'failed' AND NEW.created_at_block_num <= (
        SELECT block_num
        FROM public.send_account_transfers
        ORDER BY block_num DESC
        LIMIT 1
    ) THEN
        RETURN NEW;
    END IF;

    -- token transfers
    IF NEW.data ? 't' THEN
        SELECT user_id INTO _to_user_id
        FROM send_accounts
        WHERE address = concat('0x', encode((NEW.data->>'t')::bytea, 'hex'))::citext;

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
        WHERE address = concat('0x', encode((NEW.data->>'log_addr')::bytea, 'hex'))::citext;

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
$$;

CREATE OR REPLACE FUNCTION public.update_transfer_activity_before_insert()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    AS $function$
DECLARE
    note text;
    temporal_event_id text;
BEGIN
    IF NEW.event_name = 'send_account_transfers'
    AND NEW.from_user_id IS NOT NULL AND NEW.to_user_id IS NOT NULL
    THEN
        SELECT
            data->>'note',
            t_sat.workflow_id INTO note, temporal_event_id
        FROM temporal.send_account_transfers t_sat
        WHERE t_sat.send_account_transfers_activity_event_id = NEW.event_id
        AND t_sat.send_account_transfers_activity_event_name = NEW.event_name;

        IF note IS NOT NULL THEN
            NEW.data = NEW.data || jsonb_build_object('note', note);
        END IF;

        -- Delete any temporal activity that might exist
        IF temporal_event_id IS NOT NULL THEN
            DELETE FROM public.activity
            WHERE event_id = temporal_event_id
            AND event_name = 'temporal_send_account_transfers';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

CREATE TRIGGER temporal_send_account_transfers_trigger_update_transfer_activity_before_insert
    BEFORE INSERT ON public.activity
    FOR EACH ROW
    EXECUTE FUNCTION public.update_transfer_activity_before_insert();
