create or replace view "public"."activity_feed" as  SELECT a.created_at,
    a.event_name,
        CASE
            WHEN (a.from_user_id = from_p.id) THEN ROW(
            CASE
                WHEN (a.from_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
                ELSE NULL::uuid
            END, from_p.name, from_p.avatar_url, from_p.send_id, (( SELECT array_agg(t.name) AS array_agg
               FROM ((tags t
                 JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
                 JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
              WHERE ((sa.user_id = from_p.id) AND (t.status = 'confirmed'::tag_status))))::text[])::activity_feed_user
            ELSE NULL::activity_feed_user
        END AS from_user,
        CASE
            WHEN (a.to_user_id = to_p.id) THEN ROW(
            CASE
                WHEN (a.to_user_id = ( SELECT auth.uid() AS uid)) THEN ( SELECT auth.uid() AS uid)
                ELSE NULL::uuid
            END, to_p.name, to_p.avatar_url, to_p.send_id, (( SELECT array_agg(t.name) AS array_agg
               FROM ((tags t
                 JOIN send_account_tags sat ON ((sat.tag_id = t.id)))
                 JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
              WHERE ((sa.user_id = to_p.id) AND (t.status = 'confirmed'::tag_status))))::text[])::activity_feed_user
            ELSE NULL::activity_feed_user
        END AS to_user,
    a.data
   FROM ((activity a
     LEFT JOIN profiles from_p ON ((a.from_user_id = from_p.id)))
     LEFT JOIN profiles to_p ON ((a.to_user_id = to_p.id)))
  WHERE ((a.from_user_id = ( SELECT auth.uid() AS uid)) OR ((a.to_user_id = ( SELECT auth.uid() AS uid)) AND (a.event_name !~~ 'temporal_%'::text)))
  GROUP BY a.created_at, a.event_name, a.from_user_id, a.to_user_id, from_p.id, from_p.name, from_p.avatar_url, from_p.send_id, to_p.id, to_p.name, to_p.avatar_url, to_p.send_id, a.data;
