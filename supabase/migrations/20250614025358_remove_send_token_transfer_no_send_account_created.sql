set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.filter_send_token_transfers_with_no_send_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if exists ( select 1 from send_account_created where account = new.f )
    or exists ( select 1 from send_account_created where account = new.t )
  then
    return new;
  else
    return null;
  end if;
end;
$function$
;

CREATE OR REPLACE FUNCTION private.filter_send_token_v0_transfers_with_no_send_account_created()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  if exists ( select 1 from send_account_created where account = new.f )
    or exists ( select 1 from send_account_created where account = new.t )
  then
    return new;
  else
    return null;
  end if;
end;
$function$
;


drop policy "Users can see their own token transfers" on "public"."send_token_transfers";

drop policy "Users can see their own token transfers" on "public"."send_token_v0_transfers";

CREATE INDEX idx_send_token_transfers_f_t_block_time ON public.send_token_transfers USING btree (f, t, block_time);

create policy "users can see their own transfers"
on "public"."send_token_transfers"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND ((send_accounts.address = (lower(concat('0x', encode(send_token_transfers.f, 'hex'::text))))::citext) OR (send_accounts.address = (lower(concat('0x', encode(send_token_transfers.t, 'hex'::text))))::citext))))));


create policy "users can see their own transfers"
on "public"."send_token_v0_transfers"
as permissive
for select
to public
using ((EXISTS ( SELECT 1
   FROM send_accounts
  WHERE ((send_accounts.user_id = ( SELECT auth.uid() AS uid)) AND ((send_accounts.address = (lower(concat('0x', encode(send_token_v0_transfers.f, 'hex'::text))))::citext) OR (send_accounts.address = (lower(concat('0x', encode(send_token_v0_transfers.t, 'hex'::text))))::citext))))));



CREATE TRIGGER filter_send_token_transfers_with_no_send_account_created BEFORE INSERT ON public.send_token_transfers FOR EACH ROW EXECUTE FUNCTION private.filter_send_token_transfers_with_no_send_account_created();

CREATE TRIGGER filter_send_token_v0_transfers_with_no_send_account_created BEFORE INSERT ON public.send_token_v0_transfers FOR EACH ROW EXECUTE FUNCTION private.filter_send_token_v0_transfers_with_no_send_account_created();


-- Delete from send_token_transfers where neither account exists
DELETE FROM send_token_transfers
WHERE NOT EXISTS (SELECT 1 FROM send_account_created WHERE account = f)
AND NOT EXISTS (SELECT 1 FROM send_account_created WHERE account = t);

-- Delete from send_token_v0_transfers where neither account exists
DELETE FROM send_token_v0_transfers
WHERE NOT EXISTS (SELECT 1 FROM send_account_created WHERE account = f)
AND NOT EXISTS (SELECT 1 FROM send_account_created WHERE account = t);