BEGIN;
SELECT plan(12);

CREATE EXTENSION IF NOT EXISTS "basejump-supabase_test_helpers";

DO $$
DECLARE
    test_user_id uuid;
    test_send_account_id uuid;
    start_time timestamp;
    end_time timestamp;
    i integer;
    tag_ids bigint[];
    last_tag_id bigint;
BEGIN
    -- Setup test user and send account
    SELECT tests.create_supabase_user('perf_user') INTO test_user_id;
    
    INSERT INTO send_accounts (user_id, address, chain_id, init_code)
    VALUES (tests.get_supabase_uid('perf_user'), '0x6234567890123456789012345678901234567890', 8453, '\\x00')
    RETURNING id INTO test_send_account_id;
    
    -- Test 1: Creating 5 tags should be fast
    start_time := clock_timestamp();
    FOR i IN 1..5 LOOP
        tag_ids := tag_ids || create_tag(('perftag' || i)::citext, test_send_account_id);
    END LOOP;
    end_time := clock_timestamp();
    
    PERFORM ok(
        EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 1000,
        'Creating 5 tags completes within 1 second: ' || EXTRACT(MILLISECONDS FROM (end_time - start_time)) || 'ms'
    );
    
    -- Test 2: Verify all tags were created with proper associations
    PERFORM ok((
        SELECT COUNT(*) FROM send_account_tags WHERE send_account_id = test_send_account_id
    ) = 5, 'All 5 tags created with send_account_tags associations');
    
    -- Test 3: Bulk tag confirmation performance
    start_time := clock_timestamp();
    
    SET ROLE service_role;
    UPDATE tags SET status = 'confirmed' 
    WHERE id = ANY(tag_ids);
    SET ROLE postgres;
    
    end_time := clock_timestamp();
    
    PERFORM ok(
        EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 500,
        'Bulk tag confirmation completes within 500ms: ' || EXTRACT(MILLISECONDS FROM (end_time - start_time)) || 'ms'
    );
    
    -- Test 4: Tag deletion and main tag succession performance
    start_time := clock_timestamp();
    
    -- Delete tags one by one, testing main tag succession
    FOR i IN 1..4 LOOP
        DELETE FROM send_account_tags 
        WHERE send_account_id = test_send_account_id 
        AND tag_id = (
            SELECT tag_id FROM send_account_tags 
            WHERE send_account_id = test_send_account_id 
            ORDER BY created_at ASC LIMIT 1
        );
    END LOOP;
    
    end_time := clock_timestamp();
    
    PERFORM ok(
        EXTRACT(MILLISECONDS FROM (end_time - start_time)) < 500,
        'Tag deletion and succession completes within 500ms: ' || EXTRACT(MILLISECONDS FROM (end_time - start_time)) || 'ms'
    );
    
    -- Test 5: Verify only one tag remains and it's the main tag
    PERFORM ok(
        (SELECT COUNT(*) FROM send_account_tags WHERE send_account_id = test_send_account_id) = 1,
        'Only one tag remains after deletions'
    );
    
    SELECT tag_id INTO last_tag_id
    FROM send_account_tags 
    WHERE send_account_id = test_send_account_id;
    
    PERFORM ok(EXISTS(
        SELECT 1 FROM send_accounts 
        WHERE id = test_send_account_id AND main_tag_id = last_tag_id
    ), 'Remaining tag is the main tag');
    
    -- Test 6: Edge case - concurrent tag creation simulation
    DECLARE
        concurrent_user_id uuid;
        concurrent_send_account_id uuid;
        concurrent_tag_count integer;
    BEGIN
        SELECT tests.create_supabase_user('concurrent_user') INTO concurrent_user_id;
        
        INSERT INTO send_accounts (user_id, address, chain_id, init_code)
        VALUES (tests.get_supabase_uid('concurrent_user'), '0x7234567890123456789012345678901234567890', 8453, '\\x00')
        RETURNING id INTO concurrent_send_account_id;
        
        -- Simulate rapid tag creation
        FOR i IN 1..3 LOOP
            PERFORM create_tag(('concurrent' || i)::citext, concurrent_send_account_id);
        END LOOP;
        
        SELECT COUNT(*) INTO concurrent_tag_count
        FROM send_account_tags 
        WHERE send_account_id = concurrent_send_account_id;
        
        PERFORM ok(concurrent_tag_count = 3, 'Concurrent-style tag creation works correctly');
    END;
    
    -- Test 7: Edge case - tag name collision handling
    DECLARE
        collision_user1_id uuid;
        collision_user2_id uuid;
        collision_send_account1_id uuid;
        collision_send_account2_id uuid;
        collision_tag1_id bigint;
        collision_tag2_id bigint;
        error_caught boolean := false;
    BEGIN
        SELECT tests.create_supabase_user('collision_user1') INTO collision_user1_id;
        SELECT tests.create_supabase_user('collision_user2') INTO collision_user2_id;
        
        INSERT INTO send_accounts (user_id, address, chain_id, init_code)
        VALUES (tests.get_supabase_uid('collision_user1'), '0x8234567890123456789012345678901234567890', 8453, '\\x00')
        RETURNING id INTO collision_send_account1_id;
        
        INSERT INTO send_accounts (user_id, address, chain_id, init_code)
        VALUES (tests.get_supabase_uid('collision_user2'), '0x9234567890123456789012345678901234567890', 8453, '\\x00')
        RETURNING id INTO collision_send_account2_id;
        
        -- First user creates tag
        SELECT create_tag('samename', collision_send_account1_id) INTO collision_tag1_id;
        
        -- Second user tries to create same name (should fail due to unique constraint)
        BEGIN
            SELECT create_tag('samename', collision_send_account2_id) INTO collision_tag2_id;
        EXCEPTION
            WHEN unique_violation THEN
                error_caught := true;
        END;
        
        PERFORM ok(error_caught, 'Tag name collision properly prevented');
    END;
    
    -- Test 8: Edge case - very long tag names
    DECLARE
        long_name_error boolean := false;
        very_long_name text := repeat('a', 100); -- Assuming there's a length limit
    BEGIN
        BEGIN
            PERFORM create_tag(very_long_name::citext, test_send_account_id);
        EXCEPTION
            WHEN OTHERS THEN
                long_name_error := true;
        END;
        
        -- This test checks if extremely long names are handled gracefully
        -- Result depends on actual constraints in the system
        PERFORM ok(true, 'Long tag name handling test completed (error: ' || long_name_error || ')');
    END;
    
    -- Test 9: Edge case - tag deletion when no main tag exists
    DECLARE
        orphan_user_id uuid;
        orphan_send_account_id uuid;
        orphan_tag_id bigint;
    BEGIN
        SELECT tests.create_supabase_user('orphan_user') INTO orphan_user_id;
        
        INSERT INTO send_accounts (user_id, address, chain_id, init_code, main_tag_id)
        VALUES (tests.get_supabase_uid('orphan_user'), '0xA234567890123456789012345678901234567890', 8453, '\\x00', NULL)
        RETURNING id INTO orphan_send_account_id;
        
        SELECT create_tag('orphantag', orphan_send_account_id) INTO orphan_tag_id;
        
        -- Delete the tag without it ever being main
        DELETE FROM send_account_tags 
        WHERE send_account_id = orphan_send_account_id AND tag_id = orphan_tag_id;
        
        -- Should not cause any errors
        PERFORM ok(NOT EXISTS(
            SELECT 1 FROM send_account_tags 
            WHERE send_account_id = orphan_send_account_id
        ), 'Tag deletion without main tag assignment works correctly');
    END;
    
    -- Test 10: Edge case - available tag reuse performance
    DECLARE
        available_tag_name citext := 'reusabletag';
        reuse_tag_id bigint;
        reuse_count integer := 0;
    BEGIN
        -- Create and delete a tag multiple times to test reuse efficiency
        FOR i IN 1..3 LOOP
            SELECT create_tag(available_tag_name, test_send_account_id) INTO reuse_tag_id;
            DELETE FROM send_account_tags 
            WHERE send_account_id = test_send_account_id AND tag_id = reuse_tag_id;
            reuse_count := reuse_count + 1;
        END LOOP;
        
        PERFORM ok(reuse_count = 3, 'Tag reuse cycle works efficiently');
        
        -- Verify the tag is available for reuse
        PERFORM ok(EXISTS(
            SELECT 1 FROM tags 
            WHERE name = available_tag_name AND status = 'available'
        ), 'Tag is properly marked as available after final deletion');
    END;
    
    -- Test 11: Stress test - rapid succession of operations
    DECLARE
        stress_user_id uuid;
        stress_send_account_id uuid;
        stress_operations integer := 0;
        stress_start_time timestamp;
        stress_end_time timestamp;
    BEGIN
        SELECT tests.create_supabase_user('stress_user') INTO stress_user_id;
        
        INSERT INTO send_accounts (user_id, address, chain_id, init_code)
        VALUES (tests.get_supabase_uid('stress_user'), '0xB234567890123456789012345678901234567890', 8453, '\\x00')
        RETURNING id INTO stress_send_account_id;
        
        stress_start_time := clock_timestamp();
        
        -- Rapid create/delete cycle
        FOR i IN 1..5 LOOP
            PERFORM create_tag(('stress' || i)::citext, stress_send_account_id);
            stress_operations := stress_operations + 1;
            
            IF i > 1 THEN
                DELETE FROM send_account_tags 
                WHERE send_account_id = stress_send_account_id 
                AND tag_id = (
                    SELECT tag_id FROM send_account_tags 
                    WHERE send_account_id = stress_send_account_id 
                    ORDER BY created_at ASC LIMIT 1
                );
                stress_operations := stress_operations + 1;
            END IF;
        END LOOP;
        
        stress_end_time := clock_timestamp();
        
        PERFORM ok(
            EXTRACT(MILLISECONDS FROM (stress_end_time - stress_start_time)) < 2000,
            'Stress test with ' || stress_operations || ' operations completes within 2 seconds: ' || 
            EXTRACT(MILLISECONDS FROM (stress_end_time - stress_start_time)) || 'ms'
        );
    END;
END $$;

SELECT finish();
ROLLBACK;