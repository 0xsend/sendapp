-- add created_at to referrals so we can sort when a user was first referred and by whom
alter table referrals
  add column created_at timestamp with time zone default now();

-- infer created_at from receipts
UPDATE referrals refs
SET created_at = r.created_at
FROM receipts r
JOIN tag_receipts tr ON tr.event_id = r.event_id
WHERE refs.referred_id = r.user_id
  AND refs.tag = tr.tag_name;

alter table referrals
  alter column created_at set not null;
