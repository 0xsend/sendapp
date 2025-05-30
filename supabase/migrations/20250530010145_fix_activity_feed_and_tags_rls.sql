drop policy "delete_policy" on "public"."tags";

drop policy "insert_policy" on "public"."tags";

drop policy "select_policy" on "public"."tags";

drop policy "update_policy" on "public"."tags";

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


create policy "delete_policy"
on "public"."tags"
as permissive
for delete
to authenticated
using (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = auth.uid()))))));


create policy "insert_policy"
on "public"."tags"
as permissive
for insert
to public
with check ((((auth.uid() = user_id) AND (user_id IS NOT NULL)) OR (current_setting('role'::text) = 'service_role'::text)));


create policy "select_policy"
on "public"."tags"
as permissive
for select
to public
using (((status = 'confirmed'::tag_status) OR (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = auth.uid())))) OR (current_setting('role'::text) = 'service_role'::text)));


create policy "update_policy"
on "public"."tags"
as permissive
for update
to public
using (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = auth.uid()))))))
with check (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = auth.uid()))))));



