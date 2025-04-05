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
        'block_num', NEW.data->>'block_num'::text,
        'note', (NEW.data->>'note')
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
        'block_num', NEW.data->>'block_num'::text,
        'note', (NEW.data->>'note')
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

-- Update transfer activities table with note tx is indexed
CREATE OR REPLACE FUNCTION temporal.add_note_activity_temporal_transfer_before_confirmed()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
BEGIN
  IF NEW.status != 'confirmed' OR NOT (NEW.data ? 'note') THEN
      RETURN NEW;
  END IF;


  UPDATE public.activity
  SET data = data || jsonb_build_object('note', NEW.data->>'note')
  WHERE event_name = NEW.data->>'event_name'
  AND event_id = NEW.data->>'event_id';

  RETURN NEW;
END;
$$;

CREATE TRIGGER send_account_transfers_trigger_add_note_activity_temporal_transfer_before_confirmed
  BEFORE UPDATE ON temporal.send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION temporal.add_note_activity_temporal_transfer_before_confirmed();
