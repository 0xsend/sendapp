
CREATE INDEX idx_tags_status ON public.tags USING btree (status) WHERE (status = 'available'::tag_status);
