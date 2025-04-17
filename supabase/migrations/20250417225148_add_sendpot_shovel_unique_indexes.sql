
CREATE UNIQUE INDEX u_sendpot_jackpot_runs ON public.sendpot_jackpot_runs USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);

CREATE UNIQUE INDEX u_sendpot_user_ticket_purchases ON public.sendpot_user_ticket_purchases USING btree (ig_name, src_name, block_num, tx_idx, log_idx, abi_idx);
