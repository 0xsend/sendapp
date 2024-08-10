-- send check created trigger function
create or replace function send_check_claimed_trigger_insert_activity() returns trigger
language plpgsql
security definer as
$$
declare
_f_user_id uuid;
_t_user_id uuid;
_data jsonb;
begin
    -- populate f_user_id with sender's user_id
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.from, 'hex'))::citext;
    
    -- populate t_user_id with receiver's user_id
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.reedeemer, 'hex'))::citext;
    
    _data := json_build_object(
        'log_addr', NEW.log_addr,
        'token', NEW.token,
        'amount', NEW.amount::text,
        'from', NEW.from,
        'reedeemer', NEW.redeemer,
        'tx_hash': NEW.tx_hash,
        'block_num': NEW.block_num::text,
        'tx_idx': NEW.tx_idx::text,
        'log_idx': NEW.log_idx::text,
    )
    
    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values (
        'send_check_claimed',
        NEW.event_id,
        _f_user_id,
        _t_user_id,
        _data,
        to_timestamp(NEW.block_time) at time zone 'UTC'
    )
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = _t_user_id,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';
    return NEW;
end;
$$;

-- send check claimed trigger
create trigger send_check_claimed_trigger_insert_activity
after insert
on send_check_claimed
for each row
execute function send_check_claimed_trigger_insert_activity();

-- send check claimed delete trigger function
create or replace function send_check_claimed_trigger_delete_activity() returns trigger
language plpgsql
security definer as
$$
begin
    delete 
    from activity 
    where event_id = OLD.event_id
        and event_name = 'send_check_claimed';
    return OLD;
end;
$$;

-- send check claimed delete trigger
-- deletes activity record when a send check claimed record is deleted
create trigger send_check_claimed_trigger_delete_activity
after delete
on send_check_claimed
for each row
execute function send_check_claimed_trigger_delete_activity();