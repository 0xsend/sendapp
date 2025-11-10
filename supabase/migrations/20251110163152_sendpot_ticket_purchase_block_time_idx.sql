CREATE INDEX "idx_sendpot_user_ticket_purchases_buyer_block_time" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("buyer", "block_time");
CREATE INDEX "idx_sendpot_user_ticket_purchases_block_time" ON "public"."sendpot_user_ticket_purchases" USING "btree" ("block_time");
