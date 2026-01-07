# Activity Feed Optimization

## Problem

FlashList activity feed has performance issues on Android with blank spaces during scroll. Root cause: heavy computation happens during React render cycle, blocking the main thread.

## Solution

Move all data transformation to background processing using `requestIdleCallback`, and use a discriminated union + factory pattern for zero-computation rendering.

## Architecture

```
Raw Data Fetch (async)
    ↓
requestIdleCallback (background, chunked)
    ↓
Transform to Discriminated Union Types
    ↓
FlashList renders via Factory (simple switch, no logic)
```

## Key Components

### 1. Discriminated Union Types

Each activity type has its own shape with exactly the data needed for rendering. All types share common pre-computed fields:

```typescript
interface BaseActivityRow {
  eventId: string
  title: string      // Pre-computed, translated display title
  subtitle: string   // Pre-computed, translated subtitle/description
  amount: string
  date: string
  isFirst: boolean
  isLast: boolean
  sectionIndex: number
}

type ActivityRow =
  | { kind: 'user-transfer'; ... }
  | { kind: 'swap'; ... }
  | { kind: 'sendpot'; ... }
  | { kind: 'sendcheck'; ... }
  | { kind: 'earn'; ... }
  | { kind: 'external'; ... }
  | { kind: 'upgrade'; ... }
  | { kind: 'tag-receipt'; ... }
  | { kind: 'referral'; ... }
  | { kind: 'signing-key'; ... }
  | { kind: 'header'; ... }
```

**Key principle**: All user-facing strings (`title`, `subtitle`) are computed during transformation using i18n translations. Row components receive pre-translated strings and do zero computation.

### 2. Chunked Idle Processor

Cross-platform utility using `requestIdleCallback`:

```typescript
processInChunks(items, transformFn, onComplete, chunkSize)
```

- Processes items during browser/runtime idle time
- Yields to high-priority work (animations, interactions)
- Works on both web and React Native

### 3. Row Factory

Simple switch statement that renders the correct component:

```typescript
function ActivityRowFactory({ item }: { item: ActivityRow }) {
  switch (item.kind) {
    case 'user-transfer': return <UserTransferRowComponent row={item} />
    case 'swap': return <SwapRowComponent row={item} />
    // ...
  }
}
```

Each row component is dead simple - just renders `row.title`, `row.subtitle`, `row.amount`, `row.date`. No string computation, no translations, no conditional text logic.

### 4. useProcessedActivityFeed Hook

Platform-specific implementations:

- **Web** (`useProcessedActivityFeed.ts`): Synchronous processing - Safari doesn't support `requestIdleCallback` and web doesn't have performance issues
- **Native** (`useProcessedActivityFeed.native.ts`): Async processing via `requestIdleCallback` to keep main thread free during scroll

Both versions:
- Fetch raw activity data via `useActivityFeed`
- Transform to typed `ActivityRow[]`
- Return identical interface: `{ processedData, isProcessing, ...queryState }`

## Files

```
packages/app/features/activity/
├── utils/
│   ├── useProcessedActivityFeed.ts        # Web: sync processing
│   ├── useProcessedActivityFeed.native.ts # Native: async idle processing
│   ├── activityTransform.ts               # Transform logic + types
│   ├── activityRowTypes.ts                # Discriminated union types
│   └── idleProcessor.ts                   # requestIdleCallback utility (native only)
├── rows/
│   ├── ActivityRowFactory.tsx       # Factory switch component
│   ├── UserTransferRow.tsx
│   ├── SwapRow.tsx
│   ├── SendpotRow.tsx
│   ├── SendcheckRow.tsx
│   ├── EarnRow.tsx
│   ├── ExternalRow.tsx
│   ├── UpgradeRow.tsx
│   ├── TagReceiptRow.tsx
│   ├── ReferralRow.tsx
│   └── HeaderRow.tsx
└── RecentActivityFeed.tsx           # Main component (simplified)
```

## Benefits

1. **Main thread stays free** - No computation during render
2. **Smooth scrolling** - Work yields to animations/interactions
3. **Type-safe rendering** - Each row type has exact props it needs
4. **Simple components** - Row components just render, no logic
5. **Cross-platform** - Same code works on web and native
