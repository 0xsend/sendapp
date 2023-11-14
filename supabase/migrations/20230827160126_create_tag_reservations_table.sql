create table "public"."tag_reservations" (
    "tag_name" citext not null,
    "chain_address" citext,
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."tag_reservations" enable row level security;

CREATE UNIQUE INDEX tag_reservations_pkey ON public.tag_reservations USING btree (tag_name);

alter table "public"."tag_reservations"
add constraint "tag_reservations_pkey" PRIMARY KEY using index "tag_reservations_pkey";

alter table "public"."tag_reservations"
add constraint "tag_reservations_chain_address_check" CHECK (
        (
            (length((chain_address)::text) = 42)
            AND (chain_address ~ '^0x[A-Fa-f0-9]{40}$'::citext)
        )
    ) not valid;

alter table "public"."tag_reservations" validate constraint "tag_reservations_chain_address_check";

alter table "public"."tag_reservations"
add constraint "tag_reservations_tag_name_check" CHECK (
        (
            (
                (length((tag_name)::text) >= 1)
                AND (length((tag_name)::text) <= 20)
            )
            AND (tag_name ~ '^[A-Za-z0-9_]+$'::citext)
        )
    ) not valid;

alter table "public"."tag_reservations" validate constraint "tag_reservations_tag_name_check";
