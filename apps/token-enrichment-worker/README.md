# Token Enrichment Worker

Async worker service that enriches ERC20 token metadata from both on-chain contracts and off-chain data sources (CoinGecko).

## Purpose

The ERC20 indexer discovers tokens from transfers, but they initially lack metadata. This worker continuously enriches tokens with:

1. **On-chain data** (via RPC):
   - Token name
   - Token symbol
   - Decimals
   - Total supply

2. **Off-chain data** (via CoinGecko API):
   - Logo/image URL
   - Description
   - Website, Twitter, Telegram links
   - Current price (USD)
   - Market cap
   - 24h volume
   - Circulating/max supply

## How It Works

```
┌─────────────────────────────────────────┐
│ Every 10 minutes (configurable):        │
│                                          │
│ 1. Query get_tokens_needing_enrichment() │
│    - Prioritizes by total balance held  │
│    - Then by number of holders          │
│    - Then by block time (newest first)  │
│                                          │
│ 2. For each token:                       │
│    - Call contract to get name, symbol,  │
│      decimals, totalSupply               │
│    - Update erc20_tokens table           │
│    - Fetch metadata from CoinGecko API   │
│    - Update erc20_token_metadata table   │
│                                          │
│ 3. Rate limiting:                        │
│    - Wait 1.5s between tokens            │
│      (respects CoinGecko free tier)      │
└─────────────────────────────────────────┘
```

### Prioritization Strategy

The worker enriches tokens in order of importance:

1. **High balance tokens**: Tokens with significant total USD value across all holders
2. **Popular tokens**: Tokens with many holders
3. **Recent tokens**: Newly discovered tokens

This ensures the most relevant tokens are enriched first.

## Configuration

Copy `.env.example` to your root `.env` and configure:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
TOKEN_ENRICHMENT_RPC_URL=https://mainnet.base.org

# Optional (CoinGecko API)
COINGECKO_API_KEY=your-coingecko-api-key

# Optional (defaults shown)
TOKEN_ENRICHMENT_BATCH_SIZE=30              # Tokens per loop
TOKEN_ENRICHMENT_RATE_LIMIT_MS=1500         # Delay between tokens
TOKEN_ENRICHMENT_POLL_INTERVAL_MS=600000    # Loop interval (10 min)
TOKEN_ENRICHMENT_CHAIN_ID=8453              # Base mainnet
LOG_LEVEL=info
```

### CoinGecko Rate Limits

- **Free tier**: 50 calls/minute (1 call per 1.2s)
- **Pro tier**: 500 calls/minute (1 call per 0.12s)

Default rate limit is 1500ms (1.5s) for free tier. Adjust `TOKEN_ENRICHMENT_RATE_LIMIT_MS` based on your API key tier.

## Running Locally

```bash
# Install dependencies
yarn install

# Start the worker
yarn workspace token-enrichment-worker dev

# Or from root
yarn turbo run dev --filter=token-enrichment-worker
```

## Deployment

### Kubernetes

Deploy as a Deployment with 1 replica:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: token-enrichment-worker
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: worker
        image: your-registry/token-enrichment-worker:latest
        env:
          - name: NEXT_PUBLIC_SUPABASE_URL
            valueFrom:
              secretKeyRef:
                name: supabase
                key: url
          - name: SUPABASE_SERVICE_ROLE_KEY
            valueFrom:
              secretKeyRef:
                name: supabase
                key: service-role-key
          - name: TOKEN_ENRICHMENT_RPC_URL
            value: "https://mainnet.base.org"
          - name: COINGECKO_API_KEY
            valueFrom:
              secretKeyRef:
                name: coingecko
                key: api-key
                optional: true
          - name: TOKEN_ENRICHMENT_POLL_INTERVAL_MS
            value: "600000"
          - name: TOKEN_ENRICHMENT_BATCH_SIZE
            value: "30"
```

### Docker

```bash
# Build
docker build -t token-enrichment-worker -f apps/token-enrichment-worker/Dockerfile .

# Run
docker run -d \
  --env-file .env \
  --name token-enrichment-worker \
  token-enrichment-worker
```

## Monitoring

### Database Queries

```sql
-- View enrichment status
SELECT
    concat('0x', encode(address, 'hex')) as token,
    name,
    symbol,
    decimals,
    CASE
        WHEN name IS NULL OR symbol IS NULL OR decimals IS NULL THEN 'needs_enrichment'
        ELSE 'enriched'
    END as status
FROM erc20_tokens
ORDER BY block_time DESC
LIMIT 50;

-- Check metadata coverage
SELECT
    COUNT(*) FILTER (WHERE m.coingecko_id IS NOT NULL) as with_metadata,
    COUNT(*) FILTER (WHERE m.coingecko_id IS NULL) as without_metadata,
    COUNT(*) as total
FROM erc20_tokens t
LEFT JOIN erc20_token_metadata m ON t.address = m.token_address AND t.chain_id = m.chain_id;

-- View recent enrichments
SELECT
    concat('0x', encode(t.address, 'hex')) as token,
    t.symbol,
    m.logo_url,
    m.price_usd,
    m.market_cap_usd,
    m.last_successful_enrichment
FROM erc20_tokens t
JOIN erc20_token_metadata m ON t.address = m.token_address AND t.chain_id = m.chain_id
WHERE m.last_successful_enrichment IS NOT NULL
ORDER BY m.last_successful_enrichment DESC
LIMIT 50;
```

### Logs

The worker outputs structured JSON logs with pino:

```json
{
  "level": "info",
  "msg": "Enrichment loop completed",
  "processed": 30,
  "enriched": 28,
  "failed": 2,
  "duration": 45234
}
```

## Scaling

- **Single replica**: Sufficient for most workloads (default)
- **Multiple replicas**: Safe due to idempotent enrichment, prioritization ensures work distribution
- **Increase batch size**: Process more tokens per loop
- **Decrease poll interval**: Run enrichment more frequently
- **CoinGecko Pro API**: Reduce rate limit delay (100-500ms vs 1500ms)

## Token Discovery

Tokens are discovered automatically by:

1. **Trigger**: `send_account_transfers` insert triggers token discovery
2. **Cron job**: Historical discover-tokens job (for bootstrapping)

Once discovered, this worker enriches them with metadata.

## Relationship with Vercel Cron

This worker replaces the Vercel cron job at `/api/cron/enrich-token-data`. Benefits:

- **No vendor lock-in**: Runs on any infrastructure (K8s, Docker, etc.)
- **Better observability**: Structured logging, metrics
- **More control**: Configurable poll intervals, batch sizes, rate limits
- **Graceful shutdown**: Proper SIGTERM/SIGINT handling
- **Simpler deployment**: Part of monorepo, uses workspace dependencies
