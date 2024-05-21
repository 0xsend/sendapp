create or replace function send_account_signing_key_removed_trigger_insert_activity() returns trigger
    language plpgsql
    security definer as
$$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object('log_addr', NEW.log_addr, 'account', NEW.account, 'key_slot', NEW.key_slot, 'key',
                             json_agg(key order by abi_idx), 'tx_hash', NEW.tx_hash)
    from send_account_signing_key_removed
    where src_name = NEW.src_name
      and ig_name = NEW.ig_name
      and block_num = NEW.block_num
      and tx_idx = NEW.tx_idx
      and log_idx = NEW.log_idx
    group by ig_name, src_name, block_num, tx_idx, log_idx
    into _data;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_signing_key_removed',
            NEW.event_id,
            _f_user_id,
            null,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set from_user_id = _f_user_id,
                                                     to_user_id   = null,
                                                     data         = _data,
                                                     created_at   = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$$;

create trigger send_account_signing_key_removed_trigger_insert_activity
    after insert
    on send_account_signing_key_removed
    for each row
execute function send_account_signing_key_removed_trigger_insert_activity();

create or replace function send_account_signing_key_removed_trigger_delete_activity() returns trigger
    language plpgsql
    security definer as
$$
begin
    delete from activity where event_id = OLD.event_id and event_name = 'send_account_signing_key_removed';
    return OLD;
end;
$$;

create trigger send_account_signing_key_removed_trigger_delete_activity
    after delete
    on send_account_signing_key_removed
    for each row
execute function send_account_signing_key_removed_trigger_delete_activity();
