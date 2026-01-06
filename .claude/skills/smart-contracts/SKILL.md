---
name: smart-contracts
description: Foundry smart contract development for Send. Use when building, testing, or deploying Solidity contracts. Located in packages/contracts.
---

# Smart Contracts (Foundry)

Contracts are in `packages/contracts/` using Foundry toolchain.

## Commands

```bash
# Build contracts
yarn contracts build

# Run tests
yarn contracts test

# Deploy to local Anvil
yarn contracts forge script <script_name> --fork-url http://localhost:8546 --broadcast
```

## Local Development

Anvil (local testnet) runs on port 8546 when using Tilt:
```bash
tilt up
```

## Project Structure

```
packages/contracts/
├── src/           # Solidity source files
├── test/          # Foundry tests
├── script/        # Deployment scripts
└── lib/           # Dependencies (submodules)
```

## Blockchain Stack

- **Chain:** Base (L2)
- **Libraries:** Wagmi, Viem
- **Tooling:** Foundry (forge, anvil, cast)
