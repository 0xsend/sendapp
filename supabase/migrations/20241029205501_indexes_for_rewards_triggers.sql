CREATE INDEX idx_distributions_qualification_dates ON distributions(qualification_start, qualification_end);

CREATE INDEX idx_send_accounts_address ON send_accounts(address);

CREATE INDEX idx_send_account_transfers_f_t_block_time ON send_account_transfers(f, t, block_time);

CREATE INDEX idx_distribution_verifications_composite ON distribution_verifications(distribution_id, user_id, type);

