alter table public.profiles
  add column if not exists is_business boolean not null default false;
