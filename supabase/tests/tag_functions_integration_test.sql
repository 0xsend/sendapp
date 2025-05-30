BEGIN;
SELECT plan(15);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

DO $$
DECLARE
    test_user_id uuid;
    referrer_user_id uuid;
    test_send_account_id uuid;
    referrer_send_account_id uuid;
    tag_id bigint;
    referrer_tag_id bigint;
    mock_event_id text := 'sendtag_checkout_receipts/integration_test/1/0/0/0';
    referrer_code text;
BEGIN
    -- Setup test users and send accounts
    SELECT tests.create_supabase_user('integration_user') INTO test_user_id;
    SELECT tests.create_supabase_user('referrer_user') INTO referrer_user_id;
    
    PERFORM tests.authenticate_as('integration_user');
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('integration_user'), '0x5234567890123456789012345678901234567890', 8453, '\\x00')
    RETURNING id INTO test_send_account_id;
    
    PERFORM tests.authenticate_as('referrer_user');
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('referrer_user'), '0x6234567890123456789012345678901234567890', 8453, '\\x00')
    RETURNING id INTO referrer_send_account_id;
    
    -- Switch back to main test user for tag creation
    PERFORM tests.authenticate_as('integration_user');
    
    -- Test 1: Complete flow create -> confirm without referral
    SELECT create_tag('flowtest', test_send_account_id) INTO tag_id;
    
    PERFORM ok(tag_id IS NOT NULL, 'create_tag returns valid tag_id');
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM tags WHERE id = tag_id AND status = 'pending'
    ), 'Tag created with pending status');
    
    -- Mock receipt for confirmation
    SET ROLE service_role;
    INSERT INTO sendtag_checkout_receipts(
        chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, 
        log_idx, abi_idx, block_time, sender, amount, referrer, reward
    ) VALUES (
        8453, 
        decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'),
        decode('1234567890123456789012345678901234567890123456789012345678901234', 'hex'),
        'sendtag_checkout_receipts', 
        'integration_test', 
        1, 0, 0, 0, 1234567890,
        decode(substring('0x5234567890123456789012345678901234567890' FROM 3), 'hex'),
        1000000,
        decode('0000000000000000000000000000000000000000', 'hex'),
        0
    );
    SET ROLE postgres;
    
    -- Test 2: confirm_tags function integration
    PERFORM confirm_tags(
        ARRAY['flowtest']::citext[], 
        test_send_account_id, 
        mock_event_id, 
        NULL
    );
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM tags WHERE id = tag_id AND status = 'confirmed'
    ), 'Tag confirmed successfully through confirm_tags');
    
    -- Test 3: Receipt created properly
    PERFORM ok(EXISTS(
        SELECT 1 FROM receipts 
        WHERE event_id = mock_event_id AND user_id = tests.get_supabase_uid('integration_user')
    ), 'Receipt created for user');
    
    -- Test 4: Tag receipt association created
    PERFORM ok(EXISTS(
        SELECT 1 FROM tag_receipts 
        WHERE event_id = mock_event_id AND tag_id = tag_id
    ), 'Tag receipt association created');
    
    -- Test 5: Main tag set automatically on first confirmation
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id = tag_id
    ), 'Tag set as main automatically on first confirmation');
    
    -- Test 6: Setup referral scenario
    -- Create referrer tag and confirm it first
    SELECT create_tag('referrertag', referrer_send_account_id) INTO referrer_tag_id;
    
    SET ROLE service_role;
    -- Create receipt for referrer
    INSERT INTO sendtag_checkout_receipts(
        chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, 
        log_idx, abi_idx, block_time, sender, amount, referrer, reward
    ) VALUES (
        8453, 
        decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'),
        decode('2234567890123456789012345678901234567890123456789012345678901234', 'hex'),
        'sendtag_checkout_receipts', 
        'referrer_test', 
        2, 0, 0, 0, 1234567890,
        decode(substring('0x6234567890123456789012345678901234567890' FROM 3), 'hex'),
        1000000,
        decode('0000000000000000000000000000000000000000', 'hex'),
        0
    );
    SET ROLE postgres;
    
    PERFORM confirm_tags(
        ARRAY['referrertag']::citext[], 
        referrer_send_account_id, 
        'sendtag_checkout_receipts/referrer_test/2/0/0/0', 
        NULL
    );
    
    -- Get referrer code
    SELECT referral_code INTO referrer_code 
    FROM profiles 
    WHERE id = tests.get_supabase_uid('referrer_user');
    
    -- Test 7: Create second tag with referral
    DECLARE
        referred_tag_id bigint;
        referred_event_id text := 'sendtag_checkout_receipts/referred_test/3/0/0/0';
    BEGIN
        SELECT create_tag('referredtag', test_send_account_id) INTO referred_tag_id;
        
        -- Mock receipt for referred tag
        SET ROLE service_role;
        INSERT INTO sendtag_checkout_receipts(
            chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, 
            log_idx, abi_idx, block_time, sender, amount, referrer, reward
        ) VALUES (
            8453, 
            decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'),
            decode('3234567890123456789012345678901234567890123456789012345678901234', 'hex'),
            'sendtag_checkout_receipts', 
            'referred_test', 
            3, 0, 0, 0, 1234567890,
            decode(substring('0x5234567890123456789012345678901234567890' FROM 3), 'hex'),
            1000000,
            decode('0000000000000000000000000000000000000000', 'hex'),
            0
        );
        SET ROLE postgres;
        
        -- Confirm with referral
        PERFORM confirm_tags(
            ARRAY['referredtag']::citext[], 
            test_send_account_id, 
            referred_event_id, 
            referrer_code
        );
        
        PERFORM ok(EXISTS(
            SELECT 1 FROM tags WHERE id = referred_tag_id AND status = 'confirmed'
        ), 'Referred tag confirmed successfully');
        
        -- Test 8: Referral relationship created
        PERFORM ok(EXISTS(
            SELECT 1 FROM referrals 
            WHERE referred_id = tests.get_supabase_uid('integration_user')
            AND referrer_id = tests.get_supabase_uid('referrer_user')
            AND tag_id = referred_tag_id
        ), 'Referral relationship created with correct tag_id');
    END;
    
    -- Test 9: Multiple tag confirmation in single call
    DECLARE
        multi_tag1_id bigint;
        multi_tag2_id bigint;
        multi_event_id text := 'sendtag_checkout_receipts/multi_test/4/0/0/0';
    BEGIN
        SELECT create_tag('multitag1', test_send_account_id) INTO multi_tag1_id;
        SELECT create_tag('multitag2', test_send_account_id) INTO multi_tag2_id;
        
        -- Mock receipt for multiple tags
        SET ROLE service_role;
        INSERT INTO sendtag_checkout_receipts(
            chain_id, log_addr, tx_hash, ig_name, src_name, block_num, tx_idx, 
            log_idx, abi_idx, block_time, sender, amount, referrer, reward
        ) VALUES (
            8453, 
            decode('833589fcd6edb6e08f4c7c32d4f71b54bda02913', 'hex'),
            decode('4234567890123456789012345678901234567890123456789012345678901234', 'hex'),
            'sendtag_checkout_receipts', 
            'multi_test', 
            4, 0, 0, 0, 1234567890,
            decode(substring('0x5234567890123456789012345678901234567890' FROM 3), 'hex'),
            2000000,  -- Double amount for 2 tags
            decode('0000000000000000000000000000000000000000', 'hex'),
            0
        );
        SET ROLE postgres;
        
        -- Confirm multiple tags
        PERFORM confirm_tags(
            ARRAY['multitag1', 'multitag2']::citext[], 
            test_send_account_id, 
            multi_event_id, 
            NULL
        );
        
        PERFORM ok(EXISTS(
            SELECT 1 FROM tags WHERE id = multi_tag1_id AND status = 'confirmed'
        ) AND EXISTS(
            SELECT 1 FROM tags WHERE id = multi_tag2_id AND status = 'confirmed'
        ), 'Multiple tags confirmed in single call');
        
        -- Test 10: Multiple tag receipts created
        PERFORM ok((
            SELECT COUNT(*) FROM tag_receipts WHERE event_id = multi_event_id
        ) = 2, 'Tag receipts created for all confirmed tags');
    END;
    
    -- Test 11: Error handling - confirm non-existent tag
    DECLARE
        error_caught boolean := false;
    BEGIN
        BEGIN
            PERFORM confirm_tags(
                ARRAY['nonexistenttag']::citext[], 
                test_send_account_id, 
                'fake_event', 
                NULL
            );
        EXCEPTION
            WHEN OTHERS THEN
                error_caught := true;
        END;
        
        PERFORM ok(error_caught, 'Error properly caught for non-existent tag confirmation');
    END;
    
    -- Test 12: Error handling - confirm tag not owned by send_account
    DECLARE
        other_user_id uuid;
        other_send_account_id uuid;
        other_tag_id bigint;
        error_caught boolean := false;
    BEGIN
        SELECT tests.create_supabase_user('other_integration_user') INTO other_user_id;
        
        INSERT INTO send_accounts (user_id, address, chain_id, init_code)
        VALUES (tests.get_supabase_uid('other_integration_user'), '0x7234567890123456789012345678901234567890', 8453, '\\x00')
        RETURNING id INTO other_send_account_id;
        
        SELECT create_tag('othertag', other_send_account_id) INTO other_tag_id;
        
        BEGIN
            PERFORM confirm_tags(
                ARRAY['othertag']::citext[], 
                test_send_account_id,  -- Wrong send account
                'wrong_event', 
                NULL
            );
        EXCEPTION
            WHEN OTHERS THEN
                error_caught := true;
        END;
        
        PERFORM ok(error_caught, 'Error properly caught for confirming unowned tag');
    END;
    
    -- Test 13: Tag search function integration
    PERFORM ok(EXISTS(
        SELECT 1 FROM tag_search('flowtest') 
        WHERE name = 'flowtest' AND status = 'confirmed'
    ), 'Confirmed tag appears in search results');
    
    -- Test 14: Profile lookup integration - verify tags appear in profile
    PERFORM ok(EXISTS(
        SELECT 1 FROM profile_lookup('integration_user') p
        WHERE 'flowtest' = ANY(p.all_tags)
    ), 'Confirmed tag appears in profile lookup all_tags');
    
    -- Test 15: Activity feed integration - verify tag confirmations appear
    PERFORM ok(EXISTS(
        SELECT 1 FROM activity_feed(tests.get_supabase_uid('integration_user'), 10, 0)
        WHERE event_name = 'tag_confirmation' AND tag_name = 'flowtest'
    ), 'Tag confirmation appears in activity feed');
END $$;

SELECT finish();
ROLLBACK;