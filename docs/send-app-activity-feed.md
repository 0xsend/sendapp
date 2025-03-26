
# Designing Send App Activity Feed - Unified Activity Table

Send app is p2p future cash app. The activity feed is a way to track user activity on the app, both onchain and offchain.

Activities such as registering a sendtag, sending some tokens, receiving tokens, etc. should be tracked in the activity feed.

The feed should be enriched with user profile information and sendtag information where possible.

## Unified Activity Table

A more generic table that can be used to capture all events, onchain and offchain, for the user. For example, there may be a user referral tracked inside the database that should show up in the activity table. The table should be generic enough to be used for any event that is emitted by the send account contract or to represent any other event that a user may want to track and see in their activity feed.

The view will be adapted so that it can be added to the activity table.

```sql
create table activity (
    id serial primary key,
    event_name text not null, -- the name of the event usually the integration or source table name
    event_id varchar(255) not null, -- the id of the event, usually the primary key of the integration or source table
    from_user_id uuid, -- the user that initiated the event (if applicable)
    to_user_id uuid, -- the user that received the event (if applicable)
    data jsonb -- the data associated with the event usually the parameters of the event
    created_at timestamp with time zone not null, -- the time the event occurred or block time
);

create index activity_user_id_event_name_idx on activity using btree (from_user_id, created_at, event_name);
create index activity_user_id_event_name_idx on activity using btree (to_user_id, created_at, event_name);
create unique index activity_event_name_event_id_idx on activity using btree (event_name, event_id);
```

Access to the activity table will be through a function that returns a table that includes joined data from profiles and tags. That way we can include the user's profile and sendtag name in the activity feed.

```sql

create or replace function activity_feed()
    returns table
            (
                id                      integer,
                created_at              timestamp with time zone, -- the time the event occurred
                event_name              text,                     -- the name of the event (usually the table name)
                event_id                text,                     -- the id of the event
                event_origin            text,                     -- the origin of the event or address of the contract that emitted the event
                from_user_id            uuid,                     -- the user that initiated the event (if applicable)
                from_profile_name       text,                     -- the from user's profile name
                from_profile_avatar_url text,                     -- the from user's profile avatar url
                from_send_id            integer,                  -- the from user's send id
                from_tags               text[],                   -- the from user's sendtag names
                from_user_tag_name      text,                     -- the from user's sendtag name
                to_user_id              uuid,                     -- the user that received the event (if applicable)
                to_profile_name         text,                     -- the to user's profile name
                to_profile_avatar_url   text,                     -- the to user's profile avatar url
                to_send_id              integer,                  -- the to user's send id
                to_tags                 text[],                   -- the to user's sendtag names
                to_user_tag_name        text,                     -- the to user's sendtag name
                data                    jsonb                     -- the data associated with the event
            )
    language plpgsql
    security definer
as
$$
begin
    return query
    select a.id,
        a.created_at,
        a.event_name,
        a.event_id,
        a.event_origin,
        a.from_user_id,
        case when a.from_user_id = from_p.id then from_p.name else null end                          as from_profile_name,
        case when a.from_user_id = from_p.id then from_p.avatar_url
                else null end                                                                           as from_profile_avatar_url,
        case when a.from_user_id = from_p.id then from_p.send_id else null end                       as from_send_id,
        case when a.from_user_id = from_p.id then array_remove(array_agg(from_t.name), null)
                else null end                                                                           as from_tags,
        a.to_user_id,
        case when a.to_user_id = to_p.id then to_p.name else null end                                as to_profile_name,
        case when a.to_user_id = to_p.id then to_p.avatar_url else null end                          as to_profile_avatar_url,
        case when a.to_user_id = to_p.id then to_p.send_id else null end                             as to_send_id,
        case when a.to_user_id = to_p.id then array_remove(array_agg(to_t.name), null)
                else null end                                                                           as to_tags,
        a.data
    from activity a
            left join profiles from_p on a.from_user_id = from_p.id
            left join send_accounts from_sa on from_p.id = from_sa.user_id
            left join tags from_t on from_p.id = from_t.user_id
            left join profiles to_p on a.to_user_id = to_p.id
            left join send_accounts to_sa on to_p.id = to_sa.user_id
            left join tags to_t on to_p.id = to_t.user_id


    group by a.id, a.created_at, a.event_name, a.event_id, a.event_origin, a.from_user_id, from_p.id,
            from_p.name, from_p.avatar_url, from_p.send_id, a.to_user_id, to_p.id, to_p.name,
            to_p.avatar_url, to_p.send_id, a.data;
end;
$$;
```

Then to popualte the activity table, we can use a trigger on the send_account_transfers table. Also, removing the activity row if the even is deleted due to a reorg.

For each activity, we just need to copy over the data from the "important" columns into the `activity.data` column. Allowing to pull all send account activity data from a single function call.

```sql

-- add function to send_account_transfers to include send app info
create or replace function send_account_transfers_trigger_insert_activity() returns trigger
    language plpgsql
    security definer as
$$
declare
    _f_user_id uuid;
    _t_user_id uuid;
begin
    -- select send app info for from address
    select user_id into _f_user_id from send_accounts where address = concat('0x', encode(NEW.f, 'hex'))::citext;
    select user_id into _t_user_id from send_accounts where address = concat('0x', encode(NEW.t, 'hex'))::citext;

    insert into activity (event_name, event_id, from_user_id, to_user_id, data)
    values ('send_account_transfers',
            NEW.id,
            _f_user_id,
            _t_user_id,
            json_build_object('from', NEW.f, 'to', NEW.t, 'value', NEW.v));

    return NEW;
end;
$$;

create trigger send_account_transfers_trigger_insert_activity
    before insert
    on send_account_transfers
    for each row
execute function send_account_transfers_trigger_insert_activity();

create or replace function send_account_transfers_trigger_delete_activity() returns trigger
    language plpgsql
    security definer as
$$
begin
    delete from activity where id = NEW.id and event_name = 'send_account_transfers';
    return OLD;
end;
$$;

create trigger send_account_transfers_trigger_delete_activity
    before delete
    on send_account_transfers
    for each row
execute function send_account_transfers_trigger_delete_activity();
```

## Testing

```sql
BEGIN;
SELECT plan(2);

-- Create the necessary extensions
CREATE EXTENSION "basejump-supabase_test_helpers";

-- Create a test user and authenticate as the user
SELECT tests.create_supabase_user('test_user_from');
SELECT tests.create_supabase_user('test_user_to');

INSERT INTO send_accounts (user_id, address, chain_id, init_code)
VALUES (tests.get_supabase_uid('test_user_from'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 1, '\\x00112233445566778899AABBCCDDEEFF'),
       (tests.get_supabase_uid('test_user_to'), '0xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA', 1, '\\x00112233445566778899AABBCCDDEEFF');

-- Insert a test row into send_account_transfers table
INSERT INTO send_account_transfers (f, t, v)
VALUES ('\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea, '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea, 100);

-- Test if the trigger function populated the additional columns correctly
SELECT results_eq(
    $$
        SELECT
          f,
          t,
          v,
          tests.get_supabase_uid('test_user_from'),
          tests.get_supabase_uid('test_user_to')
        FROM send_account_transfers
        WHERE f = '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea
          AND t = '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea
    $$,
    $$
        VALUES ('\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea, '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea, 100::numeric, tests.get_supabase_uid('test_user_from'), tests.get_supabase_uid('test_user_to'))
    $$,
    'Test if the trigger function populated the additional columns correctly'
);

DELETE FROM send_account_transfers
WHERE id = (
    SELECT id
    FROM send_account_transfers
    WHERE f = '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea AND t = '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea);

-- Test if the trigger function removes the activity row
SELECT is_empty(
    $$
        SELECT
          f,
          t,
          v,
          tests.get_supabase_uid('test_user_from'),
          tests.get_supabase_uid('test_user_to')
        FROM send_account_transfers
        WHERE f = '\x1234567890ABCDEF1234567890ABCDEF12345678'::bytea
          AND t = '\xB0B7D5E8A4B6D534B3F608E9D27871F85A4E98DA'::bytea
    $$,
    'Test if the trigger function removes the activity row'
);

SELECT * FROM finish();
ROLLBACK;
```
