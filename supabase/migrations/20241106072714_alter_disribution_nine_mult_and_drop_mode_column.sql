DROP VIEW IF EXISTS "public"."distribution_verifications_summary";

ALTER TABLE "public"."distribution_verification_values"
   DROP COLUMN "mode";

-- chaneg distribution_nine send_streak multiplier_max from 5.0 to 2.0 and change the step to .05
UPDATE
   distribution_verification_values
SET
   multiplier_max = 2.0,
   multiplier_step = 0.05
WHERE
   distribution_id = 9
   AND type = 'send_streak';

