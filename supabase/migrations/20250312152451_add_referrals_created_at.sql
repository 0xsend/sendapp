-- add created_at to referrals so we can sort when a user was first referred and by whom
alter table referrals
  add column created_at timestamp with time zone default now();

-- infer created_at from receipts
UPDATE referrals r
SET created_at = t.created_at
FROM tags t
WHERE r.tag = t.name;

alter table referrals
  alter column created_at set not null;
