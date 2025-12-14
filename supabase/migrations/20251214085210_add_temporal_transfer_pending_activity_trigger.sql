-- Phase 2: Create temporal trigger for pending activity
-- This trigger creates a pending activity when status becomes 'sent',
-- matching the deposit workflow pattern.

CREATE OR REPLACE FUNCTION "temporal"."temporal_transfer_insert_pending_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  inserted_activity_id BIGINT;
  from_user_id UUID;
  to_user_id UUID;
  activity_data jsonb;
  from_address bytea;
  to_address bytea;
BEGIN
  -- Only create activity when status changes to 'sent'
  IF NEW.status != 'sent' THEN
    RETURN NULL;
  END IF;

  -- For token transfers, addresses are in 'f' and 't' fields
  -- For ETH transfers, addresses are in 'sender' and 'log_addr' fields
  IF NEW.data ? 't' THEN
    -- Token transfer
    from_address := (NEW.data->>'f')::bytea;
    to_address := (NEW.data->>'t')::bytea;
  ELSIF NEW.data ? 'log_addr' THEN
    -- ETH transfer
    from_address := (NEW.data->>'sender')::bytea;
    to_address := (NEW.data->>'log_addr')::bytea;
  ELSE
    -- No valid address data, skip activity creation
    RETURN NULL;
  END IF;

  -- Look up user IDs for from and to addresses
  SELECT user_id INTO from_user_id
  FROM public.send_accounts
  WHERE address = concat('0x', encode(from_address, 'hex'))::citext
  LIMIT 1;

  SELECT user_id INTO to_user_id
  FROM public.send_accounts
  WHERE address = concat('0x', encode(to_address, 'hex'))::citext
  LIMIT 1;

  -- Skip if we can't find the sender (from_user_id)
  IF from_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Build data object with workflow_id and transfer details
  activity_data := jsonb_build_object(
    'workflow_id', NEW.workflow_id,
    'status', NEW.status
  );

  -- Add transfer-specific fields from NEW.data
  IF NEW.data ? 'user_op_hash' THEN
    activity_data := activity_data || jsonb_build_object('user_op_hash', NEW.data->'user_op_hash');
  END IF;

  IF NEW.data ? 'note' THEN
    activity_data := activity_data || jsonb_build_object('note', NEW.data->>'note');
  END IF;

  -- Add token transfer fields
  IF NEW.data ? 't' THEN
    activity_data := activity_data || jsonb_build_object(
      'log_addr', NEW.data->>'log_addr',
      'f', NEW.data->>'f',
      't', NEW.data->>'t',
      'v', NEW.data->>'v'
    );
  -- Add ETH transfer fields
  ELSIF NEW.data ? 'log_addr' THEN
    activity_data := activity_data || jsonb_build_object(
      'sender', NEW.data->>'sender',
      'log_addr', NEW.data->>'log_addr',
      'value', NEW.data->>'value'
    );
  END IF;

  -- Insert into public.activity
  INSERT INTO public.activity (event_name, event_id, data, from_user_id, to_user_id)
  VALUES (
    'temporal_send_account_transfers',
    NEW.workflow_id,
    activity_data,
    from_user_id,
    to_user_id
  )
  RETURNING id INTO inserted_activity_id;

  -- Update the temporal.send_account_transfers row with the new activity_id
  UPDATE temporal.send_account_transfers
  SET activity_id = inserted_activity_id
  WHERE workflow_id = NEW.workflow_id;

  RETURN NULL; -- AFTER triggers should return NULL
END;
$$;

ALTER FUNCTION "temporal"."temporal_transfer_insert_pending_activity"() OWNER TO "postgres";

-- Create trigger to fire on INSERT OR UPDATE
CREATE OR REPLACE TRIGGER "aaa_temporal_transfer_insert_pending_activity" 
AFTER INSERT OR UPDATE ON "temporal"."send_account_transfers" 
FOR EACH ROW 
EXECUTE FUNCTION "temporal"."temporal_transfer_insert_pending_activity"();

-- Grant permissions
REVOKE ALL ON FUNCTION "temporal"."temporal_transfer_insert_pending_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_transfer_insert_pending_activity"() TO "service_role";
