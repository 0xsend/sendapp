-- @todo create this shovel integration
-- select *
-- from send_account_receives;

alter table send_account_transfers
    add column f_tags jsonb,
    add column t_tags jsonb;

-- @todo include sendid and profile name
-- add function to send_account_transfers to include sendtag name
create or replace function send_account_transfers_trigger_add_tag_name() returns trigger
    language plpgsql
    security definer as
$$
declare
    _f_tag_names jsonb;
    _t_tag_names jsonb;
begin
    select json_agg(t.name) as f_tag_names
    from tags t
             join send_accounts sa on t.user_id = sa.user_id and
                                      (sa.address = concat('0x', encode(NEW.f, 'hex'))::citext)
    group by sa.address
    into _f_tag_names;
    select
        json_agg(t.name) as t_tag_names
    from tags t
             join send_accounts sa on t.user_id = sa.user_id and
                                      (sa.address = concat('0x', encode(NEW.t, 'hex'))::citext)
    group by sa.address
    into _t_tag_names;
    NEW.f_tags = _f_tag_names;
    NEW.t_tags = _t_tag_names;
    return NEW;
end;
$$;

create trigger send_account_transfers_trigger_add_tag_name
    before insert
    on send_account_transfers
    for each row
execute function send_account_transfers_trigger_add_tag_name();
