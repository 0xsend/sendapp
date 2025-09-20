set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.refresh_scores_on_distribution_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  active_distribution_id bigint;
  active_distribution_number integer;
  previous_distribution_id bigint;
BEGIN
  -- Run-once per transaction guard: emulate statement-level deferral so this
  -- function executes its core logic only once at commit, even though the
  -- trigger is FOR EACH ROW and DEFERRABLE. We use a tx-local GUC flag.
  IF current_setting('vars.refresh_scores_on_distribution_change_done', true) = '1' THEN
    RETURN NEW;
  END IF;
  PERFORM set_config('vars.refresh_scores_on_distribution_change_done', '1', true);

  -- Compute active distribution and previous distribution id in one pass
  WITH now_utc AS (
    SELECT CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AS now_ts
  ), active AS (
    SELECT id, number
    FROM distributions, now_utc n
    WHERE n.now_ts >= qualification_start
      AND n.now_ts <  qualification_end
    ORDER BY qualification_start DESC
    LIMIT 1
  ), prev AS (
    SELECT d.id
    FROM distributions d
    JOIN active a ON d.number = a.number - 1
    LIMIT 1
  ), prev_closed AS (
    SELECT id
    FROM distributions, now_utc n
    WHERE qualification_end < n.now_ts
    ORDER BY qualification_end DESC
    LIMIT 1
  )
  SELECT
    (SELECT id FROM active),
    (SELECT number FROM active),
    COALESCE((SELECT id FROM prev), (SELECT id FROM prev_closed))
  INTO active_distribution_id, active_distribution_number, previous_distribution_id;

  -- Winner-only gating: take an advisory lock per previous_distribution_id so only one
  -- transaction checks and refreshes the MV. Others skip this section and proceed.
  IF previous_distribution_id IS NOT NULL THEN
    -- Use two-key advisory lock: namespace 918273645 and the distribution id (cast to int4).
    -- Distribution ids are small in this system; cast is safe. Adjust if that changes.
    IF pg_try_advisory_xact_lock(918273645, previous_distribution_id::int) THEN
      -- Now safe to access the MV; non-winners won't block on MV locks.
      IF NOT EXISTS (
        SELECT 1 FROM private.send_scores_history h
        WHERE h.distribution_id = previous_distribution_id
        LIMIT 1
      ) THEN
        REFRESH MATERIALIZED VIEW private.send_scores_history;
      END IF;
    END IF;
  END IF;

  -- Insert tag registration verifications for the current active distribution once
  IF active_distribution_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.distribution_verifications dv
    WHERE dv.distribution_id = active_distribution_id
      AND dv.type = 'tag_registration'
    LIMIT 1
  ) THEN
    PERFORM public.insert_tag_registration_verifications(active_distribution_number);
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.insert_tag_registration_verifications(distribution_num integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Idempotent insert: avoid duplicating rows per (distribution_id, user_id, type, tag)
    INSERT INTO public.distribution_verifications(
        distribution_id,
        user_id,
        type,
        metadata,
        weight,
        created_at
    )
    SELECT
        (
            SELECT id
            FROM distributions
            WHERE "number" = distribution_num
            LIMIT 1
        ) AS distribution_id,
        t.user_id,
        'tag_registration'::public.verification_type AS type,
        jsonb_build_object('tag', t."name") AS metadata,
        CASE
            WHEN LENGTH(t.name) >= 6 THEN 1
            WHEN LENGTH(t.name) = 5 THEN 2
            WHEN LENGTH(t.name) = 4 THEN 3 -- Increase reward value of shorter tags
            WHEN LENGTH(t.name) > 0  THEN 4
            ELSE 0
        END AS weight,
        t.created_at AS created_at
    FROM tags t
    INNER JOIN tag_receipts tr ON t.name = tr.tag_name
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.distribution_verifications dv
        WHERE dv.distribution_id = (
            SELECT id FROM distributions WHERE "number" = distribution_num LIMIT 1
        )
        AND dv.user_id = t.user_id
        AND dv.type = 'tag_registration'::public.verification_type
        AND dv.metadata->>'tag' = t.name
    );
END;
$function$
;

CREATE CONSTRAINT TRIGGER refresh_send_scores_on_first_transfer AFTER INSERT ON public.send_token_transfers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION refresh_scores_on_distribution_change();


