CREATE INDEX CONCURRENTLY ON temporal.send_account_transfers(workflow_id, created_at desc);
CREATE INDEX CONCURRENTLY ON temporal.send_account_transfers(workflow_id, updated_at desc);
CREATE INDEX CONCURRENTLY ON temporal.send_account_transfers(user_id, workflow_id);
CREATE INDEX CONCURRENTLY ON temporal.send_account_transfers(status, created_at_block_num desc);

-- When a send_account_transfer is inserted, delete older temporal_send_account_transfers
-- We know they are indexed if its inserting newer blocks.
-- This prevents duplicate activities once a transfer is completed.
-- keep failed so we can show it to the user, we can garbage collect later
create or replace function send_account_transfers_delete_temporal_activity() returns trigger
language plpgsql
security definer as
$$
declare
    workflow_ids text[];
begin
    -- First get the workflow IDs into an array
    select array_agg(t_sat.workflow_id)
    into workflow_ids
    from temporal.send_account_transfers t_sat
    where t_sat.created_at_block_num <= NEW.block_num
    and t_sat.status != 'failed';

    -- Only proceed with deletions if we have workflow IDs
    if workflow_ids is not null and array_length(workflow_ids, 1) > 0 then
        -- Delete from activity table
        delete from public.activity a
        where a.event_name = 'temporal_send_account_transfers'
        and a.event_id = any(workflow_ids);

        -- Delete from temporal.send_account_transfers
        delete from temporal.send_account_transfers
        where workflow_id = any(workflow_ids);
    end if;

    return NEW;
end;
$$;