-- Migration: Deterministic Reconciliation + Merged Activity Feed
--
-- This migration:
-- 1. Creates a deterministic reconciliation trigger that populates transfer_reconciliations
--    using exact keys (chain_id, tx_hash, log_idx) when on-chain events are indexed.
-- 2. Removes the old fuzzy matching trigger (send_account_transfers_delete_temporal_activity)
-- 3. Creates a merged activity feed view that shows:
--    - Pending transfers from transfer_intents
--    - Confirmed transfers from indexed events via transfer_reconciliations
--    - Notes always preserved from transfer_intents
-- 4. Retires legacy temporal activity triggers

-- ============================================================================
-- Phase 1: Drop old fuzzy matching trigger and function
-- ============================================================================

-- Drop the old trigger that used fuzzy matching
DROP TRIGGER IF EXISTS "send_account_transfers_trigger_delete_temporal_activity" ON "public"."send_account_transfers";

-- Drop the old fuzzy matching function
DROP FUNCTION IF EXISTS "public"."send_account_transfers_delete_temporal_activity"();

-- ============================================================================
-- Phase 2: Create deterministic reconciliation trigger function
-- ============================================================================

-- This function is called when a new on-chain transfer is indexed.
-- It looks up matching transfer_intents using exact keys (tx_hash, user_op_hash)
-- and creates a reconciliation record linking the intent to the on-chain event.
CREATE OR REPLACE FUNCTION public.reconcile_transfer_on_index()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
AS $function$
DECLARE
    _intent_id bigint;
    _intent_note text;
    _event_id text;
BEGIN
    -- Build the event_id to reference the indexed event
    _event_id := NEW.ig_name || '/' || NEW.src_name || '/' || NEW.block_num::text || '/' || NEW.tx_idx::text || '/' || NEW.log_idx::text;
    
    -- Strategy 1: Match by tx_hash (exact transaction match)
    -- This works when the transfer_intent has the tx_hash set after submission
    SELECT id, note INTO _intent_id, _intent_note
    FROM public.transfer_intents
    WHERE tx_hash = NEW.tx_hash
      AND status IN ('pending', 'submitted')
      AND chain_id = NEW.chain_id
    LIMIT 1;
    
    -- Strategy 2: Match by user_op_hash if tx_hash match fails
    -- For 4337 transactions, the user_op_hash is stored in the intent
    -- and the tx_hash is actually the user_op_hash
    IF _intent_id IS NULL THEN
        SELECT id, note INTO _intent_id, _intent_note
        FROM public.transfer_intents
        WHERE user_op_hash = NEW.tx_hash
          AND status IN ('pending', 'submitted')
          AND chain_id = NEW.chain_id
        LIMIT 1;
    END IF;
    
    -- If we found a matching intent, create the reconciliation
    IF _intent_id IS NOT NULL THEN
        -- Insert the reconciliation record (deterministic link)
        -- The UNIQUE constraint on (chain_id, tx_hash, log_idx) ensures collision invariants
        INSERT INTO public.transfer_reconciliations (
            intent_id,
            chain_id,
            tx_hash,
            log_idx,
            block_num,
            block_time,
            event_id
        ) VALUES (
            _intent_id,
            NEW.chain_id,
            NEW.tx_hash,
            NEW.log_idx,
            NEW.block_num,
            NEW.block_time,
            _event_id
        )
        ON CONFLICT (chain_id, tx_hash, log_idx) DO NOTHING;
        
        -- Update the intent status to confirmed
        UPDATE public.transfer_intents
        SET status = 'confirmed'
        WHERE id = _intent_id;
        
        -- If the intent had a note, propagate it to the indexed activity
        IF _intent_note IS NOT NULL THEN
            UPDATE public.activity
            SET data = data || jsonb_build_object('note', _intent_note)
            WHERE event_name = 'send_account_transfers'
              AND event_id = _event_id;
        END IF;
        
        -- Delete the pending temporal activity if it exists
        -- (cleanup the old temporal activity row)
        DELETE FROM public.activity
        WHERE event_name = 'temporal_send_account_transfers'
          AND event_id = (
              SELECT workflow_id FROM public.transfer_intents WHERE id = _intent_id
          );
    END IF;
    
    RETURN NEW;
END;
$function$;

ALTER FUNCTION "public"."reconcile_transfer_on_index"() OWNER TO "postgres";

-- Create the trigger on send_account_transfers
CREATE TRIGGER "send_account_transfers_reconcile_on_index"
    AFTER INSERT ON "public"."send_account_transfers"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."reconcile_transfer_on_index"();

-- ============================================================================
-- Phase 3: Create merged activity feed view
-- ============================================================================

-- This view provides a unified feed that merges:
-- - Pending transfers (from transfer_intents where not yet reconciled)
-- - Confirmed transfers (from indexed events, with notes from intents)
-- 
-- The key invariant: each transfer appears exactly once in the feed,
-- whether it's pending or confirmed.

CREATE OR REPLACE VIEW public.activity_feed_merged AS
WITH 
-- Get all reconciled transfers (have a link between intent and on-chain event)
reconciled AS (
    SELECT 
        r.intent_id,
        r.event_id,
        i.note,
        i.workflow_id
    FROM public.transfer_reconciliations r
    JOIN public.transfer_intents i ON r.intent_id = i.id
),
-- Get pending intents (not yet reconciled)
pending_intents AS (
    SELECT 
        ti.id as intent_id,
        ti.workflow_id,
        ti.status,
        ti.from_user_id,
        ti.to_user_id,
        ti.from_address,
        ti.to_address,
        ti.token_address,
        ti.amount,
        ti.chain_id,
        ti.note,
        ti.created_at
    FROM public.transfer_intents ti
    WHERE ti.status IN ('pending', 'submitted')
      AND NOT EXISTS (
          SELECT 1 FROM public.transfer_reconciliations r WHERE r.intent_id = ti.id
      )
)
-- PART 1: Regular activity feed items (non-transfer events + confirmed transfers)
SELECT 
    a.event_id,
    a.created_at,
    a.event_name,
    a.from_user_id,
    a.to_user_id,
    -- Merge note from reconciled intent if available
    CASE 
        WHEN a.event_name = 'send_account_transfers' AND r.note IS NOT NULL 
        THEN a.data || jsonb_build_object('note', r.note)
        ELSE a.data
    END as data
FROM public.activity a
LEFT JOIN reconciled r ON a.event_name = 'send_account_transfers' AND a.event_id = r.event_id
WHERE 
    -- Filter out temporal activities that have been reconciled
    NOT (a.event_name = 'temporal_send_account_transfers' AND EXISTS (
        SELECT 1 FROM reconciled WHERE workflow_id = a.event_id
    ))
    -- Standard activity feed filter (from or to user)
    AND (
        a.from_user_id = (SELECT auth.uid())
        OR (a.to_user_id = (SELECT auth.uid()) AND a.event_name NOT LIKE 'temporal_%')
    )

UNION ALL

-- PART 2: Pending intent activities (not yet indexed on-chain)
SELECT 
    pi.workflow_id as event_id,
    pi.created_at,
    'transfer_intent_pending' as event_name,
    pi.from_user_id,
    pi.to_user_id,
    jsonb_build_object(
        'status', pi.status::text,
        'from_address', encode(pi.from_address, 'hex'),
        'to_address', encode(pi.to_address, 'hex'),
        'token_address', encode(pi.token_address, 'hex'),
        'amount', pi.amount::text,
        'chain_id', pi.chain_id::text,
        'note', pi.note,
        'workflow_id', pi.workflow_id
    ) as data
FROM pending_intents pi
WHERE pi.from_user_id = (SELECT auth.uid());

-- ============================================================================
-- Phase 4: Grant permissions
-- ============================================================================

-- Grant permissions for the reconciliation function
REVOKE ALL ON FUNCTION "public"."reconcile_transfer_on_index"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."reconcile_transfer_on_index"() TO "service_role";

-- Grant permissions for the merged activity feed view
GRANT SELECT ON "public"."activity_feed_merged" TO "anon";
GRANT SELECT ON "public"."activity_feed_merged" TO "authenticated";
GRANT SELECT ON "public"."activity_feed_merged" TO "service_role";

-- ============================================================================
-- Phase 5: Comments
-- ============================================================================

COMMENT ON FUNCTION "public"."reconcile_transfer_on_index"() IS 
'Deterministic reconciliation trigger that links transfer_intents to on-chain events using exact keys (tx_hash, user_op_hash). Replaces fuzzy matching logic.';

COMMENT ON VIEW "public"."activity_feed_merged" IS 
'Unified activity feed that merges pending intents and confirmed transfers. Each transfer appears exactly once. Notes are always preserved from transfer_intents.';
