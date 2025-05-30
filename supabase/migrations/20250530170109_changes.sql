drop policy "delete_policy" on "public"."tags";

drop policy "insert_policy" on "public"."tags";

drop policy "select_policy" on "public"."tags";

drop policy "update_policy" on "public"."tags";

create policy "delete_policy"
on "public"."tags"
as permissive
for delete
to authenticated
using (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid)))))));


create policy "insert_policy"
on "public"."tags"
as permissive
for insert
to public
with check (((( SELECT auth.uid() AS uid) = user_id) AND (user_id IS NOT NULL)));


create policy "select_policy"
on "public"."tags"
as permissive
for select
to public
using (((status = 'confirmed'::tag_status) OR (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid))))) OR (current_setting('role'::text) = 'service_role'::text)));


create policy "update_policy"
on "public"."tags"
as permissive
for update
to public
using (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid)))))))
with check (((status = 'pending'::tag_status) AND (EXISTS ( SELECT 1
   FROM (send_account_tags sat
     JOIN send_accounts sa ON ((sa.id = sat.send_account_id)))
  WHERE ((sat.tag_id = tags.id) AND (sa.user_id = ( SELECT auth.uid() AS uid)))))));



