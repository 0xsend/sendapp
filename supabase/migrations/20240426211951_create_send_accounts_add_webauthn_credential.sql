
-- Allow users to update credentials from their send account
create policy "update_own_account_credentials" on "public"."send_account_credentials" as permissive for update to authenticated using (
  (
    (select auth.uid()) = (
      select user_id
      from send_accounts
      where id = account_id
    )
  )
);

create or replace function public.send_accounts_add_webauthn_credential(
    send_account_id uuid,
    webauthn_credential webauthn_credentials,
    key_slot integer
)
    returns webauthn_credentials
    language plpgsql as
$function$
#variable_conflict use_column
declare
    _webauthn_credential webauthn_credentials;
    _key_slot alias for $3;
begin

    if ( select count(*) from send_accounts where id = send_account_id ) = 0 then
        raise exception 'Send account not found for ID %', send_account_id;
    end if;

    -- insert the credential
    insert into webauthn_credentials (name,
                                      display_name,
                                      raw_credential_id,
                                      public_key,
                                      sign_count,
                                      attestation_object,
                                      key_type)
    values (webauthn_credential.name,
            webauthn_credential.display_name,
            webauthn_credential.raw_credential_id,
            webauthn_credential.public_key,
            webauthn_credential.sign_count,
            webauthn_credential.attestation_object,
            webauthn_credential.key_type)
    returning * into _webauthn_credential;

    -- associate the credential with the send account replacing any existing credential with the same key slot
    insert into send_account_credentials (account_id, credential_id, key_slot)
    values (send_account_id,
            _webauthn_credential.id,
            _key_slot)
    on conflict (account_id, key_slot)
    do update set credential_id = _webauthn_credential.id, key_slot = _key_slot;

    -- return the result using the custom type
    return _webauthn_credential;
end;
$function$
;
