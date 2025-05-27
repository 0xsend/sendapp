CREATE INDEX idx_affiliate_stats_user_created ON public.affiliate_stats USING btree (user_id, created_at DESC);

CREATE INDEX idx_send_accounts_address_user ON public.send_accounts USING btree (address, user_id);

CREATE INDEX idx_sendtag_receipts ON public.sendtag_checkout_receipts USING btree (amount, reward);

CREATE INDEX idx_tags_status_created ON public.tags USING btree (status, created_at DESC) WHERE (status = 'confirmed'::tag_status);

