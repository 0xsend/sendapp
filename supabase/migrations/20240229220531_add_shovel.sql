create schema if not exists "shovel";

create table "shovel"."ig_updates"(
    "name" text not null,
    "src_name" text not null,
    "backfill" boolean default false,
    "num" numeric not null,
    "latency" interval,
    "nrows" numeric,
    "stop" numeric
);

create table "shovel"."integrations"(
    "name" text,
    "conf" jsonb
);

create table "shovel"."sources"(
    "name" text,
    "chain_id" integer,
    "url" text
);

create table "shovel"."task_updates"(
    "num" numeric,
    "hash" bytea,
    "insert_at" timestamp with time zone default now(),
    "src_hash" bytea,
    "src_num" numeric,
    "nblocks" numeric,
    "nrows" numeric,
    "latency" interval,
    "src_name" text,
    "stop" numeric,
    "chain_id" integer,
    "ig_name" text
);

create unique index intg_name_src_name_backfill_num_idx on shovel.ig_updates using btree(name,
    src_name, backfill, num desc);

create unique index sources_name_chain_id_idx on shovel.sources using btree(name, chain_id);

create unique index sources_name_idx on shovel.sources using btree(name);

create unique index task_src_name_num_idx on shovel.task_updates using btree(ig_name, src_name, num desc);

create or replace view "shovel"."latest" as
WITH abs_latest as (
    select
        task_updates.src_name,
        max(task_updates.num) as num
    from
        shovel.task_updates
    group by
        task_updates.src_name
),
src_latest as (
    select
        task_updates.src_name,
        max(task_updates.num) as num
    from
        shovel.task_updates,
        abs_latest
    where ((task_updates.src_name = abs_latest.src_name)
        and ((abs_latest.num - task_updates.num) <=(10)::numeric))
group by
    task_updates.src_name,
    task_updates.ig_name
)
select
    src_latest.src_name,
    min(src_latest.num) as num
from
    src_latest
group by
    src_latest.src_name;

create or replace view "shovel"."source_updates" as select distinct on (task_updates.src_name)
    task_updates.src_name,
    task_updates.num,
    task_updates.hash,
    task_updates.src_num,
    task_updates.src_hash,
    task_updates.nblocks,
    task_updates.nrows,
    task_updates.latency
from
    shovel.task_updates
order by
    task_updates.src_name,
    task_updates.num desc;
