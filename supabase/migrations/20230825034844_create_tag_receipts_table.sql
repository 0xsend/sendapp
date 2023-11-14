create table "public"."tag_receipts" (
    "tag_name" citext not null REFERENCES public.tags(name) ON DELETE CASCADE,
    "hash" citext not null REFERENCES public.receipts ON DELETE CASCADE
);

alter table "public"."tag_receipts" enable row level security;

CREATE UNIQUE INDEX tag_receipts_pkey ON public.tag_receipts USING btree (tag_name, hash);

alter table "public"."tag_receipts"
add constraint "tag_receipts_pkey" PRIMARY KEY using index "tag_receipts_pkey";
