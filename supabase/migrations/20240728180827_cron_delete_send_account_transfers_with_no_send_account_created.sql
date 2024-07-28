set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.delete_send_account_transfers_with_no_send_account_created()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
-- Deletes send_account_transfers with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_account_transfers with send_account_created.
-- For now, we index all USDC and SEND token transfers, and use this function cron job to delete the rest.
-- See https://github.com/orgs/indexsupply/discussions/268
declare
    batch_size    INT := 10000; -- Number of records to delete in each batch
    affected      INT;
    total_deleted INT := 0;
    start_time    TIMESTAMP;
    end_time      TIMESTAMP;
begin
    start_time := clock_timestamp();
    raise notice 'Starting delete_send_account_transfers_with_no_send_account_created %s', start_time;
    loop
        -- Delete a batch of records
        with batch as ( select sat.id
                        from send_account_transfers sat
                        where not exists ( select 1 from send_account_created where account = sat.f )
                          and not exists ( select 1 from send_account_created where account = sat.t )
                        order by sat.id
                        limit batch_size for update skip locked )
        delete
        from send_account_transfers
        where id in ( select id from batch );

        get diagnostics affected = row_count;
        total_deleted := total_deleted + affected;

        raise notice 'Deleted % records. Total deleted so far: %', affected, total_deleted;

        exit when affected = 0; -- Exit loop when no more records to delete

        commit;
        -- Commit each batch

        -- Optional: Add a small delay to reduce database load
        perform pg_sleep(0.1); -- Sleep for 100 milliseconds
    end loop;

    end_time := clock_timestamp();
    raise notice 'Total records deleted: %. Time taken: % seconds', total_deleted, extract(epoch from (end_time - start_time));
end
$function$
;

-- schedule the function to run every 5 minutes
select cron.schedule('delete-send-account-transfers-with-no-send-account-created', '*/5 * * * *', 'SELECT private.delete_send_account_transfers_with_no_send_account_created()');
