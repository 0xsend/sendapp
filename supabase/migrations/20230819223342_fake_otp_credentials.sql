-- Allow for devs to bypass OTP
create or replace function public.fake_otp_credentials(phone text) returns void language plpgsql as $function$ # variable_conflict use_column
    begin
update auth.users
set confirmation_sent_at = now(),
    confirmation_token = encode(
        sha224(concat(auth.users.phone, '123456')::bytea),
        'hex'
    )
where auth.users.phone = $1;

end $function$;

revoke all on function fake_otp_credentials(text)
from public;

revoke all on function fake_otp_credentials(text)
from anon;

revoke all on function fake_otp_credentials(text)
from authenticated;

grant execute on function fake_otp_credentials(text) to service_role;
