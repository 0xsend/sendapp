create type "public"."verification_type" as enum ('tag_registration', 'tag_referral');

create table "public"."distributions" (
    "id" serial not null,
    "number" integer not null,
    "amount" bigint not null,
    "hodler_pool_bips" bigint not null,
    "bonus_pool_bips" bigint not null,
    "fixed_pool_bips" bigint not null,
    "name" text not null,
    "description" text,
    "qualification_start" timestamp with time zone not null,
    "qualification_end" timestamp with time zone not null,
    "claim_end" timestamp with time zone not null,
    "snapshot_id" bigint null,
    "hodler_min_balance" bigint not null,
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
);

alter table "public"."distributions" enable row level security;

create policy "Enable read access to public" on distributions for
select to authenticated using (true);

CREATE UNIQUE INDEX distributions_number_key ON public.distributions USING btree (number);

CREATE UNIQUE INDEX distributions_pkey ON public.distributions USING btree (id);

alter table "public"."distributions"
add constraint "distributions_pkey" PRIMARY KEY using index "distributions_pkey";

alter table "public"."distributions"
add constraint "distributions_number_key" UNIQUE using index "distributions_number_key";

create table "public"."distribution_verification_values" (
    "type" verification_type not null,
    "fixed_value" bigint not null,
    "bips_value" bigint not null,
    "distribution_id" integer not null references distributions(id) on delete cascade,
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
);

create unique index "distribution_verification_values_pkey" on "public"."distribution_verification_values" ("type", "distribution_id");

alter table "public"."distribution_verification_values"
add constraint "distribution_verification_values_pkey" PRIMARY KEY using index "distribution_verification_values_pkey";

alter table "public"."distribution_verification_values" validate constraint "distribution_verification_values_distribution_id_fkey";

alter table "public"."distribution_verification_values" enable row level security;

create policy "Enable read access to public" on distribution_verification_values for
select to authenticated using (true);

create table "public"."distribution_verifications" (
    "id" serial not null,
    "distribution_id" integer not null references distributions(id) on delete cascade,
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "type" verification_type not null,
    "metadata" jsonb,
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
);

create unique index "distribution_verifications_pkey" on "public"."distribution_verifications" ("id");

alter table "public"."distribution_verifications"
add constraint "distribution_verifications_pkey" PRIMARY KEY using index "distribution_verifications_pkey";

create index "distribution_verifications_distribution_id_index" on "public"."distribution_verifications" ("distribution_id");

create index "distribution_verifications_user_id_index" on "public"."distribution_verifications" ("user_id");

alter table "public"."distribution_verifications" enable row level security;

-- create view to select distribution_verifications for authenticated
CREATE or REPLACE VIEW "public"."distribution_verifications_summary" WITH (security_barrier) AS
select distribution_verifications.distribution_id,
    distribution_verifications.user_id,
    count(*) filter (
        where distribution_verifications.type = 'tag_registration'::public.verification_type
    ) as tag_registrations,
    count(*) filter (
        where distribution_verifications.type = 'tag_referral'::public.verification_type
    ) as tag_referrals
from distribution_verifications
where distribution_verifications.user_id = auth.uid()
group by distribution_verifications.distribution_id,
    distribution_verifications.user_id;

-- New table for distributions shares
create table "public"."distribution_shares" (
    "id" serial not null,
    "distribution_id" integer not null references distributions(id) on delete cascade,
    "user_id" uuid not null references auth.users(id) on delete cascade,
    "address" citext not null check (
        LENGTH(address) = 42
        AND address ~ '^0x[A-Fa-f0-9]{40}$'
    ),
    "amount" bigint not null,
    "hodler_pool_amount" bigint not null,
    "bonus_pool_amount" bigint not null,
    "fixed_pool_amount" bigint not null,
    "created_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text),
    "updated_at" timestamp with time zone not null default (now() AT TIME ZONE 'utc'::text)
);

-- Enable RLS on the new table
alter table "public"."distribution_shares" enable row level security;

-- Create policies to enable RLS
create policy "User can see own shares" on distribution_shares for
select using (user_id = auth.uid());

-- Create indexes for distribution_id
create index "distribution_shares_distribution_id_idx" on "public"."distribution_shares" ("distribution_id");

-- Create indexes for user_id
create unique index "distribution_shares_user_id_idx" on "public"."distribution_shares" using btree ("user_id");

-- Create indexes for address
create unique index "distribution_shares_address_idx" on "public"."distribution_shares" using btree ("address");

-- create trigger to insert verification when user confirms a tag
create or replace function "public"."insert_verification_tag_registration"() returns trigger language plpgsql security definer
set search_path = public as $$
declare curr_distribution_id bigint;

begin --
    -- check if tag is confirmed
if NEW.status <> 'confirmed'::public.tag_status then return NEW;

end if;

-- get the current distribution id
curr_distribution_id := (
    select id
    from distributions
    where qualification_start <= now()
        and qualification_end >= now()
    order by qualification_start desc
    limit 1
);

-- check if a verification for the same user, tag, and distribution already exists
if curr_distribution_id is not null
and not exists (
    select 1
    from public.distribution_verifications
    where user_id = NEW.user_id
        and metadata->>'tag' = NEW.name
        and type = 'tag_registration'::public.verification_type
) then -- insert new verification
insert into public.distribution_verifications (distribution_id, user_id, type, metadata)
values (
        (
            select id
            from distributions
            where qualification_start <= now()
                and qualification_end >= now()
            order by qualification_start desc
            limit 1
        ), NEW.user_id, 'tag_registration'::public.verification_type, jsonb_build_object('tag', NEW.name)
    );

end if;

return NEW;

end;

$$;

-- create the trigger
create trigger "insert_verification_tag_registration"
after
update on "public"."tags" for each row execute procedure "public"."insert_verification_tag_registration"();

-- Create function to insert verification when a referral is created
create or replace function "public"."insert_verification_referral"() returns trigger language plpgsql security definer
set search_path = public as $$
declare curr_distribution_id bigint;

begin -- Get the current distribution id
curr_distribution_id := (
    select id
    from distributions
    where qualification_start <= now()
        and qualification_end >= now()
    order by qualification_start desc
    limit 1
);

-- Insert verification for referrer
if curr_distribution_id is not null
and not exists (
    select 1
    from public.distribution_verifications
    where user_id = NEW.referrer_id
        and metadata->>'referred_id' = NEW.referred_id::text
        and distribution_id = (
            select id
            from distributions
            where qualification_start <= now()
                and qualification_end >= now()
            order by qualification_start desc
            limit 1
        )
        and type = 'tag_referral'::public.verification_type
) then
insert into public.distribution_verifications (distribution_id, user_id, type, metadata)
values (
        curr_distribution_id,
        NEW.referrer_id,
        'tag_referral'::public.verification_type,
        jsonb_build_object('referred_id', NEW.referred_id, 'tag', NEW.tag)
    );

end if;

return NEW;

end;

$$;

-- Create the trigger
create trigger "insert_verification_referral"
after
insert on "public"."referrals" for each row execute procedure "public"."insert_verification_referral"();

-- create function to look up eligible hodler addresses for a distribution
create or replace function "public"."distribution_hodler_addresses"(distribution_id integer) returns setof chain_addresses language plpgsql security definer
set search_path = public as $$ begin --

    -- get the distribution
    if (
        select 1
        from distributions
        where id = distribution_id
        limit 1
    ) is null then raise exception 'Distribution not found.';

end if;

-- return the hodler addresses that had no sells during the qualification period and have verifications
return query
select distinct chain_addresses.*
from distributions
    join distribution_verifications on distribution_verifications.distribution_id = distributions.id
    join chain_addresses on chain_addresses.user_id = distribution_verifications.user_id
    left join send_transfer_logs on send_transfer_logs."from" = chain_addresses.address
    and send_transfer_logs.to = '0x14F59C715C205002c6e3F36766D302c1a19bacC8' -- send uniswap v3 router address
    and send_transfer_logs.block_timestamp >= distributions.qualification_start
    and send_transfer_logs.block_timestamp <= distributions.qualification_end
where send_transfer_logs."from" is null
    and distributions.id = $1;

end;

$$;

-- only service role can execute this function
REVOKE EXECUTE ON FUNCTION "public"."distribution_hodler_addresses"(integer)
FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION "public"."distribution_hodler_addresses"(integer)
FROM anon;

REVOKE EXECUTE ON FUNCTION "public"."distribution_hodler_addresses"(integer)
FROM authenticated;

-- create function to update shares for a distribution
create or replace function "public"."update_distribution_shares"(
        distribution_id integer,
        shares distribution_shares []
    ) returns void language plpgsql security definer
set search_path = public as $$ begin --

    -- validate shares are greater than 0
    if (
        select count(*)
        from unnest(shares) shares
        where shares.amount <= 0
    ) > 0 then raise exception 'Shares must be greater than 0.';

end if;

-- get the distribution
if (
    select 1
    from distributions d
    where d.id = $1
    limit 1
) is null then raise exception 'Distribution not found.';

end if;

-- validate shares are for the correct distribution
if (
    select count(distinct id)
    from distributions
    where id in (
            select shares.distribution_id
            from unnest(shares) shares
        )
) <> 1 then raise exception 'Shares are for the wrong distribution.';

end if;

-- delete existing shares
delete from distribution_shares
where distribution_shares.distribution_id = $1;

-- insert new shares
insert into distribution_shares (
        distribution_id,
        user_id,
        address,
        amount,
        hodler_pool_amount,
        bonus_pool_amount,
        fixed_pool_amount
    )
select $1,
    shares.user_id,
    shares.address,
    shares.amount,
    shares.hodler_pool_amount,
    shares.bonus_pool_amount,
    shares.fixed_pool_amount
from unnest(shares) shares;

end;

$$;

-- only service role can execute this function
REVOKE EXECUTE ON FUNCTION "public"."update_distribution_shares"(integer, distribution_shares [])
FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION "public"."update_distribution_shares"(integer, distribution_shares [])
FROM anon;

REVOKE EXECUTE ON FUNCTION "public"."update_distribution_shares"(integer, distribution_shares [])
FROM authenticated;
