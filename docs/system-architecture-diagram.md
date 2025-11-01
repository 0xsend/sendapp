# Send App - System Architecture Diagram

## High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        WEB[Next.js Web App]
        MOBILE[React Native Mobile App]
        SHARED[Shared Packages<br/>app, ui, wagmi]
    end

    subgraph "Backend Layer"
        SUPABASE[Supabase<br/>PostgreSQL + Auth]
        DISTRIBUTOR[Distributor Service<br/>Bun/Express]
        TEMPORAL[Temporal<br/>Workflows & Workers]
        SHOVEL[Shovel Indexer<br/>Blockchain Events]
    end

    subgraph "Blockchain Layer"
        BASE[Base Mainnet<br/>Chain ID: 8453]
        BUNDLER[ERC-4337/7677 Bundler<br/>Account Abstraction]
        CONTRACTS[Smart Contracts<br/>SendAccount, Paymaster]
    end

    WEB --> SHARED
    MOBILE --> SHARED
    SHARED --> SUPABASE
    SHARED --> CONTRACTS

    DISTRIBUTOR --> SUPABASE
    DISTRIBUTOR --> CONTRACTS
    DISTRIBUTOR --> TEMPORAL

    SHOVEL --> BASE
    SHOVEL --> SUPABASE

    BUNDLER --> BASE
    CONTRACTS --> BASE
    SHARED --> BUNDLER

    style WEB fill:#61dafb
    style MOBILE fill:#61dafb
    style SHARED fill:#00d4ff
    style SUPABASE fill:#3ecf8e
    style BASE fill:#0052ff
    style CONTRACTS fill:#f6851b
```

## Component Breakdown

### Frontend Layer

#### 1. Next.js Web App (`/apps/next`)

**Purpose**: Web interface for Send payments platform

**Technologies**:

- Next.js 15+ with App Router
- React Server Components
- Tamagui for styling
- Wagmi for blockchain interactions

**Key Features**:

- Server-side rendering for optimal SEO
- Static generation for marketing pages
- Dynamic routes for user profiles and transactions
- API routes for server-side operations

**Integration Points**:

- Supabase Auth for authentication
- tRPC APIs for backend communication
- Wagmi hooks for smart contract interactions
- WebSocket subscriptions for real-time updates

**File Structure**:

```
apps/next/
├── app/                 # Next.js app directory
├── public/              # Static assets
├── components/          # Web-specific components
└── utils/               # Web-specific utilities
```

---

#### 2. React Native Mobile App (`/apps/expo`)

**Purpose**: Native mobile application for iOS and Android

**Technologies**:

- Expo SDK
- React Native
- Expo Router for navigation
- Tamagui for cross-platform UI

**Key Features**:

- Biometric authentication (Face ID, Touch ID)
- Camera integration for QR code scanning
- Push notifications for transaction alerts
- Secure storage for sensitive data

**Integration Points**:

- Shared business logic from `packages/app`
- Native modules for device features
- WebAuthn for authentication
- Same backend APIs as web app

**File Structure**:

```
apps/expo/
├── app/                 # Expo Router screens
├── assets/              # Images, fonts, icons
├── components/          # Mobile-specific components
└── utils/               # Mobile-specific utilities
```

---

#### 3. Shared Packages (`/packages`)

##### packages/app

**Purpose**: Core business logic and screens shared between web and mobile

**Contains**:

- Screen components (Home, Send, Activity, Profile)
- Business logic and state management
- Data fetching hooks (React Query)
- Navigation structure (Solito)

**Platform Handling**:

```typescript
// Base component (web default)
ComponentName.tsx

// Native override
ComponentName.native.tsx
```

##### packages/ui

**Purpose**: Reusable UI component library built on Tamagui

**Contains**:

- Button, Input, Card, Modal components
- Theme configuration (colors, spacing, typography)
- Responsive layout utilities
- Custom styled components

**Example**:

```typescript
import { Button, Card, Text } from '@my/ui'

export function PaymentCard() {
  return (
    <Card>
      <Text>Send Payment</Text>
      <Button>Confirm</Button>
    </Card>
  )
}
```

##### packages/wagmi

**Purpose**: Blockchain integration layer

**Contains**:

- Smart contract hooks (useSendAccount, usePaymaster)
- Wagmi configuration and chains
- Contract ABIs and type definitions
- Transaction helpers

**Example**:

```typescript
import { useSendAccount } from '@my/wagmi'

export function SendPayment() {
  const { send, isLoading } = useSendAccount()

  const handleSend = async () => {
    await send({
      to: '0x...',
      amount: '100',
      token: 'USDC',
    })
  }
}
```

---

### Backend Layer

#### 4. Supabase (`/supabase`)

**Purpose**: PostgreSQL database, authentication, and real-time subscriptions

**Components**:

- **PostgreSQL Database**: Core data storage
- **PostgREST API**: Auto-generated REST API
- **Supabase Auth**: WebAuthn-enabled authentication
- **Realtime Server**: WebSocket subscriptions
- **Storage**: File uploads and media

**Schema Structure**:

```sql
-- Core tables
users
accounts
transactions
sendtags
tokens
activity_feed

-- Supporting tables
webhooks
notifications
distribution_schedules
```

**Declarative Schema Approach**:

- Schemas defined in `supabase/schemas/`
- Migrations generated from schema diffs
- CI/CD drift detection ensures consistency

**Row-Level Security (RLS)**:

```sql
-- Example RLS policy
CREATE POLICY "Users can only view their own data"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);
```

**Integration Points**:

- Frontend auth via Supabase client
- Real-time subscriptions for activity feeds
- Edge functions for serverless operations
- Shovel indexer writes blockchain data

---

#### 5. Distributor Service (`/apps/distributor`)

**Purpose**: SEND token distribution calculation service

**Responsibilities**:

- Analyzes Ethereum mainnet blocks for SEND token transfers
- Calculates distribution shares for SEND token holders
- Supports multiplier system for referrals and verifications
- Implements send slash system for non-senders
- Enforces minimum balance requirements for send earn deposits

**Technologies**:

- Bun runtime with Express
- Temporal SDK for workflow orchestration
- Viem for blockchain interactions
- Supabase client for data persistence

**Key Features**:

- Real-time block analysis
- Multiplier calculations (referrals, verification bonus)
- Send slash penalties for inactive users
- Distribution share recalculation

---

#### 6. Temporal Workflows & Workers

**Purpose**: Durable workflow execution for background jobs

**Package Structure**:

- **`/packages/temporal`**: Temporal client and configuration
- **`/packages/workflows`**: Workflow and activity definitions
- **`/apps/workers`**: Worker execution runtime

**Use Cases**:

- Token distribution workflows
- Scheduled payment processing
- Batch operations (airdrops, rewards)
- Long-running business processes

**Architecture**:

```mermaid
graph LR
    CLIENT[Workflow Client] --> TEMPORAL[Temporal Server]
    TEMPORAL --> WORKER[Temporal Worker]
    WORKER --> ACTIVITY1[Activity: Calculate]
    WORKER --> ACTIVITY2[Activity: Execute]
    WORKER --> ACTIVITY3[Activity: Record]
```

**Benefits**:

- **Durability**: Workflows survive crashes
- **Observability**: Full execution history
- **Retries**: Automatic retry with exponential backoff
- **Testing**: Replay and time-travel debugging

---

#### 7. Shovel Indexer (`/packages/shovel`)

**Purpose**: Index blockchain events into PostgreSQL

**How It Works**:

1. Listens to Base chain events
2. Filters relevant contract events (transfers, registrations)
3. Transforms event data
4. Writes to Supabase database

**Configuration**:

```yaml
# shovel.yaml
chains:
  - name: base
    rpc: https://mainnet.base.org

contracts:
  - address: '0x...'
    abi: SendAccount
    events:
      - Transfer
      - SendtagRegistered

sinks:
  - type: postgres
    connection: postgresql://...
```

**Benefits**:

- Fast queries without RPC calls
- Historical data analysis
- Real-time activity feed updates
- Reduced blockchain API costs

---

### Blockchain Layer

#### 8. Base Chain

**Purpose**: Layer 2 Ethereum network for low-cost transactions

**Characteristics**:

- Optimistic Rollup architecture
- EVM-compatible
- ~2 second block times
- Significantly lower gas fees than Ethereum L1

**Network Information**:

- Mainnet Chain ID: 8453
- RPC: https://mainnet.base.org
- Block Explorer: https://basescan.org

---

#### 9. ERC-4337/7677 Bundler

**Purpose**: Process UserOperations for account abstraction

**Implementation**:

- ERC-4337/7677 compliant bundler client
- Compatible with multiple providers (Coinbase CDP, Pimlico, etc.)
- Configurable via environment variables (BUNDLER_RPC_URL, ERC7677_BUNDLER_RPC_URL)
- EntryPoint v0.7 support

**Flow**:

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Bundler
    participant Paymaster
    participant Chain

    User->>Frontend: Sign transaction
    Frontend->>Bundler: Submit UserOp
    Bundler->>Paymaster: Verify sponsorship
    Paymaster->>Bundler: Approve
    Bundler->>Chain: Bundle & submit
    Chain->>Frontend: Receipt
    Frontend->>User: Confirmation
```

**Benefits**:

- Gasless transactions (paymaster sponsorship)
- Batch operations
- Custom validation logic
- Improved UX (no ETH required for gas)
- Provider flexibility (not locked to single vendor)

---

#### 10. Smart Contracts (`/packages/contracts`)

##### SendAccount (ERC-4337)

**Purpose**: Smart contract wallet for each user

**Features**:

- ERC-4337 compliant account abstraction
- WebAuthn signature verification
- Multi-sig recovery
- Gasless transaction support

**Key Functions**:

```solidity
contract SendAccount {
    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    ) external returns (uint256 validationData);

    function execute(
        address dest,
        uint256 value,
        bytes calldata func
    ) external;

    function executeBatch(
        address[] calldata dest,
        uint256[] calldata value,
        bytes[] calldata func
    ) external;
}
```

##### SendVerifier

**Purpose**: Verify WebAuthn signatures on-chain

**Features**:

- P256 signature verification
- FIDO2 authenticator data parsing
- Gas-optimized verification logic

##### TokenPaymaster

**Purpose**: Sponsor gas fees for user transactions

**Features**:

- ERC-20 token payment for gas
- Sponsorship for specific operations
- Usage limits and rate limiting

##### SendtagCheckout

**Purpose**: Purchase and register sendtags

**Features**:

- ERC20 token payments (USDC, SEND, etc.)
- Payments sent to Send Multisig
- Referrer commission remittance
- Pausable contract for emergency stops
- Owner-controlled fund withdrawals

**Deployment Architecture**:

```
Foundry Project
├── src/
│   ├── SendAccount.sol
│   ├── SendVerifier.sol
│   ├── TokenPaymaster.sol
│   └── SendtagCheckout.sol
├── test/
│   └── *.t.sol (Foundry tests)
└── script/
    └── Deploy.s.sol (deployment scripts)
```

---

## Integration Patterns

### Frontend ↔ Backend

#### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Supabase
    participant Device

    User->>App: Click "Sign In"
    App->>Supabase: Request challenge
    Supabase->>App: WebAuthn challenge
    App->>Device: Authenticate
    Device->>App: Signature
    App->>Supabase: Submit signature
    Supabase->>App: JWT tokens
    App->>User: Authenticated
```

#### Data Fetching (tRPC)

```typescript
// Backend: tRPC router
export const appRouter = router({
  getBalance: publicProcedure.input(z.object({ address: z.string() })).query(async ({ input }) => {
    return await getTokenBalance(input.address)
  }),
})

// Frontend: tRPC client
const { data: balance } = trpc.getBalance.useQuery({
  address: userAddress,
})
```

---

### Frontend ↔ Blockchain

#### Transaction Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Bundler
    participant Paymaster
    participant SendAccount
    participant Token

    User->>App: Send 100 USDC to @bob
    App->>App: Build UserOp
    App->>Bundler: Submit UserOp
    Bundler->>Paymaster: Request sponsorship
    Paymaster->>Bundler: Approve & sign
    Bundler->>SendAccount: Execute UserOp
    SendAccount->>Token: Transfer 100 USDC
    Token->>SendAccount: Success
    SendAccount->>Bundler: Receipt
    Bundler->>App: Transaction hash
    App->>User: "Payment sent!"
```

#### Smart Contract Interaction (Wagmi)

```typescript
import { useSendAccount } from '@my/wagmi'

export function SendButton() {
  const { write, isLoading } = useSendAccount({
    onSuccess: (data) => {
      console.log('Transaction:', data.hash)
    }
  })

  return (
    <Button
      disabled={isLoading}
      onPress={() => write({
        functionName: 'execute',
        args: [recipient, amount, tokenAddress]
      })}
    >
      Send Payment
    </Button>
  )
}
```

---

### Backend ↔ Blockchain

#### Event Indexing (Shovel)

```mermaid
graph LR
    BASE[Base Chain] -->|Events| SHOVEL[Shovel Indexer]
    SHOVEL -->|Transform| ETL[ETL Pipeline]
    ETL -->|Write| SUPABASE[Supabase DB]
    SUPABASE -->|Subscribe| APP[Frontend App]
    APP -->|Display| USER[User]
```

#### Smart Contract Calls (Distributor)

```typescript
import { createPublicClient, createWalletClient } from 'viem'

// Read contract state
const balance = await publicClient.readContract({
  address: tokenAddress,
  abi: ERC20_ABI,
  functionName: 'balanceOf',
  args: [userAddress],
})

// Write transaction
const hash = await walletClient.writeContract({
  address: tokenAddress,
  abi: ERC20_ABI,
  functionName: 'transfer',
  args: [recipient, amount],
})
```

---

## Data Flow Diagrams

### User Registration Flow

```mermaid
sequenceDiagram
    participant User
    participant Mobile/Web
    participant Supabase
    participant Bundler
    participant SendAccount Factory
    participant Base Chain

    User->>Mobile/Web: Sign up with passkey
    Mobile/Web->>Device: Create WebAuthn credential
    Device->>Mobile/Web: Public key
    Mobile/Web->>Supabase: Register user
    Supabase->>Mobile/Web: User ID & JWT
    Mobile/Web->>Bundler: Deploy SendAccount
    Bundler->>SendAccount Factory: Create account
    SendAccount Factory->>Base Chain: Deploy contract
    Base Chain->>SendAccount Factory: Account address
    SendAccount Factory->>Bundler: Success
    Bundler->>Mobile/Web: Account address
    Mobile/Web->>Supabase: Link address to user
    Supabase->>Mobile/Web: Complete
    Mobile/Web->>User: "Account created!"
```

### Payment Flow

```mermaid
sequenceDiagram
    participant Sender
    participant App
    participant Supabase
    participant Bundler
    participant Paymaster
    participant SendAccount
    participant Token
    participant Shovel
    participant Recipient

    Sender->>App: Send 50 USDC to @alice
    App->>Supabase: Resolve @alice to address
    Supabase->>App: Address: 0x123...
    App->>App: Build UserOp
    App->>Device: Sign with passkey
    Device->>App: WebAuthn signature
    App->>Bundler: Submit UserOp
    Bundler->>Paymaster: Verify sponsorship
    Paymaster->>Bundler: Approved
    Bundler->>SendAccount: Execute transfer
    SendAccount->>Token: transfer(0x123, 50 USDC)
    Token->>SendAccount: Success
    SendAccount->>Bundler: UserOp receipt
    Bundler->>Base Chain: Include in block
    Base Chain->>Shovel: Transfer event
    Shovel->>Supabase: Write transaction
    Supabase->>App: Real-time update
    App->>Sender: "Payment sent!"
    App->>Recipient: Push notification
```

### Sendtag Purchase Flow

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Supabase
    participant SendtagCheckout
    participant Base Chain

    User->>App: Search for @alice
    App->>Supabase: Check availability
    Supabase->>App: Available
    App->>User: "@alice is available"
    User->>App: Purchase @alice with USDC
    App->>SendtagCheckout: checkout("alice", USDC amount)
    SendtagCheckout->>Base Chain: Process payment & emit event
    Base Chain->>Shovel: Index SendtagCheckout event
    Shovel->>Supabase: Update sendtags table (status: confirmed)
    Supabase->>App: Real-time update
    App->>User: "@alice is yours!"
```

---

## Deployment Architecture

### Production Environment

```mermaid
graph TB
    subgraph "CDN / Edge"
        VERCEL[Vercel Edge Network]
        CLOUDFLARE[Cloudflare CDN]
    end

    subgraph "Application Layer"
        NEXT_PROD[Next.js<br/>Vercel]
        EXPO_PROD[Expo App<br/>App Store / Play Store]
    end

    subgraph "Backend Services"
        SUPABASE_PROD[Supabase Cloud<br/>PostgreSQL + Auth]
        DISTRIBUTOR_PROD[Distributor<br/>Docker Container]
        TEMPORAL_PROD[Temporal Cloud<br/>Workflows]
        SHOVEL_PROD[Shovel<br/>Docker Container]
    end

    subgraph "Blockchain"
        BASE_MAINNET[Base Mainnet<br/>Chain ID: 8453]
        BUNDLER_PROD[ERC-4337/7677 Bundler<br/>Account Abstraction]
    end

    USER[Users] --> VERCEL
    USER --> EXPO_PROD
    VERCEL --> NEXT_PROD

    NEXT_PROD --> SUPABASE_PROD
    EXPO_PROD --> SUPABASE_PROD
    NEXT_PROD --> BUNDLER_PROD
    EXPO_PROD --> BUNDLER_PROD

    DISTRIBUTOR_PROD --> SUPABASE_PROD
    DISTRIBUTOR_PROD --> BASE_MAINNET
    DISTRIBUTOR_PROD --> TEMPORAL_PROD

    SHOVEL_PROD --> BASE_MAINNET
    SHOVEL_PROD --> SUPABASE_PROD

    BUNDLER_PROD --> BASE_MAINNET
```

### Infrastructure Components

#### Web Application

- **Platform**: Vercel
- **Deployment**: Automatic via GitHub integration
- **Domains**: send.app, support.send.app
- **Features**: Edge functions, CDN, automatic HTTPS

#### Mobile Application

- **Platform**: Expo EAS (Expo Application Services)
- **Distribution**: Apple App Store, Google Play Store
- **OTA Updates**: Expo Updates for JS bundle updates
- **Build**: Cloud builds via EAS Build

#### Backend Services

- **Container Orchestration**: Docker + Kubernetes (or similar)
- **Database**: Supabase Cloud (or self-hosted)
- **Secrets Management**: Environment variables, encrypted secrets
- **Monitoring**: Datadog, Sentry, or similar

#### Blockchain

- **Network**: Base Mainnet (Chain ID: 8453)
- **RPC Providers**: Alchemy, Infura, or self-hosted nodes
- **Bundler**: Alchemy AA bundler or Pimlico
- **Contracts**: Deployed via Foundry scripts, verified on BaseScan

---

## Security Architecture

### Authentication Layers

```mermaid
graph TB
    USER[User] --> BIOMETRIC[Biometric Auth<br/>Face ID / Touch ID]
    BIOMETRIC --> WEBAUTHN[WebAuthn]
    WEBAUTHN --> PASSKEY[Passkey<br/>Secure Enclave]
    PASSKEY --> JWT[JWT Token]
    JWT --> RLS[Row-Level Security]
    RLS --> DATA[User Data]
```

### Authorization Model

- **Database**: PostgreSQL Row-Level Security policies
- **API**: JWT validation on all protected endpoints
- **Smart Contracts**: Role-based access control (OpenZeppelin)
- **Frontend**: Conditional rendering based on auth state

### Data Protection

- **Encryption in Transit**: TLS 1.3 for all connections
- **Encryption at Rest**: Database encryption, encrypted backups
- **Key Management**: Device secure enclaves, KMS for server keys
- **Audit Logs**: Comprehensive logging of sensitive operations

---

## Open Source Philosophy

**Send is fully open source**, promoting:

- **Transparency**: All code publicly auditable
- **Security**: Community security reviews and audits
- **Collaboration**: External contributors welcome
- **Self-Hosting**: Organizations can deploy their own instance
- **Customization**: Fork and modify for specific use cases

**Contributing**:

- GitHub repository: [github.com/0xsend/sendapp](https://github.com/0xsend/sendapp)
- Issues and PRs welcome
- Documentation for contributors in `/docs`
