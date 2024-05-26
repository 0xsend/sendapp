create table activity (
    id serial primary key,
    event_name text not null, -- the name of the event usually the integration or source table name
    event_id varchar(255) not null, -- the id of the event, usually the primary key of the integration or source table (e.g. concat(NEW.ig_name, '/', NEW.src_name, '/', NEW.block_num, '/', NEW.tx_idx, '/', NEW.log_idx))
    from_user_id uuid references auth.users on delete cascade, -- the user that initiated the event (if applicable)
    to_user_id uuid references auth.users on delete cascade, -- the user that received the event (if applicable)
    data jsonb, -- the data associated with the event usually the parameters of the event
    created_at timestamp with time zone not null default current_timestamp -- the time the event occurred or block time
);

create index activity_from_user_id_event_name_idx on activity using btree (from_user_id, created_at, event_name);
create index activity_to_user_id_event_name_idx on activity using btree (to_user_id, created_at, event_name);
create unique index activity_event_name_event_id_idx on activity using btree (event_name, event_id);

-- use `activity_feed` function to get activity feed
alter table activity enable row level security;
