# Metro Resolver for @coinbase/onchainkit

## Problem

Metro bundler (used by Expo/React Native) has limited support for modern package.json `exports` field, especially for subpath exports. The `@coinbase/onchainkit` package uses modern ES module exports with subpath patterns like:

- `@coinbase/onchainkit/fund`
- `@coinbase/onchainkit/wallet`
- `@coinbase/onchainkit/swap`
- etc.

While Next.js handles these exports natively, Metro fails to resolve them, causing import errors in Expo apps.

## Solution

Implemented a generic custom resolver in `apps/expo/metro.config.js` that automatically handles all `@coinbase/onchainkit` subpath exports.

### How It Works

The resolver:

1. **Detects subpath imports**: Checks if the module name starts with `@coinbase/onchainkit/`
2. **Maps to ESM files**: Converts subpath exports to their actual ESM file locations
3. **Handles standard exports**: Maps most subpaths to `esm/{subpath}/index.js`
4. **Handles special cases**: Manages nested exports like `nft/view` and `nft/mint`

### Supported Subpaths

The resolver currently supports all official `@coinbase/onchainkit` exports:

- `api` → `esm/api/index.js`
- `appchain` → `esm/appchain/index.js`
- `buy` → `esm/buy/index.js`
- `checkout` → `esm/checkout/index.js`
- `core` → `esm/core/index.js`
- `earn` → `esm/earn/index.js`
- `fund` → `esm/fund/index.js`
- `identity` → `esm/identity/index.js`
- `minikit` → `esm/minikit/index.js`
- `nft` → `esm/nft/index.js`
- `signature` → `esm/signature/index.js`
- `swap` → `esm/swap/index.js`
- `token` → `esm/token/index.js`
- `transaction` → `esm/transaction/index.js`
- `wallet` → `esm/wallet/index.js`

### Special Nested Exports

- `nft/view` → `esm/nft/components/view/index.js`
- `nft/mint` → `esm/nft/components/mint/index.js`

## Usage

Now you can import from any `@coinbase/onchainkit` subpath in your Expo app:

```typescript
import { getOnrampBuyUrl } from '@coinbase/onchainkit/fund'
import { ConnectWallet } from '@coinbase/onchainkit/wallet'
import { Swap } from '@coinbase/onchainkit/swap'
// ... etc
```

## Extending the Resolver

If `@coinbase/onchainkit` adds new subpath exports in future versions:

1. **Standard subpaths**: Add the new subpath to the `knownSubpaths` array
2. **Nested subpaths**: Add a new conditional block following the pattern of `nft/view` and `nft/mint`

### Example: Adding a new subpath

```javascript
const knownSubpaths = [
  'api', 'appchain', 'buy', 'checkout', 'core', 'earn', 'fund', 
  'identity', 'minikit', 'nft', 'signature', 'swap', 'token', 
  'transaction', 'wallet',
  'new-feature' // Add new subpaths here
]
```

## Benefits

- **Future-proof**: Automatically handles all current and future standard subpath exports
- **Maintainable**: Easy to extend when new exports are added
- **Performance**: No file system checks, direct path mapping
- **Comprehensive**: Covers all current exports including nested ones
- **Explicit**: Clear about what subpaths are supported

## Technical Details

The resolver works by intercepting Metro's module resolution process and providing direct file paths for `@coinbase/onchainkit` subpath imports, bypassing Metro's limited exports field support.

This solution maintains compatibility with the existing resolver for `@0xsend/send-earn-contracts` and falls back to Metro's default resolution for all other modules.
