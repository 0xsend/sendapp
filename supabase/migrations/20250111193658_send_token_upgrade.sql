-- Send Token V0 -> V1 Migration

-- ENSURE SHOVEL IS DISABLED BEFORE RUNNING

-- rename send_token_transfers to send_token_v0_transfers
alter table send_token_transfers
    rename to send_token_v0_transfers;

alter index send_token_transfers_pkey rename to send_token_v0_transfers_pkey;
alter index send_token_transfers_f rename to send_token_v0_transfers_f;
alter index send_token_transfers_t rename to send_token_v0_transfers_t;
alter index u_send_token_transfers rename to send_token_v0_transfers_u;
alter index send_token_transfers_block_num rename to send_token_v0_transfers_block_num;
alter index send_token_transfers_block_time rename to send_token_v0_transfers_block_time;
alter index idx_transfers_composite rename to send_token_v0_transfers_composite;

ALTER SEQUENCE send_token_transfers_id_seq RENAME TO send_token_v0_transfers_id_seq;
ALTER TABLE send_token_v0_transfers
    ALTER COLUMN id
        SET DEFAULT nextval('send_token_v0_transfers_id_seq'::regclass);

-- drop old triggers
DROP TRIGGER IF EXISTS after_transfer_update_affiliate_stats ON public.send_token_v0_transfers;
DROP TRIGGER IF EXISTS insert_verification_send_ceiling_trigger ON public.send_token_v0_transfers;

-- create new send_token_transfers table which is pretty much the same as the old one but the log_addr will be the new address
create table send_token_transfers
(
    id         serial primary key,
    chain_id   numeric                                              not null,
    log_addr   bytea                                                not null,
    block_time numeric                                              not null,
    tx_hash    bytea                                                not null,
    f          bytea                                                not null,
    t          bytea                                                not null,
    v          numeric                                              not null,
    ig_name    text                                                 not null,
    src_name   text                                                 not null,
    block_num  numeric                                              not null,
    tx_idx     integer                                              not null,
    log_idx    integer                                              not null,
    abi_idx    smallint                                             not null,
    event_id   text generated always as ((
        (((((((ig_name || '/'::text) || src_name) || '/'::text) || (block_num)::text) || '/'::text) ||
          (tx_idx)::text) || '/'::text) || (log_idx)::text)) stored not null
);

create index send_token_transfers_f
    on send_token_transfers (f);

create index send_token_transfers_t
    on send_token_transfers (t);

CREATE UNIQUE INDEX u_send_token_transfers
    ON public.send_token_transfers USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

create index send_token_transfers_block_num
    on send_token_transfers (block_num);

create index send_token_transfers_block_time
    on send_token_transfers (block_time);

create index send_token_transfers_composite
    on send_token_transfers (block_time, f, t, v);


alter table "public"."send_token_transfers"
    enable row level security;

create policy "Users can see their own token transfers"
    on public.send_token_transfers for select using (auth.uid() in (select user_id
                                                                    from chain_addresses
                                                                    where "address" =
                                                                          lower(concat('0x', encode(send_token_transfers.f, 'hex')))::citext
                                                                       or "address" =
                                                                          lower(concat('0x', encode(send_token_transfers.t, 'hex')))::citext));

-- create triggers for new table
CREATE TRIGGER after_transfer_update_affiliate_stats
  AFTER INSERT ON send_token_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_affiliate_stats_on_transfer();

CREATE TRIGGER insert_verification_send_ceiling_trigger
  AFTER INSERT ON send_token_transfers
  FOR EACH ROW
  EXECUTE FUNCTION insert_verification_send_ceiling();
