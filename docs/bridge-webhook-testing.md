# Bridge Webhook UI Flow Testing

This guide documents copy/paste commands for exercising the Bridge KYC + deposit UI flows and webhook handler using `bin/bridge-webhook-events.ts`. Replace only the send id (and email if needed).

## Prereqs

Ensure these are exported in your shell (direnv, `.envrc`, or manual):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`

If you use direnv:

```bash
direnv allow
```

Webhook handler requirements:
- `BRIDGE_WEBHOOK_PUBLIC_KEY` must match the private key used by the CLI.
- Local handler runs at `http://localhost:3000/api/bridge/webhook` by default.

## KYC Flow

Create a Bridge customer (if missing) and send KYC status updates:

```bash
BRIDGE_WEBHOOK_PRIVATE_KEY="$(cat /path/to/private.pem)" \
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow kyc \
  --create-customer \
  --email test@example.com \
  --delay-ms 4000
```

Send a specific KYC status sequence:

```bash
BRIDGE_WEBHOOK_PRIVATE_KEY="$(cat /path/to/private.pem)" \
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow kyc \
  --kyc-statuses incomplete,under_review,approved
```

Test a rejection flow:

```bash
BRIDGE_WEBHOOK_PRIVATE_KEY="$(cat /path/to/private.pem)" \
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow kyc \
  --kyc-statuses rejected
```

## Virtual Account + Deposit Flow

Create a virtual account (if missing) and send deposit status updates:

```bash
BRIDGE_WEBHOOK_PRIVATE_KEY="$(cat /path/to/private.pem)" \
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow deposit \
  --create-virtual-account \
  --amount 250
```

Custom deposit status sequence:

```bash
BRIDGE_WEBHOOK_PRIVATE_KEY="$(cat /path/to/private.pem)" \
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow deposit \
  --deposit-statuses funds_received,in_review,payment_submitted,payment_processed
```

## Full End-to-End Flow

Run KYC statuses then deposit statuses in order:

```bash
BRIDGE_WEBHOOK_PRIVATE_KEY="$(cat /path/to/private.pem)" \
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow all \
  --create-customer \
  --create-virtual-account \
  --email test@example.com \
  --delay-ms 3000
```

## Cleanup (Reset User State)

Delete the Bridge customer (cascades to virtual accounts + deposits):

```bash
bun run bin/bridge-webhook-events.ts --send-id 1234 --cleanup
```

Cleanup and delete matching webhook events:

```bash
bun run bin/bridge-webhook-events.ts --send-id 1234 --cleanup --cleanup-webhooks
```

Cleanup and exit without sending events:

```bash
bun run bin/bridge-webhook-events.ts --send-id 1234 --cleanup-only
```

## Dry Run (Print Payloads Only)

```bash
bun run bin/bridge-webhook-events.ts --send-id 1234 --flow all --dry-run
```

## Signature Key Setup

If you do not have a private key yet:
1) Run the CLI without `BRIDGE_WEBHOOK_PRIVATE_KEY`.
2) It will generate and print a public key.
3) Set that key in `BRIDGE_WEBHOOK_PUBLIC_KEY` for the webhook handler.

Example:

```bash
unset BRIDGE_WEBHOOK_PRIVATE_KEY
bun run bin/bridge-webhook-events.ts --send-id 1234 --flow kyc --dry-run
```

Then copy the printed public key into your env (server):

```bash
export BRIDGE_WEBHOOK_PUBLIC_KEY="-----BEGIN RSA PUBLIC KEY-----\n...\n-----END RSA PUBLIC KEY-----"
```

After that, re-run with `BRIDGE_WEBHOOK_PRIVATE_KEY` set and `--dry-run` removed.

## Notes

- Use `--send-id` (profiles.send_id) or `--user-id` (auth.users.id).
- `--email` is only required when creating the bridge customer.
- Default webhook URL is `http://localhost:3000/api/bridge/webhook`. Override with `--webhook-url`.
