# Bridge Virtual Accounts Implementation Plan

## Overview

Integrate Bridge XYZ virtual accounts to enable ACH/Wire deposit functionality with KYC verification. Users will be able to deposit USD via bank transfer (ACH push or wire) which will be converted to USDC and delivered to their Send wallet.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Flow                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. User selects "Bank Transfer" deposit option                             │
│                    ↓                                                         │
│  2. Check if user has Bridge customer + virtual account                     │
│          ↓ No                          ↓ Yes                                │
│  3a. Create KYC Link → User completes KYC    3b. Show bank details         │
│          ↓                                           ↓                       │
│  4. Webhook: KYC approved → Create virtual account   │                      │
│          ↓                                           │                       │
│  5. Show bank account details (routing/account #)    │                      │
│          ↓                                           ↓                       │
│  6. User sends ACH/Wire from their bank ─────────────┘                      │
│          ↓                                                                   │
│  7. Webhook: funds_received → Bridge converts to USDC                       │
│          ↓                                                                   │
│  8. Webhook: payment_processed → USDC delivered to wallet                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Bridge API Reference

### Base URL
- Production: `https://api.bridge.xyz/v0`
- Sandbox: `https://api.sandbox.bridge.xyz/v0`

### Authentication
All requests require:
```
Content-Type: application/json
Api-Key: <API_KEY>
Idempotency-Key: <UUID> (for POST requests)
```

### Webhook Signature Verification
Bridge signs webhook payloads. Capture the raw request body, verify the signature
header (e.g. `X-Bridge-Signature`) before JSON parsing, and reject duplicates by
event ID.

### Store vs Fetch Checklist
Store locally (webhook-driven, source of truth for UI):
- `bridge_customer_id`, `kyc_status`, `tos_status`, `kyc_link_id`
- Active virtual account details needed for display
- Deposit status timeline (one row per transfer/payment)
- Raw webhook payload + processed status (for idempotency/debug)

Fetch from Bridge (on demand / reconciliation):
- Create KYC link and virtual account
- Refresh KYC/TOS link for incomplete users
- Reconcile missing virtual accounts or deposits if webhooks were missed
- Periodic sanity checks on status drift (optional cron)

Avoid over-indexing: only store fields required for UX, support, and audits.

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/kyc_links` | POST | Create KYC link for new customer |
| `/kyc_links/:id` | GET | Check KYC link status |
| `/customers/:id` | GET | Get customer details |
| `/customers/:id/kyc_link` | GET | Get KYC link for existing customer |
| `/customers/:id/virtual_accounts` | POST | Create virtual account |
| `/customers/:id/virtual_accounts` | GET | List virtual accounts |
| `/webhooks` | POST | Create webhook endpoint |

### KYC Link Request
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "type": "individual",
  "redirect_uri": "https://send.app/deposit/bank-transfer/callback"
}
```

### KYC Link Response
```json
{
  "id": "kyc_link_xxx",
  "full_name": "John Doe",
  "email": "john@example.com",
  "type": "individual",
  "kyc_link": "https://verify.bridge.xyz/...",
  "tos_link": "https://verify.bridge.xyz/tos/...",
  "kyc_status": "not_started",
  "tos_status": "pending",
  "customer_id": null,
  "created_at": "2025-01-01T00:00:00Z"
}
```

### KYC Status Values
- `not_started` - KYC flow not begun
- `incomplete` - User started but didn't finish
- `under_review` - Manual review in progress
- `approved` - KYC passed
- `rejected` - KYC failed
- `paused` - KYC paused by compliance
- `offboarded` - Customer offboarded

### Virtual Account Request
```json
{
  "source_currency": "usd",
  "destination_currency": "usdc",
  "destination_payment_rail": "base",
  "destination_address": "0x..."
}
```

### Virtual Account Response
```json
{
  "id": "va_xxx",
  "customer_id": "cust_xxx",
  "source_deposit_instructions": {
    "currency": "usd",
    "bank_name": "Lead Bank",
    "bank_routing_number": "123456789",
    "bank_account_number": "9876543210",
    "bank_beneficiary_name": "John Doe",
    "bank_beneficiary_address": "...",
    "payment_rails": ["ach_push", "wire"]
  },
  "destination_currency": "usdc",
  "destination_payment_rail": "base",
  "destination_address": "0x..."
}
```

### Webhook Events
| Event | Description |
|-------|-------------|
| `kyc_link.kyc_status.not_started` | KYC link created |
| `kyc_link.kyc_status.approved` | KYC approved |
| `kyc_link.kyc_status.rejected` | KYC rejected |
| `kyc_link.kyc_status.paused` | KYC paused |
| `kyc_link.kyc_status.offboarded` | Customer offboarded |
| `virtual_account.funds_received` | Deposit received |
| `virtual_account.in_review` | Deposit flagged for review |
| `virtual_account.payment_submitted` | Conversion started |
| `virtual_account.payment_processed` | USDC delivered |
| `virtual_account.refund` | Deposit refunded |

---

## Implementation Tasks

### Phase 1: Database Schema

#### 1.1 Create `bridge_customers` table
Store Bridge customer data linked to Send users.

```sql
-- supabase/schemas/bridge_customers.sql
create table bridge_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bridge_customer_id text unique,
  kyc_link_id text unique not null,
  kyc_status text not null default 'not_started',
  tos_status text not null default 'pending',
  full_name text not null,
  email text not null,
  type text not null default 'individual',
  rejection_reasons jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bridge_customers_user_id_unique unique (user_id),
  constraint bridge_customers_kyc_status_check check (
    kyc_status in ('not_started', 'incomplete', 'under_review', 'approved', 'rejected', 'paused', 'offboarded')
  ),
  constraint bridge_customers_tos_status_check check (
    tos_status in ('pending', 'approved')
  )
);

-- Indexes
create index bridge_customers_user_id_idx on bridge_customers(user_id);
create index bridge_customers_bridge_customer_id_idx on bridge_customers(bridge_customer_id);
create index bridge_customers_kyc_link_id_idx on bridge_customers(kyc_link_id);

-- RLS
alter table bridge_customers enable row level security;

create policy "Users can view own bridge customer"
  on bridge_customers for select
  using (auth.uid() = user_id);

-- Trigger for updated_at
create trigger bridge_customers_updated_at
  before update on bridge_customers
  for each row execute function moddatetime(updated_at);
```

#### 1.2 Create `bridge_virtual_accounts` table
Store virtual account details for deposits.

```sql
-- supabase/schemas/bridge_virtual_accounts.sql
create table bridge_virtual_accounts (
  id uuid primary key default gen_random_uuid(),
  bridge_customer_id uuid not null references bridge_customers(id) on delete cascade,
  bridge_virtual_account_id text unique not null,
  source_currency text not null default 'usd',
  destination_currency text not null default 'usdc',
  destination_payment_rail text not null default 'base',
  destination_address text not null,
  bank_name text,
  bank_routing_number text,
  bank_account_number text,
  bank_beneficiary_name text,
  bank_beneficiary_address text,
  payment_rails text[] not null default '{}'::text[],
  source_deposit_instructions jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bridge_virtual_accounts_status_check check (
    status in ('active', 'inactive', 'closed')
  )
);

-- Indexes
create index bridge_virtual_accounts_bridge_customer_id_idx on bridge_virtual_accounts(bridge_customer_id);
create index bridge_virtual_accounts_bridge_va_id_idx on bridge_virtual_accounts(bridge_virtual_account_id);
create unique index bridge_virtual_accounts_active_unique
  on bridge_virtual_accounts(bridge_customer_id)
  where status = 'active';

-- RLS
alter table bridge_virtual_accounts enable row level security;

create policy "Users can view own virtual accounts"
  on bridge_virtual_accounts for select
  using (
    exists (
      select 1 from bridge_customers bc
      where bc.id = bridge_virtual_accounts.bridge_customer_id
      and bc.user_id = auth.uid()
    )
  );

-- Trigger
create trigger bridge_virtual_accounts_updated_at
  before update on bridge_virtual_accounts
  for each row execute function moddatetime(updated_at);
```

#### 1.3 Create `bridge_webhook_events` table
Store raw webhook events for idempotency and debugging.

```sql
-- supabase/schemas/bridge_webhook_events.sql
create table bridge_webhook_events (
  id uuid primary key default gen_random_uuid(),
  bridge_event_id text unique not null,
  event_type text not null,
  event_created_at timestamptz,
  payload jsonb not null,
  processed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index bridge_webhook_events_event_type_idx on bridge_webhook_events(event_type);
create index bridge_webhook_events_created_at_idx on bridge_webhook_events(created_at desc);

alter table bridge_webhook_events enable row level security;
-- No RLS policies: service-role only.
```

#### 1.4 Create `bridge_deposits` table
Track deposit events and status.

```sql
-- supabase/schemas/bridge_deposits.sql
create table bridge_deposits (
  id uuid primary key default gen_random_uuid(),
  virtual_account_id uuid not null references bridge_virtual_accounts(id),
  bridge_transfer_id text unique not null,
  last_event_id text,
  last_event_type text,
  payment_rail text not null,
  amount numeric not null,
  currency text not null default 'usd',
  status text not null default 'funds_received',
  sender_name text,
  sender_routing_number text,
  trace_number text,
  destination_tx_hash text,
  fee_amount numeric,
  net_amount numeric,
  event_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint bridge_deposits_status_check check (
    status in ('funds_received', 'in_review', 'payment_submitted', 'payment_processed', 'refund')
  ),
  constraint bridge_deposits_payment_rail_check check (
    payment_rail in ('ach_push', 'wire')
  )
);

-- Indexes
create index bridge_deposits_virtual_account_id_idx on bridge_deposits(virtual_account_id);
create index bridge_deposits_status_idx on bridge_deposits(status);
create index bridge_deposits_created_at_idx on bridge_deposits(created_at desc);

-- RLS
alter table bridge_deposits enable row level security;

create policy "Users can view own deposits"
  on bridge_deposits for select
  using (
    exists (
      select 1 from bridge_virtual_accounts bva
      join bridge_customers bc on bc.id = bva.bridge_customer_id
      where bva.id = bridge_deposits.virtual_account_id
      and bc.user_id = auth.uid()
    )
  );

-- Trigger
create trigger bridge_deposits_updated_at
  before update on bridge_deposits
  for each row execute function moddatetime(updated_at);
```

Use the stable transfer/payment identifier from webhook payloads for
`bridge_transfer_id` so multiple events update the same deposit record.

---

### Phase 2: Backend Service

#### 2.1 Create Bridge API client package

Location: `packages/bridge/`

```
packages/bridge/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── client.ts          # API client
│   ├── types.ts           # TypeScript types
│   ├── webhooks.ts        # Webhook signature verification
│   └── errors.ts          # Error handling
```

**Key Types:**
```typescript
// types.ts
export type KycStatus =
  | 'not_started'
  | 'incomplete'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'paused'
  | 'offboarded';

export type TosStatus = 'pending' | 'approved';

export interface KycLinkRequest {
  full_name: string;
  email: string;
  type: 'individual' | 'business';
  redirect_uri?: string;
  endorsements?: string[];
}

export interface KycLinkResponse {
  id: string;
  full_name: string;
  email: string;
  type: 'individual' | 'business';
  kyc_link: string;
  tos_link: string;
  kyc_status: KycStatus;
  tos_status: TosStatus;
  customer_id: string | null;
  rejection_reasons: string[] | null;
  created_at: string;
}

export interface VirtualAccountRequest {
  source_currency: 'usd';
  destination_currency: 'usdc';
  destination_payment_rail: 'base';
  destination_address: string;
}

export interface VirtualAccountResponse {
  id: string;
  customer_id: string;
  source_deposit_instructions: {
    currency: string;
    bank_name: string;
    bank_routing_number: string;
    bank_account_number: string;
    bank_beneficiary_name: string;
    bank_beneficiary_address: string;
    payment_rails: ('ach_push' | 'wire')[];
  };
  destination_currency: string;
  destination_payment_rail: string;
  destination_address: string;
}

export interface CustomerResponse {
  id: string;
  full_name: string;
  email: string;
  kyc_status: KycStatus;
  tos_status: TosStatus;
  created_at: string;
}

export type WebhookEventType =
  | 'kyc_link.kyc_status.not_started'
  | 'kyc_link.kyc_status.incomplete'
  | 'kyc_link.kyc_status.under_review'
  | 'kyc_link.kyc_status.approved'
  | 'kyc_link.kyc_status.rejected'
  | 'kyc_link.kyc_status.paused'
  | 'kyc_link.kyc_status.offboarded'
  | 'virtual_account.funds_received'
  | 'virtual_account.in_review'
  | 'virtual_account.payment_submitted'
  | 'virtual_account.payment_processed'
  | 'virtual_account.refund';

export interface WebhookEvent {
  id: string;
  type: WebhookEventType;
  data: Record<string, unknown>;
  created_at: string;
}
```

**Client Implementation:**
```typescript
// client.ts
import { randomUUID } from 'node:crypto';

export class BridgeClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: { apiKey: string; sandbox?: boolean }) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.sandbox
      ? 'https://api.sandbox.bridge.xyz/v0'
      : 'https://api.bridge.xyz/v0';
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options?: { idempotencyKey?: string }
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Api-Key': this.apiKey,
    };

    if (method === 'POST') {
      headers['Idempotency-Key'] = options?.idempotencyKey ?? randomUUID();
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new BridgeApiError(response.status, error);
    }

    return response.json();
  }

  // KYC Links
  async createKycLink(
    data: KycLinkRequest,
    options?: { idempotencyKey?: string }
  ): Promise<KycLinkResponse> {
    return this.request('POST', '/kyc_links', data, options);
  }

  async getKycLink(id: string): Promise<KycLinkResponse> {
    return this.request('GET', `/kyc_links/${id}`);
  }

  async getCustomerKycLink(customerId: string): Promise<{ kyc_link: string }> {
    return this.request('GET', `/customers/${customerId}/kyc_link`);
  }

  // Customers
  async getCustomer(id: string): Promise<CustomerResponse> {
    return this.request('GET', `/customers/${id}`);
  }

  // Virtual Accounts
  async createVirtualAccount(
    customerId: string,
    data: VirtualAccountRequest,
    options?: { idempotencyKey?: string }
  ): Promise<VirtualAccountResponse> {
    return this.request(
      'POST',
      `/customers/${customerId}/virtual_accounts`,
      data,
      options
    );
  }

  async listVirtualAccounts(customerId: string): Promise<VirtualAccountResponse[]> {
    return this.request('GET', `/customers/${customerId}/virtual_accounts`);
  }

  // Webhooks
  async createWebhook(
    url: string,
    events: WebhookEventType[],
    options?: { idempotencyKey?: string }
  ): Promise<WebhookResponse> {
    return this.request('POST', '/webhooks', { url, enabled_events: events }, options);
  }
}
```

#### 2.2 Create webhook handler service

Location: `apps/bridge-webhook/` (new Express service, similar to distributor)

```
apps/bridge-webhook/
├── package.json
├── tsconfig.json
├── Dockerfile
├── src/
│   ├── server.ts
│   ├── app.ts
│   ├── handlers/
│   │   ├── kyc.ts         # KYC event handlers
│   │   └── deposits.ts    # Deposit event handlers
│   └── supabase.ts
```

**Webhook Processing Flow:**
1. Verify signature using raw request body.
2. Insert event into `bridge_webhook_events`; if `bridge_event_id` already exists, return 200.
3. Dispatch handler by `event.type`, then set `processed_at` or `error`.

**Webhook Handler:**
```typescript
// handlers/kyc.ts
export async function handleKycStatus(
  event: WebhookEvent,
  supabase: SupabaseClient
) {
  const { kyc_link_id, customer_id, kyc_status, tos_status } = event.data;

  // Update bridge_customers for any KYC/TOS status change
  const { data: customer, error } = await supabase
    .from('bridge_customers')
    .update({
      bridge_customer_id: customer_id ?? undefined,
      kyc_status,
      tos_status: tos_status ?? undefined,
    })
    .eq('kyc_link_id', kyc_link_id)
    .select()
    .single();

  if (error) throw error;

  // Auto-create virtual account for approved customers (idempotent)
  if (kyc_status === 'approved' && customer_id) {
    await createVirtualAccountForCustomer(customer, supabase);
  }
}

// handlers/deposits.ts
export async function handleFundsReceived(
  event: WebhookEvent,
  supabase: SupabaseClient
) {
  const {
    id,
    transfer_id, // Use Bridge's stable transfer/payment identifier from docs
    virtual_account_id,
    amount,
    payment_rail,
    sender_name,
    trace_number
  } = event.data;

  if (amount < 1) return; // Ignore microdeposits

  // Find virtual account
  const { data: va } = await supabase
    .from('bridge_virtual_accounts')
    .select('id')
    .eq('bridge_virtual_account_id', virtual_account_id)
    .single();

  // Insert or update deposit record (idempotent per transfer)
  await supabase.from('bridge_deposits').upsert({
    virtual_account_id: va.id,
    bridge_transfer_id: transfer_id,
    payment_rail,
    amount,
    currency: 'usd',
    status: 'funds_received',
    sender_name,
    trace_number,
    last_event_id: id,
    last_event_type: event.type,
    event_data: event.data,
  }, { onConflict: 'bridge_transfer_id' });
}

export async function handlePaymentProcessed(
  event: WebhookEvent,
  supabase: SupabaseClient
) {
  const {
    id,
    transfer_id,
    destination_tx_hash,
    fee_amount,
    net_amount
  } = event.data;

  await supabase
    .from('bridge_deposits')
    .update({
      status: 'payment_processed',
      destination_tx_hash,
      fee_amount,
      net_amount,
      last_event_id: id,
      last_event_type: event.type,
    })
    .eq('bridge_transfer_id', transfer_id);
}

export async function handlePaymentSubmitted(
  event: WebhookEvent,
  supabase: SupabaseClient
) {
  const { id, transfer_id } = event.data;

  await supabase
    .from('bridge_deposits')
    .update({
      status: 'payment_submitted',
      last_event_id: id,
      last_event_type: event.type,
      event_data: event.data,
    })
    .eq('bridge_transfer_id', transfer_id);
}

export async function handleInReview(
  event: WebhookEvent,
  supabase: SupabaseClient
) {
  const { id, transfer_id } = event.data;

  await supabase
    .from('bridge_deposits')
    .update({
      status: 'in_review',
      last_event_id: id,
      last_event_type: event.type,
      event_data: event.data,
    })
    .eq('bridge_transfer_id', transfer_id);
}

export async function handleRefund(
  event: WebhookEvent,
  supabase: SupabaseClient
) {
  const { id, transfer_id } = event.data;

  await supabase
    .from('bridge_deposits')
    .update({
      status: 'refund',
      last_event_id: id,
      last_event_type: event.type,
      event_data: event.data,
    })
    .eq('bridge_transfer_id', transfer_id);
}
```

When creating virtual accounts, persist the full
`source_deposit_instructions` JSON as well as the extracted fields, and use an
idempotency key (e.g. `va-${customer_id}`) with an upsert on
`bridge_virtual_account_id` to avoid duplicates.

---

### Phase 3: Frontend Implementation

#### 3.1 Create deposit/bank-transfer feature

Location: `packages/app/features/deposit/bank-transfer/`

```
packages/app/features/deposit/bank-transfer/
├── screen.tsx                    # Main screen
├── components/
│   ├── KycRequiredCard.tsx       # Prompt to start KYC
│   ├── KycPendingCard.tsx        # KYC in progress
│   ├── BankDetailsCard.tsx       # Show routing/account #
│   ├── DepositInstructions.tsx   # ACH/Wire instructions
│   └── DepositHistory.tsx        # Recent deposits
└── hooks/
    ├── useBridgeCustomer.ts      # Query bridge_customers
    ├── useBridgeVirtualAccount.ts # Query virtual accounts
    └── useBridgeDeposits.ts      # Query deposits
```

**Main Screen Flow:**
```tsx
// screen.tsx
export function BankTransferScreen() {
  const { data: bridgeCustomer, isLoading: loadingCustomer } = useBridgeCustomer();
  const { data: virtualAccount, isLoading: loadingVA } = useBridgeVirtualAccount();

  if (loadingCustomer || loadingVA) {
    return <LoadingScreen />;
  }

  // No Bridge customer - start KYC
  if (!bridgeCustomer) {
    return <StartKycScreen />;
  }

  // KYC not approved yet
  if (bridgeCustomer.kyc_status !== 'approved') {
    return <KycStatusScreen status={bridgeCustomer.kyc_status} />;
  }

  // KYC approved but no virtual account yet (shouldn't happen normally)
  if (!virtualAccount) {
    return <CreatingAccountScreen />;
  }

  // Show bank details and deposit history
  return (
    <YStack gap="$4">
      <BankDetailsCard virtualAccount={virtualAccount} />
      <DepositInstructions />
      <DepositHistory />
    </YStack>
  );
}
```

**Bank Details Card:**
```tsx
// components/BankDetailsCard.tsx
export function BankDetailsCard({ virtualAccount }: Props) {
  const { t } = useTranslation('deposit');
  const { source_deposit_instructions: bank } = virtualAccount;

  return (
    <FadeCard>
      <YStack gap="$3">
        <Paragraph size="$6" fontWeight="600">
          {t('bankTransfer.bankDetails.title')}
        </Paragraph>

        <CopyableField
          label={t('bankTransfer.bankDetails.bankName')}
          value={bank.bank_name}
        />
        <CopyableField
          label={t('bankTransfer.bankDetails.routingNumber')}
          value={bank.bank_routing_number}
        />
        <CopyableField
          label={t('bankTransfer.bankDetails.accountNumber')}
          value={bank.bank_account_number}
        />
        <CopyableField
          label={t('bankTransfer.bankDetails.beneficiaryName')}
          value={bank.bank_beneficiary_name}
        />
        {bank.bank_beneficiary_address ? (
          <CopyableField
            label={t('bankTransfer.bankDetails.beneficiaryAddress')}
            value={bank.bank_beneficiary_address}
          />
        ) : null}

        <XStack gap="$2" mt="$2">
          {bank.payment_rails.includes('ach_push') && (
            <Badge>ACH</Badge>
          )}
          {bank.payment_rails.includes('wire') && (
            <Badge>Wire</Badge>
          )}
        </XStack>
      </YStack>
    </FadeCard>
  );
}
```

#### 3.2 Add API routes for KYC flow

Location: `apps/next/pages/api/bridge/`

```
apps/next/pages/api/bridge/
├── kyc-link.ts       # POST: Create KYC link
└── status.ts         # GET: Check KYC/VA status
```

Webhook delivery is handled by `apps/bridge-webhook/` to ensure raw-body
signature verification and avoid duplicate processing.

**KYC Link API:**
```typescript
// pages/api/bridge/kyc-link.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerSupabaseClient({ req, res });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Check if user already has a Bridge customer
  const { data: existingCustomer } = await supabase
    .from('bridge_customers')
    .select()
    .eq('user_id', user.id)
    .single();

  if (existingCustomer) {
    // Return existing KYC link or status
    if (existingCustomer.kyc_status === 'approved') {
      return res.json({ status: 'approved' });
    }

    const kycLink = await bridgeClient.getKycLink(existingCustomer.kyc_link_id);
    return res.json({ kyc_link: kycLink.kyc_link, tos_link: kycLink.tos_link });
  }

  // Get user profile for name/email
  const { data: profile } = await supabase
    .from('profiles')
    .select('name')
    .eq('id', user.id)
    .single();

  // Create new KYC link
  const kycLinkResponse = await bridgeClient.createKycLink({
    full_name: profile?.name || 'Send User',
    email: user.email!,
    type: 'individual',
    redirect_uri: `${process.env.NEXT_PUBLIC_URL}/deposit/bank-transfer/callback`,
  }, { idempotencyKey: `kyc-link-${user.id}` });

  // Store in database
  await supabase.from('bridge_customers').upsert({
    user_id: user.id,
    kyc_link_id: kycLinkResponse.id,
    kyc_status: kycLinkResponse.kyc_status,
    tos_status: kycLinkResponse.tos_status,
    full_name: kycLinkResponse.full_name,
    email: kycLinkResponse.email,
    type: kycLinkResponse.type,
  }, { onConflict: 'user_id' });

  return res.json({
    kyc_link: kycLinkResponse.kyc_link,
    tos_link: kycLinkResponse.tos_link,
  });
}
```

**Status API Notes:**
- Read from `bridge_customers`, `bridge_virtual_accounts`, and recent
  `bridge_deposits` for the authenticated user.
- If `kyc_status` is `approved` but no active virtual account exists, attempt
  an idempotent create or list from Bridge to reconcile missed webhooks.

#### 3.3 Update deposit screen

Add bank transfer option to `packages/app/features/deposit/screen.tsx`:

```tsx
const options = useMemo(
  () => [
    {
      Icon: IconWallet,
      href: '/deposit/crypto',
      title: t('options.crypto.title'),
      description: t('options.crypto.description'),
    },
    {
      Icon: IconBank, // New icon
      href: '/deposit/bank-transfer',
      title: t('options.bankTransfer.title'),
      description: t('options.bankTransfer.description'),
    },
    // ... existing options
  ],
  [t]
);
```

---

### Phase 4: Tilt Integration

#### 4.1 Add bridge-webhook service to Tiltfile

```python
# Tiltfile addition
docker_build(
  'bridge-webhook',
  context='.',
  dockerfile='apps/bridge-webhook/Dockerfile',
  only=[
    'apps/bridge-webhook',
    'packages/bridge',
    'packages/app/utils/supabase',
  ],
)

k8s_yaml(kustomize('k8s/bridge-webhook'))

k8s_resource(
  'bridge-webhook',
  port_forwards=['3060:3060'],
  resource_deps=['supabase'],
  labels=['backend'],
)
```

#### 4.2 Environment variables

```env
# .env.local additions
BRIDGE_API_KEY=<sandbox_api_key>
BRIDGE_SANDBOX=true
BRIDGE_WEBHOOK_SECRET=<webhook_signing_secret>
```

---

## Testing Plan

### Unit Tests

#### Bridge Client Tests
Location: `packages/bridge/src/__tests__/`

```typescript
// client.test.ts
describe('BridgeClient', () => {
  describe('createKycLink', () => {
    it('creates KYC link with required fields', async () => {
      const mockResponse = { id: 'kyc_123', kyc_link: 'https://...', ... };
      fetchMock.mockResponseOnce(JSON.stringify(mockResponse));

      const result = await client.createKycLink({
        full_name: 'Test User',
        email: 'test@example.com',
        type: 'individual',
      });

      expect(result.id).toBe('kyc_123');
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/kyc_links'),
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('includes idempotency key for POST requests', async () => {
      // ...
    });

    it('handles API errors correctly', async () => {
      fetchMock.mockResponseOnce(JSON.stringify({ error: 'Invalid' }), { status: 400 });
      await expect(client.createKycLink(data)).rejects.toThrow(BridgeApiError);
    });
  });

  describe('createVirtualAccount', () => {
    it('creates virtual account for approved customer', async () => {
      // ...
    });
  });
});
```

#### Webhook Handler Tests
```typescript
// handlers/kyc.test.ts
describe('handleKycStatus', () => {
  it('updates customer record with customer_id', async () => {
    const event = {
      type: 'kyc_link.kyc_status.approved',
      data: {
        kyc_link_id: 'kyc_123',
        customer_id: 'cust_456',
        kyc_status: 'approved',
        tos_status: 'approved',
      },
    };

    await handleKycStatus(event, mockSupabase);

    expect(mockSupabase.from).toHaveBeenCalledWith('bridge_customers');
    expect(mockSupabase.update).toHaveBeenCalledWith({
      bridge_customer_id: 'cust_456',
      kyc_status: 'approved',
      tos_status: 'approved',
    });
  });

  it('auto-creates virtual account after approval', async () => {
    // ...
  });
});

// handlers/deposits.test.ts
describe('handleFundsReceived', () => {
  it('creates deposit record with correct fields', async () => {
    // ...
  });

  it('ignores microdeposits under $1', async () => {
    // ...
  });

  it('dedupes duplicate webhook events by bridge_event_id', async () => {
    // ...
  });
});
```

### Database Tests (pgTAP)
Location: `supabase/tests/`

```sql
-- bridge_customers_test.sql
begin;
select plan(5);

-- Test table exists
select has_table('public', 'bridge_customers', 'bridge_customers table exists');

-- Test RLS
select policies_are(
  'public',
  'bridge_customers',
  array['Users can view own bridge customer']
);

-- Test user can only see own data
set local role authenticated;
set local request.jwt.claim.sub = 'test-user-id';

select is(
  (select count(*) from bridge_customers where user_id = 'test-user-id'::uuid),
  0::bigint,
  'User sees no data initially'
);

-- Test constraints
select throws_ok(
  $$insert into bridge_customers (user_id, kyc_link_id, kyc_status, full_name, email)
    values ('test-user-id', 'kyc_1', 'invalid_status', 'Test', 'test@test.com')$$,
  '23514',
  'new row violates check constraint',
  'Invalid kyc_status rejected'
);

select * from finish();
rollback;
```

### Integration Tests

#### API Route Tests
Location: `packages/playwright/tests/api/`

```typescript
// bridge-kyc.spec.ts
test.describe('Bridge KYC API', () => {
  test('POST /api/bridge/kyc-link creates new KYC link', async ({ request }) => {
    const response = await request.post('/api/bridge/kyc-link', {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('kyc_link');
    expect(data).toHaveProperty('tos_link');
  });

  test('returns existing KYC link for user with pending KYC', async ({ request }) => {
    // First call creates
    await request.post('/api/bridge/kyc-link', { headers });
    // Second call returns existing
    const response = await request.post('/api/bridge/kyc-link', { headers });
    expect(response.status()).toBe(200);
  });

  test('returns approved status for completed KYC', async ({ request }) => {
    // Setup: user with approved KYC
    const response = await request.post('/api/bridge/kyc-link', { headers });
    const data = await response.json();
    expect(data.status).toBe('approved');
  });
});
```

### E2E Tests (Playwright)
Location: `packages/playwright/tests/deposit/`

```typescript
// bank-transfer.spec.ts
test.describe('Bank Transfer Deposit', () => {
  test('shows KYC required card for new users', async ({ page }) => {
    await page.goto('/deposit/bank-transfer');
    await expect(page.getByTestId('kyc-required-card')).toBeVisible();
    await expect(page.getByRole('button', { name: /verify identity/i })).toBeVisible();
  });

  test('opens KYC link in new tab', async ({ page, context }) => {
    await page.goto('/deposit/bank-transfer');

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('button', { name: /verify identity/i }).click(),
    ]);

    await expect(newPage).toHaveURL(/verify\.bridge\.xyz/);
  });

  test('shows bank details for approved users', async ({ page }) => {
    // Setup: user with approved KYC and virtual account
    await page.goto('/deposit/bank-transfer');

    await expect(page.getByTestId('bank-details-card')).toBeVisible();
    await expect(page.getByText(/routing number/i)).toBeVisible();
    await expect(page.getByText(/account number/i)).toBeVisible();
  });

  test('copies routing number to clipboard', async ({ page }) => {
    await page.goto('/deposit/bank-transfer');
    await page.getByTestId('copy-routing-number').click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toMatch(/^\d{9}$/);
  });

  test('shows deposit history', async ({ page }) => {
    // Setup: user with previous deposits
    await page.goto('/deposit/bank-transfer');

    await expect(page.getByTestId('deposit-history')).toBeVisible();
    await expect(page.getByText(/\$100\.00/)).toBeVisible();
    await expect(page.getByText(/completed/i)).toBeVisible();
  });
});
```

### Webhook Tests

```typescript
// webhook.spec.ts
test.describe('Bridge Webhooks', () => {
  // Configure baseURL to point at bridge-webhook (e.g. http://localhost:3060).
  test('handles kyc_link.kyc_status.approved', async ({ request }) => {
    const webhookPayload = {
      id: 'evt_123',
      type: 'kyc_link.kyc_status.approved',
      data: {
        kyc_link_id: 'kyc_abc',
        customer_id: 'cust_xyz',
        kyc_status: 'approved',
      },
    };

    const response = await request.post('/webhooks/bridge', {
      data: webhookPayload,
      headers: {
        'X-Bridge-Signature': generateSignature(webhookPayload),
      },
    });

    expect(response.status()).toBe(200);

    // Verify database updated
    const { data: customer } = await supabase
      .from('bridge_customers')
      .select()
      .eq('kyc_link_id', 'kyc_abc')
      .single();

    expect(customer.bridge_customer_id).toBe('cust_xyz');
    expect(customer.kyc_status).toBe('approved');
  });

  test('handles virtual_account.funds_received', async ({ request }) => {
    // ...
  });

  test('rejects invalid webhook signatures', async ({ request }) => {
    const response = await request.post('/webhooks/bridge', {
      data: {},
      headers: { 'X-Bridge-Signature': 'invalid' },
    });

    expect(response.status()).toBe(401);
  });
});
```

### Manual Testing Checklist

#### Sandbox Testing
- [ ] Create test user in sandbox environment
- [ ] Complete KYC flow with test data
- [ ] Verify virtual account creation
- [ ] Simulate ACH deposit (sandbox test transfer)
- [ ] Verify webhook receipt and processing
- [ ] Confirm USDC delivery to test wallet

#### Edge Cases
- [ ] KYC rejection flow
- [ ] KYC timeout/expiration
- [ ] Duplicate KYC attempts
- [ ] Missed or replayed webhook events (idempotent processing)
- [ ] Microdeposit handling (<$1)
- [ ] Wire vs ACH deposit differences
- [ ] Refund flow
- [ ] User with existing Bridge customer from different platform

---

## Deployment Considerations

### Environment Setup
1. Obtain Bridge API keys (sandbox + production)
2. Configure webhook endpoints in Bridge dashboard
3. Set up webhook signature verification
4. Configure environment variables in Vercel/K8s

### Security
- Store API keys in secure environment variables
- Implement webhook signature verification
- Use HTTPS for all API calls
- Sanitize/validate all webhook payloads
- Implement rate limiting on KYC link creation

### Monitoring
- Log all Bridge API calls
- Monitor webhook delivery success rate
- Alert on KYC rejection spikes
- Track deposit completion times
- Monitor for stuck/failed deposits

---

## Timeline Estimate

| Phase | Tasks | Dependencies |
|-------|-------|--------------|
| Phase 1 | Database schema | None |
| Phase 2 | Bridge client + webhook service | Phase 1 |
| Phase 3 | Frontend UI | Phase 1, 2 |
| Phase 4 | Tilt/deployment config | Phase 2 |
| Testing | All test suites | All phases |

---

## References

- [Bridge KYC Links](https://apidocs.bridge.xyz/platform/customers/customers/kyclinks)
- [Bridge Virtual Accounts](https://apidocs.bridge.xyz/platform/orchestration/virtual_accounts/virtual-account)
- [Bridge Webhook Events](https://apidocs.bridge.xyz/platform/orchestration/virtual_accounts/virtual-account-events)
- [Bridge API Postman Collection](https://www.postman.com/material-pilot-3638775/public-workspace/collection/q022uvv/bridge-xyz-api)
