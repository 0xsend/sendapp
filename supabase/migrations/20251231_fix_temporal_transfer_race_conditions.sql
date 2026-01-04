-- Fix race conditions in temporal transfer workflow
--
-- This migration addresses two critical race conditions:
-- 1. Notes disappearing when blockchain indexer runs before workflow completes
-- 2. Duplicate activities appearing in the UI for the same transfer
--
-- Solution:
-- - Add activity_id column to temporal.send_account_transfers with FK to public.activity
-- - Create trigger to insert pending activity when status='sent'
-- - Update temporal trigger to propagate notes and delete by activity_id
-- - Fix indexer trigger to delete pending activities by activity_id with enhanced matching
--
-- Test plan:
-- 1. Temporal workflow creates transfer with status='sent'
--    Expected: Pending activity created with note, activity_id set
-- 2. Blockchain indexer processes transfer (race condition scenario)
--    Expected: Pending activity deleted by activity_id, indexed activity created
-- 3. Workflow reaches status='confirmed'
--    Expected: Note propagated to indexed activity, only one activity in UI
-- 4. Verify no duplicate activities appear at any point

-- Phase 1: Add activity_id column to temporal.send_account_transfers
ALTER TABLE temporal.send_account_transfers
ADD COLUMN activity_id BIGINT;

-- Add foreign key constraint to public.activity with CASCADE delete
ALTER TABLE temporal.send_account_transfers
ADD CONSTRAINT fk_transfer_activity
FOREIGN KEY (activity_id) REFERENCES public.activity(id) ON DELETE CASCADE;

-- Create index for efficient queries on activity_id
CREATE INDEX idx_temporal_send_account_transfers_activity_id
ON temporal.send_account_transfers USING btree (activity_id);

-- Add comment for documentation
COMMENT ON COLUMN temporal.send_account_transfers.activity_id IS 'References pending activity created when status=sent, deleted by indexer trigger';

-- Phase 2: Create function to insert pending activity when status becomes 'sent'
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

  -- For UPDATE operations, check if status changed to 'sent' (wasn't 'sent' before)
  -- This prevents duplicate activity creation on subsequent updates
  IF TG_OP = 'UPDATE' AND OLD.status = 'sent' THEN
    RETURN NULL;
  END IF;

  -- Skip if activity already exists for this workflow
  IF NEW.activity_id IS NOT NULL THEN
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
-- Activity is created when status becomes 'sent', which can happen via INSERT or UPDATE
CREATE TRIGGER "aaa_temporal_transfer_insert_pending_activity" 
AFTER INSERT OR UPDATE ON "temporal"."send_account_transfers" 
FOR EACH ROW 
EXECUTE FUNCTION "temporal"."temporal_transfer_insert_pending_activity"();

-- Grant permissions
REVOKE ALL ON FUNCTION "temporal"."temporal_transfer_insert_pending_activity"() FROM PUBLIC;
GRANT ALL ON FUNCTION "temporal"."temporal_transfer_insert_pending_activity"() TO "service_role";

-- Phase 3: Update temporal_transfer_after_upsert to handle note propagation and cleanup
-- This function now ONLY handles cleanup when status='confirmed'
-- The new temporal_transfer_insert_pending_activity trigger handles pending activity creation
CREATE OR REPLACE FUNCTION temporal.temporal_transfer_after_upsert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    -- Only process when status is 'confirmed'
    IF NEW.status != 'confirmed' THEN
        RETURN NEW;
    END IF;

    -- When confirmed, update the indexed activity with note if it exists
    IF EXISTS (
        SELECT 1 FROM public.activity a
        WHERE event_name = NEW.send_account_transfers_activity_event_name
        AND event_id = NEW.send_account_transfers_activity_event_id
    ) THEN
        -- Add note to indexed activity if present
        IF NEW.data ? 'note' THEN
            UPDATE public.activity a
            SET data = a.data || jsonb_build_object('note', NEW.data->>'note')
            WHERE event_name = NEW.send_account_transfers_activity_event_name
            AND event_id = NEW.send_account_transfers_activity_event_id;
        END IF;

        -- Delete the temporal pending activity now that transfer is confirmed and indexed
        IF NEW.activity_id IS NOT NULL THEN
            DELETE FROM public.activity
            WHERE id = NEW.activity_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$function$;

-- Phase 4: Fix indexer trigger to delete pending activities by activity_id
-- This completes the race condition fix by ensuring pending temporal activities
-- are deleted immediately when the blockchain transfer is indexed
CREATE OR REPLACE FUNCTION public.send_account_transfers_delete_temporal_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    ignored_addresses bytea[] := ARRAY['\xb1b01dc21a6537af7f9a46c76276b14fd7ceac67'::bytea, '\x592e1224d203be4214b15e205f6081fbbacfcd2d'::bytea, '\x36f43082d01df4801af2d95aeed1a0200c5510ae'::bytea];
begin
    -- Check if it's from or to any ignored address (e.g., paymaster)
    if (NEW.f is not null and NEW.f = ANY (ignored_addresses)) or
       (NEW.t is not null and NEW.t = ANY (ignored_addresses)) then
        return NEW;
    end if;
    
    -- Delete pending temporal activities by activity_id (direct FK reference)
    -- Match the specific temporal transfer by user_op_hash or addresses+value
    delete from public.activity
    where id IN (
        SELECT activity_id
        FROM temporal.send_account_transfers
        WHERE activity_id IS NOT NULL
          AND created_at_block_num <= NEW.block_num
          AND status IN ('initialized', 'submitted', 'sent')
          AND (
            -- Match by user_op_hash (most reliable - exact tx match)
            (data ? 'user_op_hash' AND (data->>'user_op_hash')::bytea = NEW.tx_hash)
            OR
            -- Fallback: match by addresses + value (for cases without user_op_hash)
            (
              (
                (data ? 'f' AND (data->>'f')::bytea = NEW.f) 
                OR 
                (data ? 'sender' AND (data->>'sender')::bytea = NEW.f)
              )
              AND
              (
                (data ? 't' AND (data->>'t')::bytea = NEW.t)
                OR
                (data ? 'log_addr' AND (data->>'log_addr')::bytea = NEW.t)
              )
              AND
              (
                (data ? 'v' AND (data->>'v')::numeric = NEW.v)
                OR
                (data ? 'value' AND (data->>'value')::numeric = NEW.v)
              )
            )
          )
    );
    
    return NEW;
end;
$function$;
