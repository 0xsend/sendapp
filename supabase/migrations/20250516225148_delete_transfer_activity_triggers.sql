DROP TRIGGER IF EXISTS send_account_transfers_trigger_delete_temporal_activity ON public.send_account_transfers;

DROP FUNCTION IF EXISTS send_account_transfers_delete_temporal_activity;

DROP TRIGGER IF EXISTS send_account_transfers_trigger_insert_activity ON public.send_account_transfers;

DROP FUNCTION IF EXISTS send_account_transfers_trigger_insert_activity;

DROP TRIGGER IF EXISTS temporal_send_account_transfers_trigger_update_transfer_activity_after_delete ON public.activity;

DROP FUNCTION IF EXISTS update_send_account_transfers_event_after_activity_delete;

DROP TRIGGER IF EXISTS temporal_send_account_transfers_trigger_update_transfer_activity_before_insert ON public.activity;

DROP FUNCTION IF EXISTS update_transfer_activity_before_insert;

DROP TRIGGER IF EXISTS send_account_receives_insert_activity_trigger ON public.send_account_receives;

DROP FUNCTION IF EXISTS send_account_receives_insert_activity_trigger;

DROP TABLE IF EXISTS public.workflow_ids;

ALTER TABLE temporal.send_account_transfers
    ADD CONSTRAINT temporal_send_account_transfers_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users;

ALTER TABLE temporal.send_account_transfers
    ADD COLUMN nonce BIGINT NULL DEFAULT NULL;


CREATE UNIQUE INDEX unique_nonce_user_id_idx ON temporal.send_account_transfers (nonce,user_id) WHERE nonce IS NOT NULL;
CREATE UNIQUE INDEX temporal_send_account_transfers_user_id_nonce_status_idx ON temporal.send_account_transfers(user_id, nonce, status);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_temporal_activity_before_activity_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    -- Check if it's from or to paymaster
    if (NOT NEW.data ? 'workflow_id' OR NEW.event_name LIKE 'temporal_%') then
        return NEW;
    end if;
    -- Only proceed with deletions if we have a workflowId
    delete from public.activity a
    where a.event_name = 'temporal_send_account_transfers'
      and a.event_id = NEW.data->>'workflow_id';
    return NEW;
end;
$function$;

CREATE TRIGGER delete_temporal_activity_before_activity_insert
BEFORE INSERT on public.activity
FOR EACH ROW
EXECUTE FUNCTION public.delete_temporal_activity_before_activity_insert();
