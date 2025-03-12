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
    workflow_id text not null,
    user_id uuid not null DEFAULT uuid_nil(), -- rely on trigger to set user_id
    status temporal.transfer_status not null,
    created_at_block_num bigint not null,
    data jsonb not null,
    created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    updated_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
);

GRANT ALL ON TABLE temporal.send_account_transfers TO service_role;
GRANT USAGE, SELECT ON SEQUENCE temporal.send_account_transfers_id_seq TO service_role;


alter table "temporal"."send_account_transfers"
    enable row level security;

create policy "users can see their own temporal transfers"
on "temporal"."send_account_transfers" as permissive
for select to authenticated
using (
 (select auth.uid()) = user_id
);

CREATE INDEX temporal_send_account_transfers_user_id_idx ON temporal.send_account_transfers(user_id);
CREATE INDEX temporal_send_account_transfers_created_at_idx ON temporal.send_account_transfers(created_at);
CREATE UNIQUE INDEX temporal_send_account_transfers_workflow_id_idx ON temporal.send_account_transfers(workflow_id);

CREATE OR REPLACE FUNCTION temporal.handle_transfer_upsert()
RETURNS TRIGGER AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Get user_id based on transfer type
  IF NEW.data ? 'f' THEN
    -- Token transfer
    SELECT user_id INTO _user_id
    FROM send_accounts
    WHERE address = concat('0x', encode((NEW.data->>'f')::bytea, 'hex'))::citext;
  ELSIF NEW.data ? 'sender' THEN
    -- ETH transfer
    SELECT user_id INTO _user_id
    FROM send_accounts
    WHERE address = concat('0x', encode((NEW.data->>'sender')::bytea, 'hex'))::citext;
  END IF;

  -- Validate user_id
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'No user found for the given address';
  END IF;

  -- Handle conflicts for INSERT operations
  IF TG_OP = 'INSERT' THEN
    -- Check if conflicting row exists with non-failed/cancelled status
    IF EXISTS (
      SELECT 1
      FROM temporal.send_account_transfers
      WHERE workflow_id = NEW.workflow_id
      AND status NOT IN ('failed', 'cancelled')
    ) THEN
      RAISE EXCEPTION 'Workflow ID % already exists with status not failed/cancelled', NEW.workflow_id;
    END IF;

    -- For existing failed/cancelled transfers, update instead of insert
    IF EXISTS (
      SELECT 1
      FROM temporal.send_account_transfers
      WHERE workflow_id = NEW.workflow_id
    ) THEN
      UPDATE temporal.send_account_transfers
      SET status = NEW.status,
          created_at_block_num = NEW.created_at_block_num,
          data = NEW.data,
          user_id = _user_id,
          updated_at = now()
      WHERE workflow_id = NEW.workflow_id;

      RETURN NULL;
    END IF;
  END IF;

  -- Set user_id for new inserts or updates
  NEW.user_id := _user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_transfer_upsert_trigger
  BEFORE INSERT OR UPDATE ON temporal.send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION temporal.handle_transfer_upsert();

CREATE OR REPLACE FUNCTION temporal.temporal_send_account_transfers_trigger_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
DECLARE
  _from_user_id uuid;
  _to_user_id uuid;
  _data jsonb;
BEGIN
  -- Set user IDs based on whether it's a token or ETH transfer
  IF NEW.data ? 'f' THEN
    -- Token transfer
    SELECT user_id INTO _from_user_id
    FROM send_accounts
    WHERE address = concat('0x', encode((NEW.data->>'f')::bytea, 'hex'))::citext;

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
    -- ETH transfer
    SELECT user_id INTO _from_user_id
    FROM send_accounts
    WHERE address = concat('0x', encode((NEW.data->>'sender')::bytea, 'hex'))::citext;

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

  -- For INSERT operations
  IF TG_OP = 'INSERT' THEN
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
      _from_user_id,
      _to_user_id,
      _data
    );
  -- For UPDATE operations
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE activity
    SET data = _data
    WHERE event_name = 'temporal_send_account_transfers'
      AND event_id = NEW.workflow_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Single trigger for both token and ETH transfers, handling both INSERT and UPDATE
CREATE TRIGGER temporal_send_account_transfers_trigger_activity
  AFTER INSERT OR UPDATE ON temporal.send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION temporal.temporal_send_account_transfers_trigger_activity();

CREATE OR REPLACE FUNCTION temporal.temporal_send_account_transfers_trigger_delete_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
BEGINa
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


-- When a send_account_transfer is inserted, delete older temporal_send_account_transfers
-- We know they are indexed if its inserting newer blocks.
-- This prevents duplicate activities once a transfer is completed.
-- keep failed so we can show it to the user, we can garbage collect later
create or replace function send_account_transfers_delete_temporal_activity() returns trigger
language plpgsql
security definer as
$$
begin
    delete from public.activity a
    where a.event_name = 'temporal_send_account_transfers' and a.event_id in (
      select t_sat.workflow_id
      from temporal.send_account_transfers t_sat
      where t_sat.created_at_block_num <= NEW.block_num
      and t_sat.status != 'failed'
    );
    return NEW;
end;
$$;

CREATE TRIGGER send_account_transfers_trigger_delete_temporal_activity
  BEFORE INSERT ON public.send_account_transfers
  FOR EACH ROW
  EXECUTE FUNCTION send_account_transfers_delete_temporal_activity();

-- Add temporal filter (a.to_user_id = ( select auth.uid() ) and a.event_name not like 'temporal_%')
create or replace view activity_feed with (security_barrier = on) as
select a.created_at                  as created_at,
       a.event_name                  as event_name,
       case when a.from_user_id = from_p.id then (case when a.from_user_id = ( select auth.uid() )
                                                           then ( select auth.uid() ) end,
                                                  from_p.name,
                                                  from_p.avatar_url,
                                                  from_p.send_id,
                                                  ( select array_agg(name)
                                                    from tags
                                                    where user_id = from_p.id and status = 'confirmed' )
           )::activity_feed_user end as from_user,
       case when a.to_user_id = to_p.id then (case when a.to_user_id = ( select auth.uid() )
                                                       then ( select auth.uid() ) end,
                                              to_p.name,
                                              to_p.avatar_url,
                                              to_p.send_id,
                                              ( select array_agg(name)
                                                from tags
                                                where user_id = to_p.id and status = 'confirmed' )
           )::activity_feed_user end as to_user,
       a.data                        as data
from activity a
         left join profiles from_p on a.from_user_id = from_p.id
         left join profiles to_p on a.to_user_id = to_p.id
where a.from_user_id = ( select auth.uid() )
   or (a.to_user_id = ( select auth.uid() ) and a.event_name not like 'temporal_%')
group by a.created_at, a.event_name, a.from_user_id, a.to_user_id, from_p.id, from_p.name, from_p.avatar_url,
         from_p.send_id, to_p.id, to_p.name, to_p.avatar_url, to_p.send_id, a.data;
