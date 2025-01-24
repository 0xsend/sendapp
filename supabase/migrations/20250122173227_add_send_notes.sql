create table "public"."send_notes"
(
    "id"      serial primary key,
    "tx_hash" bytea not null,
    "f"       bytea not null,
    "t"       bytea not null,
    "note"    text  not null
);

alter table "public"."send_notes" enable row level security;

create policy "Users can see their own notes" on "public"."send_notes" for
select using (auth.uid() in (
    select user_id
    from chain_addresses
    where "address" = lower (concat('0x', encode(send_notes.f, 'hex')))::citext
    or "address" = lower (concat('0x', encode(send_notes.t, 'hex')))::citext));

create index send_notes_tx_hash on "public"."send_notes" using btree(tx_hash);

create index send_notes_f on "public"."send_notes" using btree(f);

create index send_notes_t on "public"."send_notes" using btree(t);

create or replace function send_notes_trigger_update_activity() returns trigger
language plpgsql
security definer as
$$
declare
    _f_user_id uuid;
    _t_user_id uuid;
    _tx_hash citext;
    _data jsonb;
begin
select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.f, 'hex'))::citext;
select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.t, 'hex'))::citext;
_tx_hash := concat('\x', encode(NEW.tx_hash, 'hex'))::citext;

select data into _data
from "public"."activity"
where
    from_user_id = _f_user_id and
    to_user_id = _t_user_id and
    data ->> 'tx_hash' = _tx_hash;

_data := jsonb_set(_data, ARRAY['note'], to_jsonb(NEW.note), true);

update "public"."activity"
set data = _data
where
    from_user_id = _f_user_id and
    to_user_id = _t_user_id and
    data ->> 'tx_hash' = _tx_hash;

return NEW;
end;
$$;

create or replace trigger send_notes_trigger_update_activity
    after insert
    on "public"."send_notes"
    for each row
    execute function send_notes_trigger_update_activity();
