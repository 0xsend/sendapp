-- add created_at to referrals so we can sort when a user was first referred and by whom
alter table referrals
  add column created_at timestamp with time zone default now();

-- infer created_at from receipts
UPDATE referrals refs
SET created_at = r.created_at
FROM receipts r
JOIN tag_receipts tr ON coalesce(tr.hash, tr.event_id) = r.event_id
WHERE refs.referred_id = r.user_id
  AND refs.tag = tr.tag_name;

alter table referrals
  alter column created_at set not null;

-- view so users can find who referred them. this should run as security_invoker
-- since referrals has no RLS policies attached
create or replace view referrer with (security_barrier = ON) as
(
  with referrer as (
    select send_id
    from referrals r
    join profiles p on r.referrer_id = p.id
    where r.referred_id = (select auth.uid())
    order by created_at
    limit 1
  ),
  profile_lookup as (
    select *
    from profile_lookup(
      'sendid'::lookup_type_enum,
      (select send_id::text from referrer)
    ) as p join referrer on send_id is not null)
  select * from profile_lookup
);
