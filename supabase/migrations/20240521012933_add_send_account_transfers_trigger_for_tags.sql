create or replace function send_account_transfers_trigger_insert_activity() returns trigger
language plpgsql
security definer as
$$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data jsonb;
begin
    -- select send app info for from address
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.f, 'hex'))::citext;
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.t, 'hex'))::citext;

    -- cast v to text to avoid losing precision when converting to json when sending to clients
    _data := json_build_object(
        'log_addr', NEW.log_addr, 
        'f', NEW.f, 
        't', NEW.t, 
        'v', NEW.v::text, 
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_transfers',
            NEW.event_id,
            _f_user_id,
            _t_user_id,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = _t_user_id,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$$;

create trigger send_account_transfers_trigger_insert_activity
after insert
on send_account_transfers
for each row
execute function send_account_transfers_trigger_insert_activity();

create or replace function send_account_transfers_trigger_delete_activity() returns trigger
language plpgsql
security definer as
$$
begin
    delete 
    from activity 
    where event_id = OLD.event_id
        and event_name = 'send_account_transfers';
    return OLD;
end;
$$;

create trigger send_account_transfers_trigger_delete_activity
after delete
on send_account_transfers
for each row
execute function send_account_transfers_trigger_delete_activity();
