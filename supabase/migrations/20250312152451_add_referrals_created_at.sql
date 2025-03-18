-- add created_at to referrals so we can sort when a user was first referred and by whom
alter table referrals
  add column created_at timestamp with time zone default now();

-- infer created_at from receipts
UPDATE referrals refs
SET created_at = t.created_at
from tags t join refs on refs.tag = t.name;

alter table referrals
  alter column created_at set not null;
