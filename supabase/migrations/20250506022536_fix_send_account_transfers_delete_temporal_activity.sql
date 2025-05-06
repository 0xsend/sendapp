set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.send_account_transfers_delete_temporal_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    paymaster bytea = '\xb1b01dc21a6537af7f9a46c76276b14fd7ceac67'::bytea;
    workflow_ids text[];
begin
    -- Check if it's from or to paymaster
    if (NEW.f is not null and NEW.f = paymaster) or
       (NEW.t is not null and NEW.t = paymaster) then
        return NEW;
    end if;
    -- Only proceed with deletions if we have workflow IDs
    delete from public.activity a
    where a.event_name = 'temporal_send_account_transfers'
      and a.event_id in (select t_sat.workflow_id
                         from temporal.send_account_transfers t_sat
                         where t_sat.created_at_block_num <= NEW.block_num
                           and t_sat.status != 'failed');
    return NEW;
end;
$function$
;


