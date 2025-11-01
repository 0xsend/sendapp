# Send App - System Design

## Overview

**Send** is an open-source next-generation payments application that leverages blockchain technology to provide seamless, secure cryptocurrency payments across web and mobile platforms. Built on the Base chain with ERC-4337 account abstraction, Send enables users to send and receive digital assets with a user-friendly experience comparable to traditional payment apps.

**Open Source**: Send is fully open-source, promoting transparency, community collaboration, and security through public code review. The entire codebase is available for inspection, contribution, and deployment.

## Core Features

### 1. Cross-Platform Payments

- **Unified Experience**: Consistent payment interface across web (Next.js) and mobile (React Native)
- **Multi-Token Support**: Support for various ERC-20 tokens on Base chain
- **Account Abstraction**: ERC-4337 smart contract wallets for gasless transactions and improved UX

### 2. Sendtags

- **Human-Readable Addresses**: Users can claim unique sendtags (e.g., @alice) instead of using complex wallet addresses
- **Database-Backed**: Sendtags are stored in Supabase PostgreSQL with status tracking (available, pending, confirmed)
- **Social Discovery**: Easy user discovery through readable identifiers

### 3. Token Distribution

- **SEND Token**: Native token with automated distribution mechanism
- **Temporal Workflows**: Reliable, fault-tolerant distribution using Temporal workflow engine
- **Vesting Schedules**: Support for various token vesting and distribution strategies

### 4. WebAuthn Authentication

- **Passkey Support**: Modern authentication using WebAuthn and passkeys
- **Biometric Security**: Fingerprint, Face ID, and other biometric authentication methods
- **Hardware Security**: Leverages device secure enclaves for key storage

### 5. Activity Tracking

- **Transaction History**: Real-time activity feed of payments and transfers
- **Blockchain Indexing**: Shovel-based indexer for efficient blockchain data retrieval
- **Event Notifications**: Push notifications for important account events

## Technology Stack

### Frontend

#### Web Application (Next.js)

- **Framework**: Next.js 15+ with App Router
- **UI Library**: Tamagui for cross-platform styled components
- **Routing**: Solito for shared navigation logic
- **State Management**: React Query (TanStack Query), React Context
- **Blockchain Integration**: Wagmi, Viem for Ethereum interactions

#### Mobile Application (Expo/React Native)

- **Framework**: Expo for managed React Native workflow
- **UI Library**: Tamagui (shared with web)
- **Navigation**: Expo Router with Solito abstraction
- **State Management**: Shared with web (React Query, React Context)
- **Native Features**: Expo modules for camera, biometrics, secure storage

#### Shared Packages

- **`packages/app`**: Core business logic, screens, and components
- **`packages/ui`**: Tamagui-based UI component library
- **`packages/wagmi`**: Blockchain integration, smart contract hooks
- **`packages/api`**: tRPC API definitions and client

### Backend

#### Database & Authentication (Supabase)

- **Database**: PostgreSQL with PostgREST API
- **Authentication**: Supabase Auth with WebAuthn support
- **Real-time**: WebSocket subscriptions for live data
- **Storage**: File storage for profile images and assets
- **Edge Functions**: Serverless functions for backend logic

#### Services

- **Distributor**: SEND token distribution calculation service (Bun/Express)
  - Analyzes Base mainnet blocks for SEND token transfers
  - Calculates distribution shares with multiplier system
  - Implements send slash system for non-senders
- **Temporal Workers**: Workflow execution for reliable background jobs
  - `/packages/temporal`: Temporal client and configuration
  - `/packages/workflows`: Workflow and activity definitions
  - `/apps/workers`: Worker execution runtime
- **Shovel Indexer**: Blockchain event indexing and storage

#### APIs

- **tRPC**: Type-safe APIs with end-to-end type safety
- **REST**: Supabase PostgREST for database operations

### Blockchain

#### Smart Contracts (Foundry)

- **SendAccount**: ERC-4337 account abstraction contract
- **SendVerifier**: WebAuthn signature verification contract (P256 signature verification)
- **TokenPaymaster**: Gasless transaction sponsorship with ERC-20 token payment for gas
- **SendtagCheckout**: Sendtag purchase with ERC20 payments to Send Multisig and referrer commission remittance
- **ERC-20 Tokens**: USDC, SEND, and other token implementations

#### Infrastructure

- **Base Mainnet**: Layer 2 Ethereum network (Optimistic Rollup, Chain ID: 8453)
- **ERC-7677 Bundler**: Provider-agnostic bundler compatible with Coinbase CDP, Pimlico, and other providers
  - Configurable via environment variables
  - EntryPoint v0.7 support
- **Viem**: Low-level Ethereum library for contract interactions

### Development & Infrastructure

#### Monorepo Tools

- **Yarn Workspaces**: Dependency management and package linking
- **Turborepo**: Build orchestration and caching

#### Testing

- **Jest**: Unit and integration testing for packages
- **Playwright**: End-to-end testing for web application
- **pgTAP**: Database testing for Supabase schemas
- **Foundry**: Smart contract testing

#### CI/CD

- **GitHub Actions**: Automated testing and deployment
- **Docker**: Containerization for services
- **Vercel**: Web application deployment
- **Supabase CLI**: Database migration and deployment

## Data Flow

### User Payment Flow

```
1. User Action (Web/Mobile)
   ↓
2. Frontend Validation
   ↓
3. Blockchain Transaction Preparation
   ↓
4. Smart Contract Interaction (SendAccount)
   ↓
5. Bundler Submission (ERC-4337)
   ↓
6. On-Chain Execution (Base Chain)
   ↓
7. Event Indexing (Shovel)
   ↓
8. Database Update (Supabase)
   ↓
9. Real-time UI Update
```

### Authentication Flow

```
1. User Initiates Login
   ↓
2. WebAuthn Challenge Generation (Supabase)
   ↓
3. Biometric/Passkey Verification (Device)
   ↓
4. Signature Generation (Secure Enclave)
   ↓
5. Signature Verification (Backend)
   ↓
6. JWT Token Issuance (Supabase Auth)
   ↓
7. Authenticated Session Established
```

### Token Distribution Flow

```
1. Distribution Event Triggered
   ↓
2. Temporal Workflow Started
   ↓
3. Eligibility Calculation (Distributor Service)
   ↓
4. Smart Contract Interaction (Token Contract)
   ↓
5. On-Chain Token Transfer
   ↓
6. Workflow Completion & Notification
```

## Key Design Decisions

### 1. Monorepo Architecture

**Decision**: Use Yarn workspaces with Turborepo for a unified codebase.

**Rationale**:

- **Code Sharing**: Maximum code reuse between web and mobile platforms
- **Atomic Changes**: Cross-package changes in single PRs with consistent versioning
- **Build Efficiency**: Turborepo caching reduces build times significantly
- **Developer Experience**: Single repository simplifies onboarding and navigation

### 2. Cross-Platform UI (Tamagui)

**Decision**: Use Tamagui for unified styling across web and native.

**Rationale**:

- **Performance**: Compile-time optimization for native performance
- **Consistency**: Same components render identically on web and mobile
- **Type Safety**: Full TypeScript support with type-safe styling
- **Developer Velocity**: Write once, deploy everywhere

### 3. Account Abstraction (ERC-4337)

**Decision**: Implement smart contract wallets with ERC-4337 standard.

**Rationale**:

- **Gasless Transactions**: Paymaster sponsorship for improved UX
- **Social Recovery**: Account recovery without seed phrases
- **Batch Transactions**: Multiple operations in single user action
- **WebAuthn Integration**: Passkey-based transaction signing

### 4. Supabase as Backend

**Decision**: Use Supabase for database, auth, and backend services.

**Rationale**:

- **PostgreSQL**: Robust, well-understood relational database
- **Real-time**: Built-in WebSocket subscriptions for live updates
- **Auth Integration**: WebAuthn support and comprehensive auth features
- **Self-Hostable**: Can deploy own instance for full control
- **Open Source**: Aligns with project's open-source philosophy

### 5. Temporal for Workflows

**Decision**: Use Temporal for reliable background job orchestration.

**Rationale**:

- **Durability**: Workflows survive process crashes and restarts
- **Observability**: Complete visibility into workflow execution
- **Scalability**: Handles complex, long-running business processes
- **Testability**: Easy to test complex workflows in isolation

### 6. tRPC for APIs

**Decision**: Use tRPC for type-safe API communication.

**Rationale**:

- **End-to-End Type Safety**: Share types between frontend and backend
- **Developer Experience**: Auto-completion and compile-time error checking
- **Performance**: Minimal overhead compared to GraphQL or REST
- **Simple**: Less boilerplate than traditional API approaches

## Scalability Considerations

### Horizontal Scaling

- **Stateless Services**: All backend services designed to scale horizontally
- **Database Connection Pooling**: PgBouncer for efficient database connections
- **CDN Distribution**: Static assets served via CDN (Vercel Edge Network)
- **Edge Functions**: Serverless functions auto-scale based on demand

### Blockchain Performance

- **Layer 2 Solution**: Base chain provides low-cost, high-throughput transactions
- **Batch Transactions**: ERC-4337 bundler batches multiple operations
- **Indexed Data**: Shovel indexer enables fast queries without RPC calls
- **Caching Strategy**: Aggressive caching of on-chain data

### Data Optimization

- **Query Optimization**: Indexed database queries and materialized views
- **Real-time Subscriptions**: Selective subscription to minimize data transfer
- **Platform-Specific Rendering**: RecyclerListView optimized for both web and native platforms
- **Code Splitting**: Dynamic imports and lazy loading for faster initial load

### Monitoring & Observability

- **Temporal UI**: Workflow execution monitoring and debugging
- **Supabase Dashboard**: Database performance and query analysis
- **Analytics**: User behavior and performance metrics

## Security Model

### Authentication & Authorization

#### Multi-Factor Authentication

- **WebAuthn**: Primary authentication using device biometrics or hardware keys
- **Passkeys**: FIDO2 compliant passwordless authentication
- **JWT Tokens**: Short-lived access tokens with refresh token rotation
- **Row-Level Security**: PostgreSQL RLS policies enforce data access control

#### Smart Contract Security

- **Audited Contracts**: Smart contracts undergo professional security audits
- **Formal Verification**: Critical contract logic verified using formal methods
- **Upgrade Patterns**: Proxy patterns for secure contract upgrades
- **Multi-Sig Controls**: Admin functions protected by multi-signature requirements

## Conclusion

Send's system design prioritizes user experience, security, and scalability while maintaining an open-source philosophy. The architecture leverages modern technologies (ERC-4337, WebAuthn, Temporal) to provide a seamless payments experience that abstracts away blockchain complexity from end users. The monorepo structure with cross-platform shared code enables rapid development while maintaining consistency across web and mobile platforms.

The open-source nature of the project encourages community participation, security through transparency, and allows organizations to self-host and customize the platform for their specific needs.
