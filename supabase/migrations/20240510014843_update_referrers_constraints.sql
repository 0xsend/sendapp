alter table public.referrals drop constraint referrals_referred_id_fkey;
alter table public.referrals drop constraint referrals_referrer_id_fkey;

alter table public.referrals add constraint referrals_referred_id_fkey
    foreign key (referred_id) references public.profiles on delete cascade;

alter table public.referrals add constraint referrals_referrer_id_fkey
    foreign key (referrer_id) references public.profiles on delete cascade;
