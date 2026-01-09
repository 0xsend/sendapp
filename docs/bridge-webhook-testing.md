# Bridge Webhook UI Flow Testing (Local Only)

This is for local testing of Bridge webhooks + the UI flow only.
It invokes our webhook handler with a **private local key** and **mock data events** so you can test without completing real KYC.

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
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow kyc \
  --create-customer \
  --email test@example.com \
  --delay-ms 4000
```

Send a specific KYC status sequence:

```bash
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow kyc \
  --kyc-statuses incomplete,under_review,approved
```

Test a rejection flow:

```bash
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow kyc \
  --kyc-statuses rejected
```

## Virtual Account + Deposit Flow

Create a virtual account (if missing) and send deposit status updates:

```bash
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow deposit \
  --create-virtual-account \
  --amount 250
```

Custom deposit status sequence:

```bash
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow deposit \
  --deposit-statuses funds_received,in_review,payment_submitted,payment_processed
```

## Full End-to-End Flow

Run KYC statuses then deposit statuses in order:

```bash
bun run bin/bridge-webhook-events.ts \
  --send-id 1234 \
  --flow all \
  --create-customer \
  --create-virtual-account \
  --email test@example.com \
  --delay-ms 3000
```

## Cleanup (Reset User State)

Delete the Bridge customer (cascades to virtual accounts + deposits) and related webhook events:

```bash
bun run bin/bridge-webhook-events.ts --send-id 1234 --cleanup
```

Cleanup and delete matching webhook events:

```bash
```

## Dry Run (Print Payloads Only)

```bash
bun run bin/bridge-webhook-events.ts --send-id 1234 --flow all --dry-run
```

## Interactive Mode

Guided prompts for local testing:

```bash
bun run bin/bridge-webhook-events.ts --interactive
```

## Signature Key Setup

If you do not have a private key yet:
1) Unset `BRIDGE_WEBHOOK_PRIVATE_KEY_TESTING_ONLY`.
2) Run the CLI; it will generate and print a public key.
3) Set that key in `BRIDGE_WEBHOOK_PUBLIC_KEY` for the webhook handler.

Example:

```bash
unset BRIDGE_WEBHOOK_PRIVATE_KEY_TESTING_ONLY
bun run bin/bridge-webhook-events.ts --send-id 1234 --flow kyc --dry-run
```

Then copy the printed public key into your env (server):

```bash
BRIDGE_WEBHOOK_PUBLIC_KEY="-----BEGIN RSA PUBLIC KEY-----\n...\n-----END RSA PUBLIC KEY-----"
```

After that, set `BRIDGE_WEBHOOK_PRIVATE_KEY_TESTING_ONLY` and re-run without `--dry-run`.

## Notes

- Use `--send-id` (profiles.send_id) or `--user-id` (auth.users.id).
- `--email` is only required when creating the bridge customer.
- `--interactive` runs a guided prompt and ignores other flags.
- Default webhook URL is `http://localhost:3000/api/bridge/webhook`. Override with `--webhook-url`.
