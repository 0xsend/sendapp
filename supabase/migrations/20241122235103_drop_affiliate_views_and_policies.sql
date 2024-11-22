-- Drop existing views and types
DROP VIEW IF EXISTS affiliate_referrals;

DROP VIEW IF EXISTS affiliate_stats_summary;

DROP TYPE IF EXISTS affiliate_referral_type;

DROP TYPE IF EXISTS affiliate_stats_summary_type;

-- Drop policies (they'll be replaced by function-level security)
DROP POLICY IF EXISTS "Users can see referrals they've made" ON referrals;

DROP POLICY IF EXISTS "Users can see own and referrals affiliate stats" ON affiliate_stats;

