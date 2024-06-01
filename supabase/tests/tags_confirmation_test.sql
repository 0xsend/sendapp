-- 3. Tag Confirmation
BEGIN;

SELECT plan(14);

CREATE EXTENSION "basejump-supabase_test_helpers";

GRANT USAGE ON SCHEMA tests TO service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA tests TO service_role;

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator');

SELECT tests.authenticate_as('tag_creator');

insert into send_accounts (user_id, address, chain_id, init_code)
values (tests.get_supabase_uid('tag_creator'), '0x1234567890ABCDEF1234567890ABCDEF12345678', 1, '\\x00112233445566778899AABBCCDDEEFF');

-- Inserting a tag for test user
INSERT INTO tags(name, user_id)
VALUES (
    'zzz1',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'zzz2',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'tag_creator_zzz',
    tests.get_supabase_uid('tag_creator')
  ),
  (
    'tag_creator_zzz2',
    tests.get_supabase_uid('tag_creator')
  );

-- Confirm tags with the service role
select tests.clear_authentication();

select set_config('role', 'service_role', true);

-- insert a receipt
insert into send_revenues_safe_receives (chain_id, log_addr, tx_hash, sender, v, ig_name, src_name, block_num, tx_idx, log_idx, block_time, abi_idx)
values (8453, '\xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', '\x1234567890123456789012345678901234567890123456789012345678901234', '\x1234567890ABCDEF1234567890ABCDEF12345678', 1, 'send_revenues_safe_receives', 'send_revenues_safe_receives', 12345, 0, 0, 1234567890, 0);

SELECT confirm_tags(
    '{zzz1,zzz2,tag_creator_zzz,tag_creator_zzz2}',
    '0x1234567890123456789012345678901234567890123456789012345678901234',
    null
  );

-- Verify that the tags were confirmed
SELECT results_eq(
    $$
    SELECT count(*)::integer
    FROM tags
    WHERE status = 'confirmed'::tag_status
      and user_id = tests.get_supabase_uid('tag_creator') $$,
      $$VALUES (4) $$,
      'Tags should be confirmed'
  );

-- Verify receipt was created
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    from receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES (1) $$,
      'Receipt should be created'
  );

-- Verify paid tags are associated with receipt
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    from tag_receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES (4) $$,
      'Tags should be associated with receipt'
  );

SELECT results_eq(
    $$
    SELECT tag_name::text
    from tag_receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES ('zzz1'),
      ('zzz2'),
      ('tag_creator_zzz'),
      ('tag_creator_zzz2') $$,
      'Tags should be associated with receipt'
  );

-- Verify user can see receipt
SELECT tests.authenticate_as('tag_creator');

SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    from receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES (1) $$,
      'User should be able to see receipt'
  );

-- Verify activity was created
SELECT results_eq(
    $$
    SELECT jsonb_agg(tag ORDER BY tag)::text, tx_hash, value
    FROM (
        SELECT jsonb_array_elements_text(data->'tags') AS tag, data->>'tx_hash' as tx_hash, data->>'value' as value
        FROM activity_feed
        WHERE event_name = 'tag_receipts'
    ) subquery
    group by tx_hash, value
    $$,
    $$VALUES (
        '["tag_creator_zzz", "tag_creator_zzz2", "zzz1", "zzz2"]'::text,
        '\x1234567890123456789012345678901234567890123456789012345678901234',
        1::text
    )$$,
    'Tag receipt activity was created'
);

SELECT tests.create_supabase_user('hacker');

SELECT tests.authenticate_as('hacker');

-- verify hacker cannot see receipt
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    from receipts
    WHERE hash = '0x1234567890123456789012345678901234567890123456789012345678901234' $$,
      $$VALUES (0) $$,
      'Hacker should not be able to see receipt'
  );

-- Creating a test user
SELECT tests.create_supabase_user('tag_creator_2');

SELECT tests.authenticate_as('tag_creator_2');

-- can create a common tag
INSERT INTO tags(name, user_id)
VALUES (
    'tag_creator_2',
    tests.get_supabase_uid('tag_creator_2')
  );

-- Confirm tags with the service role
select set_config('role', 'service_role', true);

SELECT confirm_tags(
    '{tag_creator_2}',
    '0x2234567890123456789012345678901234567890123456789012345678901234',
    null
  );

-- Verify that the tags were confirmed
SELECT isnt_empty(
    $$
    SELECT count(*)::integer
    FROM tags
    WHERE status = 'confirmed'::tag_status
      and user_id = tests.get_supabase_uid('tag_creator_2')
      and name = 'tag_creator_2' $$,
      'Tags should be confirmed'
  );

-- Verify receipt was created
SELECT results_eq(
    $$
    SELECT COUNT(*)::integer
    from tag_receipts
    WHERE tag_name = 'tag_creator_2' $$,
    $$VALUES (1) $$,
      'Receipt should be created'
  );

-- 2nd common tag requires receipt
INSERT INTO tags(name, user_id)
VALUES (
    'tag_creator_2_2',
    tests.get_supabase_uid('tag_creator_2')
  );

-- Confirm tags with the service role
select tests.clear_authentication();

select set_config('role', 'service_role', true);

SELECT throws_ok(
    $$
    SELECT confirm_tags('{tag_creator_2_2}', null, null);

$$,
'Receipt hash is required for paid tags.'
);

-- user can refer other users
select tests.authenticate_as('tag_creator_2');

INSERT INTO tags(name, user_id)
VALUES (
    'tag_creator_2_3',
    tests.get_supabase_uid('tag_creator_2')
  );

-- confirm tag with referral code
select tests.clear_authentication();

select set_config('role', 'service_role', true);

select confirm_tags(
    '{tag_creator_2_3}',
    '0x3234567890123456789012345678901234567890123456789012345678901234',
    (
      select referral_code
      from public.profiles
      where id = tests.get_supabase_uid('tag_creator')
    )
  );

select isnt_empty(
    $test$
    SELECT tag
    FROM referrals
    WHERE referrer_id = tests.get_supabase_uid('tag_creator') $test$,
      'Referral should be created'
  );

-- verify referral activity was created for tag_creator_2 in activity feed
select results_eq(
   $$
   SELECT data->>'tags', from_user_id, to_user_id
   FROM activity
   WHERE event_name = 'referrals'
   $$,
   $$
   VALUES (
      '["tag_creator_2_3"]'::text,
      tests.get_supabase_uid('tag_creator'),
      tests.get_supabase_uid('tag_creator_2')
   ) $$,
   'verify tag receipt activity was created'
);

-- verify referral activity was created for tag_creator_2 in activity feed
select tests.authenticate_as('tag_creator');

select results_eq(
   $$
   SELECT (from_user).tags, (to_user).tags
   FROM activity_feed
   WHERE event_name = 'referrals'
   $$,
   $$
   VALUES (
      '{zzz1,zzz2,tag_creator_zzz,tag_creator_zzz2}'::text[],
      '{tag_creator_2,tag_creator_2_3}'::text[] 
   ) $$,
   'verify referral activity was created'
);

-- duplicate receipt hash should not confirm tag
select tests.authenticate_as('tag_creator_2');

INSERT INTO tags(name, user_id)
VALUES (
    'tag_creator_2_4',
    tests.get_supabase_uid('tag_creator_2')
  );

select tests.clear_authentication();

select set_config('role', 'service_role', true);

select throws_ok(
    $$
    SELECT confirm_tags('{tag_creator_2_4}', '0x1234567890123456789012345678901234567890123456789012345678901234', null);

$$,
'duplicate key value violates unique constraint "receipts_pkey"'
);

SELECT finish();

ROLLBACK;
