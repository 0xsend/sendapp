create policy "delete_own_webauthn_credentials" on "public"."webauthn_credentials" as permissive for
delete to authenticated using (((select auth.uid()) = user_id));
