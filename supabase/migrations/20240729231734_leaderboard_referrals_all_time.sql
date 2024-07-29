-- private leaderboard data for tracking user referral stats
create table private.leaderboard_referrals_all_time
(
    user_id      UUID primary key references auth.users (id) on delete cascade,
    referrals    INTEGER                  default 0,
    rewards_usdc NUMERIC                  default 0,
    updated_at   TIMESTAMP with time zone default now()
);

-- create indexes on the referral leaderboard table
create index leaderboard_referrals_all_time_referral_count_idx on private.leaderboard_referrals_all_time using btree (referrals desc);
create index leaderboard_referrals_all_time_total_reward_idx on private.leaderboard_referrals_all_time using btree (rewards_usdc desc);

-- Populate the referral leaderboard table with data from the referrals and sendtag_checkout_receipts tables
insert into private.leaderboard_referrals_all_time (user_id, referrals, rewards_usdc, updated_at)
select user_id, referrals, rewards_usdc, updated_at
from ( select p.id                         as user_id,
              coalesce(count(r.tag), 0)    as referrals,
              coalesce(sum(scr.reward), 0) as rewards_usdc,
              now()                        as updated_at
       from profiles p
                left join send_accounts sa on p.id = sa.user_id
                left join ( select referrer, sum(reward) as reward
                            from sendtag_checkout_receipts
                            group by referrer ) scr on decode(substr(sa.address, 3), 'hex') = scr.referrer
                left join referrals r on r.referrer_id = p.id
       where p.id not in ( select user_id from private.leaderboard_referrals_all_time )
       group by p.id
       having count(r.tag) > 0
           or sum(scr.reward) > 0 ) as tmp_leaderboard_referrals_all_time;

-- to keep the referral leaderboard up to date,
-- we will add two new triggers one on the referrals table and one on the sendtag_checkout_receipts table
create or replace function private.update_leaderboard_referrals_all_time_referrals() returns trigger
    language plpgsql
    security definer as
$$
declare
    _referrer_id uuid;
begin
    -- update the referral count for the user
    insert into private.leaderboard_referrals_all_time (user_id, referrals, updated_at)
    values (NEW.referrer_id, 1, now())
    on conflict (user_id) do update set referrals = private.leaderboard_referrals_all_time.referrals + 1,
                                        updated_at = now();
    return NEW;
end
$$;

create or replace function private.update_leaderboard_referrals_all_time_sendtag_checkout_receipts() returns trigger
    language plpgsql
    security definer as
$$
declare
    _referrer_id uuid;
begin
    select user_id into _referrer_id from public.send_accounts sa where decode(substring(sa.address, 3), 'hex') = NEW.referrer;
    if _referrer_id is not null then
        -- update the rewards_usdc for the user
        insert into private.leaderboard_referrals_all_time (user_id, rewards_usdc, updated_at)
        values (_referrer_id, NEW.reward, now())
        on conflict (user_id) do update set rewards_usdc = private.leaderboard_referrals_all_time.rewards_usdc + NEW.reward,
                                            updated_at   = now();
    end if;
    return NEW;
end;
$$;

-- add the triggers to the database
create trigger update_leaderboard_referrals_all_time_referrals
    after insert
    on public.referrals
    for each row
execute function private.update_leaderboard_referrals_all_time_referrals();

create trigger update_leaderboard_referrals_all_time_sendtag_checkout_receipts
    after insert
    on public.sendtag_checkout_receipts
    for each row
execute function private.update_leaderboard_referrals_all_time_sendtag_checkout_receipts();

-- create a function to display the referral leaderboard
create or replace function public.leaderboard_referrals_all_time()
    returns table (
                      rewards_usdc_rank bigint,
                      referrals_rank    bigint,
                      rewards_usdc      numeric,
                      referrals         integer,
                      "user"            activity_feed_user
                  )
    language plpgsql stable
    security definer
    set search_path = public
as
$$
begin
    return query select row_number() over (order by l.rewards_usdc desc) as rewards_usdc_rank,
                        row_number() over (order by l.referrals desc)    as referrals_rank,
                        l.rewards_usdc,
                        l.referrals,
                        (case when l.user_id = ( select auth.uid() ) then ( select auth.uid() ) end, -- user_id
                         p.name, -- name
                         p.avatar_url, -- avatar_url
                         p.send_id, -- send_id
                         ( select array_agg(name) from tags where user_id = p.id and status = 'confirmed' ) -- tags
                            )::activity_feed_user                      as "user"
                 from private.leaderboard_referrals_all_time l
                          join profiles p on p.id = user_id
                 where p.is_public = true;
end
$$ ;

revoke all on function leaderboard_referrals_all_time from public;
revoke all on function leaderboard_referrals_all_time from anon;
