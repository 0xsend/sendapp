-- New table for Send transfer logs
create table "public"."send_transfer_logs"
(
    "from"            citext                   not null check ( length("from") = 42 and "from" ~ '^0x[A-Fa-f0-9]{40}$' ),
    "to"              citext                   not null check ( length("to") = 42 and "to" ~ '^0x[A-Fa-f0-9]{40}$' ),
    "value"           bigint                   not null,
    "block_number"    bigint                   not null,
    "block_timestamp" timestamp with time zone not null,
    "block_hash"      citext                   not null check ( length(block_hash) = 66 and block_hash ~ '^0x[A-Fa-f0-9]{64}$' ),
    "tx_hash"         citext                   not null check ( length(tx_hash) = 66 and tx_hash ~ '^0x[A-Fa-f0-9]{64}$' ),
    "log_index"       bigint                   not null,
    "created_at"      timestamp with time zone default now()
);

-- Index by from
create index "send_transfer_logs_from_idx" on "public"."send_transfer_logs" ("from");

-- Index by to
create index "send_transfer_logs_to_idx" on "public"."send_transfer_logs" ("to");

-- Index by block_number
create index "send_transfer_logs_block_number_idx" on "public"."send_transfer_logs" ("block_number");

-- Index by block_timestamp
create index "send_transfer_logs_block_timestamp_idx" on "public"."send_transfer_logs" ("block_timestamp");

-- block_hash + tx_hash + log_index is unique
create unique index send_transfer_logs_pkey on public.send_transfer_logs using btree (block_hash, tx_hash, log_index);

alter table "public"."send_transfer_logs"
    add constraint "send_transfer_logs_pkey" primary key using index "send_transfer_logs_pkey";

-- Enable RLS on the materialized view
alter table "public"."send_transfer_logs"
    enable row level security;

-- Create policies to enable RLS
create policy "User can see own transfers" on send_transfer_logs for select using (auth.uid() in ( select user_id
                                                                                                   from chain_addresses
                                                                                                   where "address" = "from"
                                                                                                      or "address" = "to" ));

-- Create a function that accepts rows of send_transfer_logs and inserts them into the distribution_shares table deleting any existing rows with matching block_hash
create or replace function public.insert_send_transfer_logs(
    _send_transfer_logs public.send_transfer_logs[]
    ) returns void
    language plpgsql as
$$
begin -- Delete any existing rows with matching block_hash
    -- ensure send_transfer_logs is not null or empty
    if _send_transfer_logs is null or array_length(_send_transfer_logs, 1) is null then return; end if;

-- Delete any existing rows with matching block_number
    delete
    from public.send_transfer_logs
    where block_number in ( select distinct block_number from unnest(_send_transfer_logs) );

-- Insert the new rows
    insert into public.send_transfer_logs select * from unnest(_send_transfer_logs);

end;

$$;
