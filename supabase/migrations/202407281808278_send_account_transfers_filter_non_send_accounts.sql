set check_function_bodies = off;

-- create trigger function for filtering send_account_transfers with no send_account_created
create or replace function private.filter_send_account_transfers_with_no_send_account_created()
 returns trigger
 language plpgsql
 security definer
 as $$
begin
-- Deletes send_account_transfers with no send_account_created.
-- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- send_account_transfers with send_account_created.
-- For now, we index all USDC and SEND token transfers, and use this function filter any send_account_transfers with no send_account_created.
-- See https://github.com/orgs/indexsupply/discussions/268
  if exists ( select 1 from send_account_created where account = new.f )
    or exists ( select 1 from send_account_created where account = new.t )
  then
    return new;
  else
    return null;
  end if;
end;
$$;

-- create trigger on send_account_transfers table
create trigger filter_send_account_transfers_with_no_send_account_created
before insert on public.send_account_transfers
for each row
execute function private.filter_send_account_transfers_with_no_send_account_created();
