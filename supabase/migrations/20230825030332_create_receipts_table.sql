create table "public"."receipts" (
    "hash" citext not null CHECK (
        LENGTH(hash) = 66
        AND hash ~ '^0x[A-Fa-f0-9]{64}$'
    ),
    "created_at" timestamp with time zone default now(),
    user_id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE
);

alter table "public"."receipts" enable row level security;

CREATE UNIQUE INDEX receipts_pkey ON public.receipts USING btree (hash);

CREATE INDEX receipts_user_id_idx ON public.receipts(user_id);

alter table "public"."receipts"
add constraint "receipts_pkey" PRIMARY KEY using index "receipts_pkey";

create policy "Receipts are viewable by users." on public.receipts for
select using (auth.uid() = user_id);
