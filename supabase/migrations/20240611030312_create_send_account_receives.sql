create table "public"."send_account_receives" (
    id serial primary key,
    event_id text not null generated always as (
        ig_name
        || '/'
        || src_name
        || '/'
        || block_num::text
        || '/'
        || tx_idx::text
        || '/'
        || log_idx::text
    ) stored,
    chain_id numeric not null,
    block_num numeric not null,
    block_time numeric not null,
    tx_hash bytea not null,
    tx_idx numeric not null,
    log_idx numeric not null,
    log_addr bytea not null,
    sender bytea not null,
    value numeric not null,
    ig_name text not null,
    src_name text not null,
    abi_idx smallint not null
);

create unique index u_send_account_receives on public.send_account_receives using btree (
    ig_name, src_name, block_num, tx_idx, log_idx, abi_idx
);

create index i_send_account_receives_sender on public.send_account_receives using btree (sender);
create index i_send_account_receives_log_addr on public.send_account_receives using btree (
    log_addr
);

alter table public.send_account_receives enable row level security;

create policy
"users can see their own ETH receives" -- noqa: RF05
on "public"."send_account_receives" as permissive for
select
to public using (
    (
        (lower(concat('0x', encode(sender, 'hex'::text))))::citext in (
            select send_accounts.address
            from
                send_accounts
            where
                (
                    send_accounts.user_id = (
                        select auth.uid()
                    )
                )
        )
        or (lower(concat('0x', encode(log_addr, 'hex'::text))))::citext in (
            select send_accounts.address
            from
                send_accounts
            where
                (
                    send_accounts.user_id = (
                        select auth.uid()
                    )
                )
        )
    )
);

-- track activity for send accounts when they receive ETH
create or replace function send_account_receives_insert_activity_trigger() returns trigger
language plpgsql
security definer as
$$
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
$$;

create trigger send_account_receives_insert_activity_trigger
after insert
on send_account_receives
for each row
execute function send_account_receives_insert_activity_trigger();

create or replace function send_account_receives_delete_activity_trigger() returns trigger
language plpgsql
security definer as
$$
begin
    delete from activity where event_name = 'send_account_receives' and event_id = OLD.event_id;
    return OLD;
end;
$$;

create trigger send_account_receives_delete_activity_trigger
after delete
on send_account_receives
for each row
execute function send_account_receives_delete_activity_trigger();
