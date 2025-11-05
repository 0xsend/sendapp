
-- Set distributions to our local fork of base mainnet (845337)
update distributions set chain_id = 845337 where chain_id = 8453;
