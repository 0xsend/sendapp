drop function if exists "public"."get_user_jackpot_summary"(num_runs integer);

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_user_jackpot_summary(num_runs integer)
 RETURNS TABLE(jackpot_run_id integer, jackpot_block_num numeric, jackpot_block_time numeric, winner bytea, win_amount numeric, total_tickets numeric, winner_tag_name citext)
 LANGUAGE sql
AS $function$
WITH cte AS (
  SELECT
    r.id AS jackpot_run_id,
    r.block_num AS jackpot_block_num,
    r.block_time AS jackpot_block_time,
    r.winner,
    r.win_amount,
    -- "prev_block_num" is the block_num of the previous jackpot (or 0 if none)
    COALESCE(
      LAG(r.block_num) OVER (ORDER BY r.block_num ASC),
      0
    ) AS prev_block_num
  FROM public.sendpot_jackpot_runs r
)
SELECT
  c.jackpot_run_id,
  c.jackpot_block_num,
  c.jackpot_block_time,
  c.winner,
  c.win_amount,
  (
    SELECT COALESCE(SUM(utp.tickets_purchased_total_bps), 0)
    FROM public.sendpot_user_ticket_purchases utp
    WHERE utp.block_num >= c.prev_block_num
      AND utp.block_num < c.jackpot_block_num
  ) AS total_tickets,
  (
    SELECT t.name
    FROM public.send_accounts sa
    JOIN public.tags t ON t.id = sa.main_tag_id
    WHERE sa.address_bytes = c.winner
      AND t.status = 'confirmed'
    LIMIT 1
  ) AS winner_tag_name
FROM cte c
ORDER BY c.jackpot_block_num DESC
LIMIT num_runs;
$function$
;


