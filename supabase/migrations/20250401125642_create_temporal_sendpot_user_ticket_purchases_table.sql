-- Grant execute on functions to service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA temporal TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA temporal
    GRANT EXECUTE ON FUNCTIONS TO service_role;

CREATE TYPE temporal.transaction_status AS ENUM(
    'initialized',
    'submitted',
    'sent',
    'confirmed',
    'failed',
    'cancelled'
);

CREATE TABLE temporal.send_pot_user_ticket_purchases(
    id serial primary key,
    workflow_id text not null,
    status temporal.transaction_status not null default 'initialized',
    user_id uuid, -- rely on trigger to set user_id
    created_at_block_num numeric,
    data jsonb,
    created_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    updated_at timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
);

GRANT ALL ON TABLE temporal.send_pot_user_ticket_purchases TO service_role;
GRANT USAGE, SELECT ON SEQUENCE temporal.send_pot_user_ticket_purchases_id_seq TO service_role;

alter table "temporal"."send_pot_user_ticket_purchases"
    enable row level security;

GRANT SELECT ON TABLE temporal.send_pot_user_ticket_purchases to authenticated;

create policy "users can see their own temporal sendpot ticket purchases"
on "temporal"."send_pot_user_ticket_purchases" as permissive
for select to authenticated
using (
 (select auth.uid()) = user_id
);

CREATE INDEX temporal_send_pot_user_ticket_purchases_user_id_idx ON temporal.send_pot_user_ticket_purchases(user_id);
CREATE UNIQUE INDEX temporal_send_pot_user_ticket_purchases_workflow_id_idx ON temporal.send_pot_user_ticket_purchases(workflow_id);
CREATE INDEX CONCURRENTLY ON temporal.send_pot_user_ticket_purchases(workflow_id, created_at desc);
CREATE INDEX CONCURRENTLY ON temporal.send_pot_user_ticket_purchases(workflow_id, updated_at desc);
CREATE INDEX CONCURRENTLY ON temporal.send_pot_user_ticket_purchases(user_id, workflow_id);
CREATE INDEX CONCURRENTLY ON temporal.send_pot_user_ticket_purchases(status, created_at_block_num desc);

-- Insert user_id attached to workflow
CREATE OR REPLACE FUNCTION temporal.temporal_sendpot_ticket_purchase_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  _user_id uuid;
  _address text;
BEGIN
  SELECT user_id INTO _user_id
  FROM send_accounts
  WHERE address = _address::citext;

  IF _user_id IS NULL THEN
    RAISE NOTICE E'No user found for address: %, workflow_id: %\n', _address, NEW.workflow_id;
    RETURN NEW;
  END IF;

  NEW.user_id = _user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER temporal_send_pot_user_ticket_purchases_trigger_before_insert
  BEFORE INSERT ON temporal.send_pot_user_ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION temporal.temporal_sendpot_ticket_purchase_before_insert();

  CREATE OR REPLACE FUNCTION temporal.temporal_sendpot_ticket_purchase_after_upsert()
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
    FROM public.send_pot_user_ticket_purchases
    ORDER BY block_num DESC
    LIMIT 1
  ) THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO _to_user_id
  FROM send_accounts
  WHERE address = concat('0x', encode((NEW.data->>'t')::bytea, 'hex'))::citext;

  _data := json_build_object(
    'status', NEW.status::text,
    'user_op_hash', (NEW.data->'user_op_hash'),
    'log_addr', (NEW.data->>'log_addr'),
    'referrer', (NEW.data->>'referrer'),
    'value', (NEW.data->>'value'),
    'recipient', NEW.data->>'recipient'::text,
    'buyer', NEW.data->>'buyer'::text,
    'tickets_purchased_total_bps', NEW.data->>'tickets_purchased_total_bps'::text,
    'tx_hash', (NEW.data->>'tx_hash'),
    'block_num', NEW.data->>'block_num'::text
   );

  INSERT INTO activity(
    event_name,
    event_id,
    from_user_id,
    data
  )
  VALUES (
    'temporal_send_pot_user_ticket_purchases',
    NEW.workflow_id,
    NEW.user_id,
    _data
  )
  ON CONFLICT (event_name, event_id)
  DO UPDATE SET
    data = EXCLUDED.data;
  RETURN NEW;
END;
$$;

CREATE TRIGGER temporal_send_pot_user_ticket_purchases_trigger_after_upsert
  AFTER INSERT OR UPDATE ON temporal.send_pot_user_ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION temporal.temporal_transfer_after_upsert();

CREATE OR REPLACE FUNCTION temporal.temporal_send_pot_user_ticket_purchases_trigger_delete_activity()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
BEGIN
    DELETE FROM activity
    WHERE event_name = 'temporal_send_pot_user_ticket_purchases'
      AND event_id = OLD.workflow_id;
    RETURN OLD;
END;
$$;

CREATE TRIGGER temporal_send_pot_user_ticket_purchases_trigger_delete_activity
  BEFORE DELETE ON temporal.send_pot_user_ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION temporal.temporal_send_pot_user_ticket_purchases_trigger_delete_activity();

-- When a send_pot_user_ticket_purchasesis inserted, delete older temporal_send_pot_user_ticket_purchases
-- We know they are indexed if its inserting newer blocks.
-- This prevents duplicate activities once a purchase is completed.
-- keep failed so we can show it to the user, we can garbage collect later
create or replace function send_pot_user_ticket_purchases_delete_temporal_activity() returns trigger
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
    from temporal.send_pot_user_ticket_purchases temporal_purchases
    where temporal_purchases.created_at_block_num <= NEW.block_num
    and temporal_purchases.status != 'failed';

    -- Only proceed with deletions if we have workflow IDs
    if workflow_ids is not null and array_length(workflow_ids, 1) > 0 then
        -- Delete from activity table
        delete from public.activity a
        where a.event_name = 'temporal_send_pot_user_ticket_purchases'
        and a.event_id = any(workflow_ids);
    end if;

    return NEW;
end;
$$;

CREATE TRIGGER temporal_send_pot_user_ticket_purchases_trigger_delete_temporal_activity
  BEFORE INSERT ON public.send_pot_user_ticket_purchases
  FOR EACH ROW
  EXECUTE FUNCTION send_pot_user_ticket_purchases_delete_temporal_activity();