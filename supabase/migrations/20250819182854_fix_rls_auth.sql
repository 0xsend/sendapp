drop policy "User can see own affiliate stats" on "public"."affiliate_stats";

drop policy "Addresses are viewable by users who created them." on "public"."chain_addresses";

drop policy "User can see own shares" on "public"."distribution_shares";

drop policy "Profiles are viewable by users who created them." on "public"."profiles";

drop policy "Users can insert their own profile." on "public"."profiles";

drop policy "Users can update own profile." on "public"."profiles";

drop policy "Receipts are viewable by users." on "public"."receipts";

drop policy "delete_own_account_credentials" on "public"."send_account_credentials";

drop policy "insert_own_account_credentials" on "public"."send_account_credentials";

drop policy "select_own_account_credentials" on "public"."send_account_credentials";

drop policy "insert_own_accounts" on "public"."send_accounts";

drop policy "select_own_accounts" on "public"."send_accounts";

drop policy "update_own_accounts" on "public"."send_accounts";

drop policy "users can see their own ticket purchases" on "public"."sendpot_user_ticket_purchases";

drop policy "insert_own_credentials" on "public"."webauthn_credentials";

drop policy "select_own_credentials" on "public"."webauthn_credentials";

drop policy "update_own_credentials" on "public"."webauthn_credentials";

set check_function_bodies = off;

create policy "User can see own affiliate stats"
on "public"."affiliate_stats"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Addresses are viewable by users who created them."
on "public"."chain_addresses"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "User can see own shares"
on "public"."distribution_shares"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "Profiles are viewable by users who created them."
on "public"."profiles"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = id));


create policy "Users can insert their own profile."
on "public"."profiles"
as permissive
for insert
to public
with check ((( SELECT auth.uid() AS uid) = id));


create policy "Users can update own profile."
on "public"."profiles"
as permissive
for update
to public
using ((( SELECT auth.uid() AS uid) = id));


create policy "Receipts are viewable by users."
on "public"."receipts"
as permissive
for select
to public
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "delete_own_account_credentials"
on "public"."send_account_credentials"
as permissive
for delete
to authenticated
using ((( SELECT auth.uid() AS uid) = ( SELECT send_accounts.user_id
   FROM send_accounts
  WHERE (send_accounts.id = send_account_credentials.account_id))));


create policy "insert_own_account_credentials"
on "public"."send_account_credentials"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = ( SELECT send_accounts.user_id
   FROM send_accounts
  WHERE (send_accounts.id = send_account_credentials.account_id))));


create policy "select_own_account_credentials"
on "public"."send_account_credentials"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = ( SELECT send_accounts.user_id
   FROM send_accounts
  WHERE (send_accounts.id = send_account_credentials.account_id))));


create policy "insert_own_accounts"
on "public"."send_accounts"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "select_own_accounts"
on "public"."send_accounts"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "update_own_accounts"
on "public"."send_accounts"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "users can see their own ticket purchases"
on "public"."sendpot_user_ticket_purchases"
as permissive
for select
to public
using (((lower(concat('0x', encode(recipient, 'hex'::text))))::citext IN ( SELECT sa.address
   FROM send_accounts sa
  WHERE (sa.user_id = ( SELECT auth.uid() AS uid)))));


create policy "insert_own_credentials"
on "public"."webauthn_credentials"
as permissive
for insert
to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));


create policy "select_own_credentials"
on "public"."webauthn_credentials"
as permissive
for select
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));


create policy "update_own_credentials"
on "public"."webauthn_credentials"
as permissive
for update
to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



