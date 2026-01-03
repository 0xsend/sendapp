# Send Earn Rewards Research

Research for SEND-172: Claim Morpho and Moonwell Rewards

## Overview

Send Earn vaults wrap MetaMorpho vaults, which allocate funds to Morpho lending markets. Both Morpho and Moonwell distribute rewards through the **Merkl** distribution system.

## Architecture

```
User Deposits → SendEarn Vault → MetaMorpho Vault → Morpho Markets
                                        ↓
                              Rewards (MORPHO + WELL tokens)
                                        ↓
                              Merkl Distribution System
                                        ↓
                              Claimable by vault address
```

## Reward Distribution Systems

### Merkl (Current System - July 2025+)

Third-party platform handling Morpho ecosystem rewards including both MORPHO and WELL tokens.

| Property | Value |
|----------|-------|
| Update Frequency | Every ~8 hours |
| Dispute Period | 1-2 hours after update |
| Base Distributor | `0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae` |
| Base Creator | `0x8BB4C975Ff3c250e0ceEA271728547f3802B36Fd` |

### URD - Universal Rewards Distributor (Legacy)

Original Morpho system, still holds historical claimable rewards.

| Property | Value |
|----------|-------|
| Update Frequency | Weekly |
| Base URD Factory | `0x9baA51245CDD28D8D74Afe8B3959b616E9ee7c8D` |
| Base URD | `0x330eefa8a787552DC5cAd3C3cA644844B1E61Ddb` |

## API Endpoints

### Merkl API

```
GET https://api.merkl.xyz/v4/users/{address}/rewards?chainId=8453
```

Response structure:
```typescript
{
  [tokenAddress: string]: {
    amount: string;      // Total tokens credited onchain
    pending: string;     // Rewards updating ~every 2 hours (not immediately claimable)
    claimed: string;     // Already-claimed tokens
    proofs: string[];    // Merkle proofs for claiming
    breakdowns: {        // Campaign attribution
      campaignId: string;
      amount: string;
    }[];
  }
}
```

Rate limit: 10 requests/second (custom API key available for higher limits)

### Morpho URD API (Legacy)

```
GET https://rewards.morpho.org/v1/users/{address}/distributions
```

## Contract Interfaces

### Merkl Distributor

```solidity
function claim(
  address[] users,
  address[] tokens,
  uint256[] amounts,
  bytes32[][] proofs
) external;
```

- Can claim multiple tokens in a single transaction
- Can claim on behalf of other addresses
- Reverts if token/amount doesn't match proof

### URD (Legacy)

```solidity
function claim(
  address account,
  address reward,
  uint256 claimable,
  bytes32[] calldata proof
) external returns (uint256 amount);
```

- Claims one token per call
- Use multicall for multiple tokens

## Token Addresses (Base)

| Token | Address |
|-------|---------|
| MORPHO | `0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842` |
| WELL | `0xA88594D404727625A9437C3f886C7643872296AE` |

## Moonwell Core Markets (Not Used by SendEarn)

Moonwell has traditional Compound-style lending markets with a separate reward system. These are **not** used by SendEarn but documented for completeness.

### Comptroller Claim Functions

```solidity
// Single holder, all markets
function claimReward(uint8 rewardType, address payable holder) public

// Single holder, specific markets
function claimReward(uint8 rewardType, address payable holder, MToken[] memory mTokens) public

// Batch claim
function claimReward(
  uint8 rewardType,
  address payable[] memory holders,
  MToken[] memory mTokens,
  bool borrowers,
  bool suppliers
) public payable
```

- `rewardType`: 0 = WELL, 1 = native asset

### Contract Addresses

| Contract | Address |
|----------|---------|
| Comptroller | `0xfBb21d0380beE3312B33c4353c8936a0F13EF26C` |
| MultiRewardDistributor | `0xe9005b078701e2A0948D2EaC43010D35870Ad9d2` |
| stkWELL | `0xe66E3a37C3274Ac24FE8590f7D84A2427194DC17` |
| Moonwell Views | `0x6834770aba6c2028f448e3259ddee4bcb879d459` |

## Key Insights

1. **Unified Claiming**: Both MORPHO and WELL rewards for MetaMorpho vault depositors are claimed via Merkl
2. **Vault-Level Rewards**: The vault address earns rewards, which are then distributed to depositors
3. **Batch Efficiency**: Multiple tokens can be claimed in a single transaction
4. **Anyone Can Claim**: Claims can be executed by any address on behalf of the reward recipient

## References

- [Morpho Claim Rewards Docs](https://docs.morpho.org/build/rewards/tutorials/claim-rewards)
- [Merkl Technical Overview](https://docs.merkl.xyz/merkl-mechanisms/technical-overview)
- [Merkl API Integration](https://docs.merkl.xyz/integrate-merkl/app)
- [Morpho Contract Addresses](https://docs.morpho.org/get-started/resources/addresses/)
- [Merkl Status Page](https://app.merkl.xyz/status)
- [Moonwell Contracts](https://docs.moonwell.fi/moonwell/protocol-information/contracts)
- [Moonwell Vaults](https://docs.moonwell.fi/moonwell/moonwell-overview/vaults)
- [Moonwell SDK](https://github.com/moonwell-fi/moonwell-sdk)
