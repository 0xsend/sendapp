-- IMPORTANT: THIS FILE WAS CREATED WHEN WE INITIALLY LAUNCHED DECLARATIVE SCHEMAS. FOR SOME REASON THESE CHANGES WERE DETECTED. PLEASE DOUBLE-CHECK YOUR MIGRATIONS WHEN MODIFYING ONE OF THESE DATBASE OBJECTS.

-- set check_function_bodies = off;

-- CREATE OR REPLACE FUNCTION private.filter_send_account_transfers_with_no_send_account_created()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SECURITY DEFINER
-- AS $function$
-- begin
-- -- Deletes send_account_transfers with no send_account_created.
-- -- This is due to performance issues in our shovel indexer and using filter_ref to limit indexing to only
-- -- send_account_transfers with send_account_created.
-- -- For now, we index all USDC and SEND token transfers, and use this function filter any send_account_transfers with no send_account_created.
-- -- See https://github.com/orgs/indexsupply/discussions/268
--   if exists ( select 1 from send_account_created where account = new.f )
--     or exists ( select 1 from send_account_created where account = new.t )
--   then
--     return new;
--   else
--     return null;
--   end if;
-- end;
-- $function$
-- ;


-- alter extension "supabase-dbdev" update to '0.0.3';

-- set check_function_bodies = off;

-- CREATE OR REPLACE FUNCTION public.insert_challenge()
--  RETURNS challenges
--  LANGUAGE plpgsql
-- AS $function$
--     #variable_conflict use_column
--     declare
--             _created timestamptz := current_timestamp;
--             _expires timestamptz := _created + interval '15 minute';
--             _new_challenge challenges;
--     begin
--         INSERT INTO "public"."challenges"
--         (created_at, expires_at)
--         VALUES (_created, _expires)
--         RETURNING * into _new_challenge;

--         return _new_challenge;
--     end
-- $function$
-- ;

-- CREATE OR REPLACE FUNCTION public.send_account_receives_insert_activity_trigger()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SECURITY DEFINER
-- AS $function$
-- declare
--     _f_user_id uuid;
--     _t_user_id uuid;
--     _data      jsonb;
-- begin
--     -- select send_account_receives.event_id into _f_user_id;
--     select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.sender, 'hex'))::citext;
--     select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.log_addr, 'hex'))::citext;

--     _data := jsonb_build_object(
--         'log_addr', NEW.log_addr,
--         'sender', NEW.sender,
--         -- cast value to text to avoid losing precision when converting to json when sending to clients
--         'value', NEW.value::text,
--         'tx_hash', NEW.tx_hash,
--         'block_num', NEW.block_num::text,
--         'tx_idx', NEW.tx_idx::text,
--         'log_idx', NEW.log_idx::text
--     );

--     insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
--     values ('send_account_receives',
--             NEW.event_id,
--             _f_user_id,
--             _t_user_id,
--             _data,
--             to_timestamp(NEW.block_time) at time zone 'UTC')
--     on conflict (event_name, event_id) do update set
--         from_user_id = _f_user_id,
--         to_user_id = _t_user_id,
--         data = _data,
--         created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

--     return NEW;
-- end;
-- $function$
-- ;

-- CREATE OR REPLACE FUNCTION public.send_account_signing_key_added_trigger_insert_activity()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SECURITY DEFINER
-- AS $function$
-- declare
--     _f_user_id uuid;
--     _data      jsonb;
-- begin
--     select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

--     select json_build_object(
--         'log_addr', NEW.log_addr,
--         'account', NEW.account,
--         'key_slot', NEW.key_slot,
--         'key',json_agg(key order by abi_idx),
--         'tx_hash', NEW.tx_hash,
--         'block_num', NEW.block_num::text,
--         'tx_idx', NEW.tx_idx::text,
--         'log_idx', NEW.log_idx::text
--     )
--     from send_account_signing_key_added
--     where src_name = NEW.src_name
--       and ig_name = NEW.ig_name
--       and block_num = NEW.block_num
--       and tx_idx = NEW.tx_idx
--       and log_idx = NEW.log_idx
--     group by ig_name, src_name, block_num, tx_idx, log_idx
--     into _data;

--     insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
--     values ('send_account_signing_key_added',
--             NEW.event_id,
--             _f_user_id,
--             null,
--             _data,
--             to_timestamp(NEW.block_time) at time zone 'UTC')
--     on conflict (event_name, event_id) do update set
--         from_user_id = _f_user_id,
--         to_user_id = null,
--         data = _data,
--         created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

--     return NEW;
-- end;
-- $function$
-- ;

-- CREATE OR REPLACE FUNCTION public.send_account_signing_key_removed_trigger_insert_activity()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SECURITY DEFINER
-- AS $function$
-- declare
--     _f_user_id uuid;
--     _data      jsonb;
-- begin
--     select user_id from send_accounts where address = concat('0x', encode(NEW.account, 'hex'))::citext into _f_user_id;

--     select json_build_object(
--         'log_addr',
--         NEW.log_addr,
--         'account', NEW.account,
--         'key_slot', NEW.key_slot,
--         'key', json_agg(key order by abi_idx),
--         'tx_hash', NEW.tx_hash,
--         'block_num', NEW.block_num::text,
--         'tx_idx', NEW.tx_idx::text,
--         'log_idx', NEW.log_idx::text
--     )
--     from send_account_signing_key_removed
--     where src_name = NEW.src_name
--       and ig_name = NEW.ig_name
--       and block_num = NEW.block_num
--       and tx_idx = NEW.tx_idx
--       and log_idx = NEW.log_idx
--     group by ig_name, src_name, block_num, tx_idx, log_idx
--     into _data;

--     insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
--     values ('send_account_signing_key_removed',
--             NEW.event_id,
--             _f_user_id,
--             null,
--             _data,
--             to_timestamp(NEW.block_time) at time zone 'UTC')
--     on conflict (event_name, event_id) do update set from_user_id = _f_user_id,
--                                                      to_user_id   = null,
--                                                      data         = _data,
--                                                      created_at   = to_timestamp(NEW.block_time) at time zone 'UTC';

--     return NEW;
-- end;
-- $function$
-- ;

-- CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_delete_activity()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SECURITY DEFINER
-- AS $function$
-- begin
--     delete
--     from activity
--     where event_id = OLD.event_id
--         and event_name = 'send_account_transfers';
--     return OLD;
-- end;
-- $function$
-- ;

-- CREATE OR REPLACE FUNCTION public.send_account_transfers_trigger_insert_activity()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SECURITY DEFINER
-- AS $function$
-- declare
--     _f_user_id uuid;
--     _t_user_id uuid;
--     _data jsonb;
-- begin
--     -- select send app info for from address
--     select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.f, 'hex'))::citext;
--     select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.t, 'hex'))::citext;

--     -- cast v to text to avoid losing precision when converting to json when sending to clients
--     _data := json_build_object(
--         'log_addr', NEW.log_addr,
--         'f', NEW.f,
--         't', NEW.t,
--         'v', NEW.v::text,
--         'tx_hash', NEW.tx_hash,
--         'block_num', NEW.block_num::text,
--         'tx_idx', NEW.tx_idx::text,
--         'log_idx', NEW.log_idx::text
--     );

--     insert into activity (event_name, event_id, from_user_id, to_user_id, data, created_at)
--     values ('send_account_transfers',
--             NEW.event_id,
--             _f_user_id,
--             _t_user_id,
--             _data,
--             to_timestamp(NEW.block_time) at time zone 'UTC')
--     on conflict (event_name, event_id) do update set
--         from_user_id = _f_user_id,
--         to_user_id = _t_user_id,
--         data = _data,
--         created_at = to_timestamp(NEW.block_time) at time zone 'UTC';

--     return NEW;
-- end;
-- $function$
-- ;

-- CREATE OR REPLACE FUNCTION public.stop_change_send_id()
--  RETURNS trigger
--  LANGUAGE plpgsql
--  SECURITY DEFINER
--  SET search_path TO 'public'
-- AS $function$ BEGIN

--   IF OLD.send_id <> NEW.send_id THEN
--     RAISE EXCEPTION 'send_id cannot be changed';
--   END IF;
--   RETURN NEW;
-- END;
-- $function$
-- ;


-- revoke delete on table "temporal"."send_account_transfers" from "anon";

-- revoke insert on table "temporal"."send_account_transfers" from "anon";

-- revoke references on table "temporal"."send_account_transfers" from "anon";

-- revoke select on table "temporal"."send_account_transfers" from "anon";

-- revoke trigger on table "temporal"."send_account_transfers" from "anon";

-- revoke truncate on table "temporal"."send_account_transfers" from "anon";

-- revoke update on table "temporal"."send_account_transfers" from "anon";

-- revoke delete on table "temporal"."send_account_transfers" from "authenticated";

-- revoke insert on table "temporal"."send_account_transfers" from "authenticated";

-- revoke references on table "temporal"."send_account_transfers" from "authenticated";

-- revoke trigger on table "temporal"."send_account_transfers" from "authenticated";

-- revoke truncate on table "temporal"."send_account_transfers" from "authenticated";

-- revoke update on table "temporal"."send_account_transfers" from "authenticated";

-- revoke delete on table "temporal"."send_earn_deposits" from "anon";

-- revoke insert on table "temporal"."send_earn_deposits" from "anon";

-- revoke references on table "temporal"."send_earn_deposits" from "anon";

-- revoke select on table "temporal"."send_earn_deposits" from "anon";

-- revoke trigger on table "temporal"."send_earn_deposits" from "anon";

-- revoke truncate on table "temporal"."send_earn_deposits" from "anon";

-- revoke update on table "temporal"."send_earn_deposits" from "anon";

-- revoke delete on table "temporal"."send_earn_deposits" from "authenticated";

-- revoke insert on table "temporal"."send_earn_deposits" from "authenticated";

-- revoke references on table "temporal"."send_earn_deposits" from "authenticated";

-- revoke select on table "temporal"."send_earn_deposits" from "authenticated";

-- revoke trigger on table "temporal"."send_earn_deposits" from "authenticated";

-- revoke truncate on table "temporal"."send_earn_deposits" from "authenticated";

-- revoke update on table "temporal"."send_earn_deposits" from "authenticated";


