create table public.referrals (
  referrer_id uuid not null references public.profiles,
  referred_id uuid not null references public.profiles,
  tag citext not null references public.tags
);

alter table public.referrals enable row level security;

-- Verify that referrer_id is not the same as referred_id
alter table public.referrals
add constraint referrals_different_referrer_and_referred check (referrer_id <> referred_id);
