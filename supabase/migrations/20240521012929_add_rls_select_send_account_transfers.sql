create policy "users can see their own transfers" on "public"."send_account_transfers" as permissive for
select
  to public using (
    (
      (lower(concat('0x', encode(f, 'hex'::text))))::citext IN (
        SELECT
          send_accounts.address
        FROM
          send_accounts
        WHERE
          (
            send_accounts.user_id = (
              SELECT
                auth.uid () AS uid
            )
          )
      ) or 
      (lower(concat('0x', encode(t, 'hex'::text))))::citext IN (
        SELECT
          send_accounts.address
        FROM
          send_accounts
        WHERE
          (
            send_accounts.user_id = (
              SELECT
                auth.uid () AS uid
            )
          )
      )
    )
  );
