-- generate activity, replace addresses f and t
WITH base AS (
    SELECT *
    FROM (VALUES
              (1, 845337, '\xeab49138ba2ea6dd776220fe26b7b8e446638956'::bytea, 1756725123::bigint,
               '\x4c40a299b59d495b67e017aaf98e3cb4c12231a6abcf98555a01ececea6b6ea5'::bytea,
               '\x937b26b518e68f6808de1ca7d81b236f9ec48565'::bytea,
               '\xaceba2c8275106ff8edb860582a3ab7d9fa64c99'::bytea,
               1000000000000000000::numeric, 'send_account_transfers','base_logs',34967887,0,2,0),
              (2, 845337, '\x833589fcd6edb6e08f4c7c32d4f71b54bda02913'::bytea, 1756725123::bigint,
               '\x4c40a299b59d495b67e017aaf98e3cb4c12231a6abcf98555a01ececea6b6ea5'::bytea,
               '\x937b26b518e68f6808de1ca7d81b236f9ec48565'::bytea,
               '\x592e1224d203be4214b15e205f6081fbbacfcd2d'::bytea,
               56535::numeric, 'send_account_transfers','base_logs',34967887,0,0,0),
              (3, 845337, '\x833589fcd6edb6e08f4c7c32d4f71b54bda02913'::bytea, 1756725123::bigint,
               '\x4c40a299b59d495b67e017aaf98e3cb4c12231a6abcf98555a01ececea6b6ea5'::bytea,
               '\x592e1224d203be4214b15e205f6081fbbacfcd2d'::bytea,
               '\x937b26b518e68f6808de1ca7d81b236f9ec48565'::bytea,
               18310::numeric, 'send_account_transfers','base_logs',34967887,0,3,0)
         ) AS t(id, chain_id, log_addr, block_time, tx_hash, f, t, v, ig_name, src_name, block_num, tx_idx, log_idx, abi_idx)
),
     series AS (
         SELECT generate_series(0, 99) AS i -- 100 groups
     )
INSERT INTO "public"."send_account_transfers" (
    "id","chain_id","log_addr","block_time","tx_hash","f","t","v",
    "ig_name","src_name","block_num","tx_idx","log_idx","abi_idx"
)
SELECT
    (b.id + s.i*3)::bigint AS id,
        b.chain_id,
    b.log_addr,
    b.block_time + (s.i * 15) AS block_time, -- increment block_time
    b.tx_hash,
    b.f,
    b.t,
    b.v + (s.i * 1000000000000000000::numeric) AS v,
    b.ig_name,
    b.src_name,
    b.block_num + s.i AS block_num,   -- increment block_num
    b.tx_idx,
    b.log_idx,
    b.abi_idx
FROM base b
         CROSS JOIN series s
ORDER BY id;

--update user phone number
update auth.users
set phone = '+481',
    phone_confirmed_at = now()
where id = '5ea1d61f-782e-4501-bf10-9e33c3f45d00';