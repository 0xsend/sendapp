alter table "public"."tags" drop constraint "tags_name_check";

alter table "public"."tags" add constraint "tags_name_check" CHECK (((length((name)::text) >= 1) AND (length((name)::text) <= 20) AND (name ~ '^[A-Za-z0-9_]+$'::citext))) not valid;

alter table "public"."tags" validate constraint "tags_name_check";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.insert_challenge()
 RETURNS challenges
 LANGUAGE plpgsql
AS $function$
    #variable_conflict use_column
    declare
            _created timestamptz := current_timestamp;
            _expires timestamptz := _created + interval '15 minute';
            _new_challenge challenges;
    begin
        INSERT INTO "public"."challenges"
        (created_at, expires_at)
        VALUES (_created, _expires)
        RETURNING * into _new_challenge;

        return _new_challenge;
    end
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_receives_insert_activity_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _data      jsonb;
begin
    -- select send_account_receives.event_id into _f_user_id;
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.sender, 'hex'))::citext;
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.log_addr, 'hex'))::citext;

    _data := jsonb_build_object(
        'log_addr', NEW.log_addr,
        'sender', NEW.sender,
        -- cast value to text to avoid losing precision when converting to json when sending to clients
        'value', NEW.value::text,
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    );

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_receives',
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
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_signing_key_added_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object(
        'log_addr', NEW.log_addr,
        'account', NEW.account,
        'key_slot', NEW.key_slot,
        'key',json_agg(key order by abi_idx),
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    )
    from send_account_signing_key_added
    where src_name = NEW.src_name
      and ig_name = NEW.ig_name
      and block_num = NEW.block_num
      and tx_idx = NEW.tx_idx
      and log_idx = NEW.log_idx
    group by ig_name, src_name, block_num, tx_idx, log_idx
    into _data;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
    values ('send_account_signing_key_added',
            NEW.event_id,
            _f_user_id,
            null,
            _data,
            to_timestamp(NEW.block_time) at time zone 'UTC')
    on conflict (event_name, event_id) do update set
        from_user_id = _f_user_id,
        to_user_id = null,
        data = _data,
        created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

    return NEW;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_signing_key_removed_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
declare
    _f_user_id uuid;
    _data      jsonb;
begin
    select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

    select json_build_object(
        'log_addr',
        NEW.log_addr,
        'account', NEW.account,
        'key_slot', NEW.key_slot,
        'key', json_agg(key order by abi_idx),
        'tx_hash', NEW.tx_hash,
        'block_num', NEW.block_num::text,
        'tx_idx', NEW.tx_idx::text,
        'log_idx', NEW.log_idx::text
    )
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
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_delete_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
    delete
    from activity
    where event_id = OLD.event_id
        and event_name = 'send_account_transfers';
    return OLD;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_insert_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;
grant delete on table "temporal"."send_account_transfers" to "anon";

grant insert on table "temporal"."send_account_transfers" to "anon";

grant references on table "temporal"."send_account_transfers" to "anon";

grant select on table "temporal"."send_account_transfers" to "anon";

grant trigger on table "temporal"."send_account_transfers" to "anon";

grant truncate on table "temporal"."send_account_transfers" to "anon";

grant update on table "temporal"."send_account_transfers" to "anon";

grant delete on table "temporal"."send_account_transfers" to "authenticated";

grant insert on table "temporal"."send_account_transfers" to "authenticated";

grant references on table "temporal"."send_account_transfers" to "authenticated";

grant trigger on table "temporal"."send_account_transfers" to "authenticated";

grant truncate on table "temporal"."send_account_transfers" to "authenticated";

grant update on table "temporal"."send_account_transfers" to "authenticated";

grant delete on table "temporal"."send_earn_deposits" to "anon";

grant insert on table "temporal"."send_earn_deposits" to "anon";

grant references on table "temporal"."send_earn_deposits" to "anon";

grant select on table "temporal"."send_earn_deposits" to "anon";

grant trigger on table "temporal"."send_earn_deposits" to "anon";

grant truncate on table "temporal"."send_earn_deposits" to "anon";

grant update on table "temporal"."send_earn_deposits" to "anon";

grant delete on table "temporal"."send_earn_deposits" to "authenticated";

grant insert on table "temporal"."send_earn_deposits" to "authenticated";

grant references on table "temporal"."send_earn_deposits" to "authenticated";

grant select on table "temporal"."send_earn_deposits" to "authenticated";

grant trigger on table "temporal"."send_earn_deposits" to "authenticated";

grant truncate on table "temporal"."send_earn_deposits" to "authenticated";

grant update on table "temporal"."send_earn_deposits" to "authenticated";
