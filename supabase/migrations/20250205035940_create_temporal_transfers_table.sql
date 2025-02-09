SET check_function_bodies = OFF;

-- Create temporal schema
CREATE SCHEMA IF NOT EXISTS temporal;

-- Grant permissions for temporal schema
GRANT USAGE ON SCHEMA temporal TO authenticated, service_role;

-- Grant execute on functions to service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA temporal TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA temporal
    GRANT EXECUTE ON FUNCTIONS TO service_role;

CREATE TYPE temporal.transfer_status AS ENUM(
    'initialized',
    'sent',
    'confirmed',
    'indexed',
    'failed'
);

CREATE TABLE temporal.send_account_transfers(
    id serial primary key,
    workflow_id text NOT NULL,
    user_id uuid NOT NULL,
    status temporal.transfer_status NOT NULL,
    data jsonb NOT NULL,
    created_at timestamptz DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at timestamptz DEFAULT (NOW() AT TIME ZONE 'UTC')
);

alter table "temporal"."send_account_transfers"
    enable row level security;

create policy "users can see their own temporal transfers"
on "temporal"."send_account_transfers" as permissive
for select to authenticated
using (
    user_id = auth.uid()
);


CREATE INDEX temporal_send_account_transfers_user_id_idx ON temporal.send_account_transfers(user_id);
CREATE INDEX temporal_send_account_transfers_status_idx ON temporal.send_account_transfers(status);
CREATE UNIQUE INDEX temporal_send_account_transfers_workflow_id_idx ON temporal.send_account_transfers(workflow_id);

CREATE OR REPLACE FUNCTION temporal.insert_temporal_token_send_account_transfer(
  workflow_id text,
  status temporal.transfer_status,
  f bytea,
  t bytea,
  v text,
  log_addr bytea
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  f_user_id uuid;
BEGIN
  SELECT user_id INTO f_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode(f, 'hex'))::citext;

  INSERT INTO temporal.send_account_transfers(
    workflow_id,
    user_id,
    status,
    data
  )
  VALUES (
    workflow_id,
    f_user_id,
    status,
    json_build_object(
      'f', f,
      't', t,
      'v', v::text,
      'log_addr', log_addr
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION temporal.insert_temporal_eth_send_account_transfer(
  workflow_id text,
  status temporal.transfer_status,
  sender bytea,
  log_addr bytea,
  value text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_user_id uuid;
BEGIN
  SELECT user_id INTO sender_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode(sender, 'hex'))::citext;

  INSERT INTO temporal.send_account_transfers(
    workflow_id,
    user_id,
    status,
    data
  )
  VALUES (
    workflow_id,
    sender_user_id,
    status,
    json_build_object(
      'log_addr', log_addr,
      'sender', sender,
      'value', value::text
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION temporal.update_temporal_send_account_transfer(
  workflow_id text,
  status temporal.transfer_status,
  data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _data jsonb;
BEGIN
  -- Only construct _data if input data is not null
  IF data IS NOT NULL THEN
    _data := json_build_object(
      'user_op_hash', (data->>'user_op_hash'),
      'tx_hash', (data->>'tx_hash'),
      'block_num', data->>'block_num'::text,
      'tx_idx', data->>'tx_idx'::text
    );
  ELSE
    _data := '{}'::jsonb;
  END IF;

  UPDATE temporal.send_account_transfers
  SET
    status = update_temporal_send_account_transfer.status,
    data = CASE
      WHEN _data = '{}'::jsonb THEN temporal.send_account_transfers.data
      ELSE temporal.send_account_transfers.data || _data
    END,
    updated_at = (NOW() AT TIME ZONE 'UTC')
  WHERE
    temporal.send_account_transfers.workflow_id = update_temporal_send_account_transfer.workflow_id;
END;
$$;

-- Token transfer triggers
CREATE OR REPLACE FUNCTION temporal.temporal_token_send_account_transfers_trigger_insert_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
DECLARE
  _f_user_id uuid;
  _t_user_id uuid;
BEGIN
  SELECT user_id INTO _f_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode((NEW.data->>'f')::bytea, 'hex'))::citext;

  SELECT user_id INTO _t_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode((NEW.data->>'t')::bytea, 'hex'))::citext;

  INSERT INTO activity(
    event_name,
    event_id,
    from_user_id,
    to_user_id,
    data,
    created_at
  )
  VALUES (
    'temporal_send_account_transfers',
    NEW.workflow_id,
    _f_user_id,
    _t_user_id,
    json_build_object(
      'status', NEW.status,
      'user_op_hash', (NEW.data->>'user_op_hash'),
      'log_addr', (NEW.data->>'log_addr'),
      'f', (NEW.data->>'f'),
      't', (NEW.data->>'t'),
      'v', NEW.data->>'v'::text,
      'tx_hash', (NEW.data->>'tx_hash'),
      'block_num', NEW.data->>'block_num'::text,
      'tx_idx', NEW.data->>'tx_idx'::text
    ),
    NEW.created_at
  );
  RETURN NEW;
END;
$$;

-- ETH transfer triggers
CREATE OR REPLACE FUNCTION temporal.temporal_eth_send_account_transfers_trigger_insert_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
DECLARE
  _from_user_id uuid;
  _to_user_id uuid;
BEGIN
  SELECT user_id INTO _from_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode((NEW.data->>'sender')::bytea, 'hex'))::citext;

  SELECT user_id INTO _to_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode((NEW.data->>'log_addr')::bytea, 'hex'))::citext;

  INSERT INTO activity(
    event_name,
    event_id,
    from_user_id,
    to_user_id,
    data,
    created_at
  )
  VALUES (
    'temporal_send_account_transfers',
    NEW.workflow_id,
    _from_user_id,
    _to_user_id,
    json_build_object(
      'status', NEW.status,
      'user_op_hash', (NEW.data->>'user_op_hash'),
      'log_addr', (NEW.data->>'log_addr'),
      'sender', (NEW.data->>'sender'),
      'value', NEW.data->>'value'::text,
      'tx_hash', (NEW.data->>'tx_hash'),
      'block_num', NEW.data->>'block_num'::text,
      'tx_idx', NEW.data->>'tx_idx'::text
    ),
    NEW.created_at
  );
  RETURN NEW;
END;
$$;

-- Create triggers with conditions
CREATE TRIGGER temporal_token_send_account_transfers_trigger_insert_activity
  AFTER INSERT ON temporal.send_account_transfers
  FOR EACH ROW
  WHEN (NEW.data ? 'f')
  EXECUTE FUNCTION temporal.temporal_token_send_account_transfers_trigger_insert_activity();

CREATE TRIGGER temporal_eth_send_account_transfers_trigger_insert_activity
  AFTER INSERT ON temporal.send_account_transfers
  FOR EACH ROW
  WHEN (NEW.data ? 'sender')
  EXECUTE FUNCTION temporal.temporal_eth_send_account_transfers_trigger_insert_activity();

CREATE OR REPLACE FUNCTION temporal.temporal_send_account_transfers_trigger_update_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
BEGIN
  UPDATE activity
  SET data = NEW.data
  WHERE event_name = 'temporal_send_account_transfers'
    AND event_id = NEW.workflow_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER temporal_send_account_transfers_trigger_update_activity
  AFTER UPDATE ON temporal.send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION temporal.temporal_send_account_transfers_trigger_update_activity();

CREATE OR REPLACE FUNCTION temporal.delete_temporal_transfer_activity(workflow_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM activity
    WHERE event_name = 'temporal_send_account_transfers'
      AND event_id = workflow_id;
END;
$$;