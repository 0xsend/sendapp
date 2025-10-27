alter table "public"."canton_party_verifications" add column "updated_at" timestamp with time zone default null;

create policy "Users can update their own canton verification"
on "public"."canton_party_verifications"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = user_id))
with check ((( SELECT auth.uid() AS uid) = user_id));



