SET check_function_bodies = OFF;

-- Create temporal schema
CREATE SCHEMA IF NOT EXISTS temporal;

-- Grant permissions for temporal schema
GRANT USAGE ON SCHEMA temporal TO authenticated;
GRANT USAGE ON SCHEMA temporal TO service_role;

-- Grant execute on functions to service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA temporal TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA temporal
    GRANT EXECUTE ON FUNCTIONS TO service_role;

CREATE TYPE temporal.transfer_status AS ENUM(
    'initialized',
    'sent',
    'confirmed',
    'failed',
    'cancelled'
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

GRANT ALL ON TABLE temporal.send_account_transfers TO service_role;

alter table "temporal"."send_account_transfers"
    enable row level security;

create policy "users can see their own temporal transfers"
on "temporal"."send_account_transfers" as permissive
for select to authenticated
using (
    user_id = auth.uid()
);


CREATE INDEX temporal_send_account_transfers_user_id_idx ON temporal.send_account_transfers(user_id);
CREATE INDEX temporal_send_account_transfers_created_at_idx ON temporal.send_account_transfers(created_at);
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
  _user_id uuid;
  _data jsonb;
BEGIN
  SELECT user_id INTO _user_id
  FROM send_accounts
  WHERE address = concat('0x', encode(f, 'hex'))::citext;

  -- cast v to text to avoid losing precision when converting to json when sending to clients
  _data := json_build_object(
      'f', f,
      't', t,
      'v', v::text,
      'log_addr', log_addr
  );

  INSERT INTO temporal.send_account_transfers(
    workflow_id,
    user_id,
    status,
    data
  )
  VALUES (
    workflow_id,
    _user_id,
    status,
    _data
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
  _user_id uuid;
  _data jsonb;
BEGIN
  SELECT user_id INTO _user_id
  FROM send_accounts
  WHERE address = concat('0x', encode(sender, 'hex'))::citext;

  -- cast v to text to avoid losing precision when converting to json when sending to clients
  _data := json_build_object(
      'log_addr', log_addr,
      'sender', sender,
      'value', value::text
  );

  INSERT INTO temporal.send_account_transfers(
    workflow_id,
    user_id,
    status,
    data
  )
  VALUES (
    workflow_id,
    _user_id,
    status,
    _data
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
      'block_num', data->>'block_num'::text
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
  _data jsonb;
BEGIN
  SELECT user_id INTO _f_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode((NEW.data->>'f')::bytea, 'hex'))::citext;

  SELECT user_id INTO _t_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode((NEW.data->>'t')::bytea, 'hex'))::citext;

  -- cast v to text to avoid losing precision when converting to json when sending to clients
  _data := json_build_object(
      'status', NEW.status::text,
      'user_op_hash', (NEW.data->>'user_op_hash'),
      'log_addr', (NEW.data->>'log_addr'),
      'f', (NEW.data->>'f'),
      't', (NEW.data->>'t'),
      'v', NEW.data->>'v'::text,
      'tx_hash', (NEW.data->>'tx_hash'),
      'block_num', NEW.data->>'block_num'::text
  );

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
    _data,
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
  _data jsonb;
BEGIN
  SELECT user_id INTO _from_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode((NEW.data->>'sender')::bytea, 'hex'))::citext;

  SELECT user_id INTO _to_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode((NEW.data->>'log_addr')::bytea, 'hex'))::citext;

      -- cast v to text to avoid losing precision when converting to json when sending to clients
  _data := json_build_object(
      'status', NEW.status::text,
      'user_op_hash', (NEW.data->>'user_op_hash'),
      'log_addr', (NEW.data->>'log_addr'),
      'sender', (NEW.data->>'sender'),
      'value', NEW.data->>'value'::text,
      'tx_hash', (NEW.data->>'tx_hash'),
      'block_num', NEW.data->>'block_num'::text
  );

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
    _data,
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
DECLARE
  _data jsonb;
BEGIN
  IF EXISTS (
    SELECT 1 FROM activity
    WHERE event_name = 'temporal_send_account_transfers'
      AND event_id = NEW.workflow_id
  ) THEN
    _data := NEW.data || json_build_object('status', NEW.status::text)::jsonb;

    UPDATE activity
    SET data = _data
    WHERE event_name = 'temporal_send_account_transfers'
      AND event_id = NEW.workflow_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER temporal_send_account_transfers_trigger_update_activity
  AFTER UPDATE ON temporal.send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION temporal.temporal_send_account_transfers_trigger_update_activity();

CREATE OR REPLACE FUNCTION temporal.temporal_send_account_transfers_trigger_delete_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
BEGIN
    DELETE FROM activity
    WHERE event_name = 'temporal_send_account_transfers'
      AND event_id = OLD.workflow_id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER temporal_send_account_transfers_trigger_delete_activity
  BEFORE DELETE ON temporal.send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION temporal.temporal_send_account_transfers_trigger_delete_activity();


-- When a send_account_transfer activity is inserted, delete any temporal_send_account_transfers
-- with the same tx_hash from activity table.
-- This prevents duplicate activities once a transfer is completed.
create or replace function send_account_transfers_trigger_insert_activity() returns trigger
language plpgsql
security definer as
$$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data jsonb;
begin
    -- Delete any temporal transfers with matching tx_hash
    DELETE FROM activity a
    WHERE event_name = 'temporal_send_account_transfers'
      AND extract(epoch from a.created_at)::numeric < NEW.block_time;
    -- select send app info for from address
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.f, 'hex'))::citext;
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.t, 'hex'))::citext;

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
$$;