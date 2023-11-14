CREATE OR REPLACE FUNCTION generate_referral_code() RETURNS text AS $$
BEGIN

RETURN substr(md5(random()::text), 0, 12);

END;
$$ LANGUAGE plpgsql;