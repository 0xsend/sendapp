CREATE TABLE public.liquidity_pools(
    pool_name text NOT NULL,
    pool_type text NOT NULL,
    pool_addr bytea NOT NULL,
    chain_id integer NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX liquidity_pools_pool_addr_idx ON public.liquidity_pools USING btree(pool_addr, chain_id);
ALTER TABLE public.liquidity_pools ADD CONSTRAINT "liquidity_pools_pkey" PRIMARY KEY USING INDEX "liquidity_pools_pool_addr_idx";
ALTER TABLE public.liquidity_pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access to authenticated users" ON public.liquidity_pools FOR SELECT TO AUTHENTICATED USING (TRUE);

CREATE TABLE public.swap_routers(
    router_addr bytea NOT NULL,
    chain_id integer NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX swap_routers_router_addr_idx ON public.swap_routers USING btree(router_addr, chain_id);
ALTER TABLE public.swap_routers ADD CONSTRAINT "swap_routers_pkey" PRIMARY KEY USING INDEX "swap_routers_router_addr_idx";
ALTER TABLE public.swap_routers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access to authenticated users" ON public.swap_routers FOR SELECT TO AUTHENTICATED USING (TRUE);

-- kyberswap undocumented router address, it's not listed anywhere in API communication, need to add it manually
INSERT INTO public.swap_routers (router_addr, chain_id)
VALUES ('\xc7d3ab410d49b664d03fe5b1038852ac852b1b29', 8453);
