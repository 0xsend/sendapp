# Creating Distribution Tranche

## Recalculating Distribution Shares

The distributor app calculates distribution shares through a three-step process, applying various adjustments and caps to ensure fair token distribution.

### Distribution Calculation Process

#### 1. Initial Hodler Rewards

The first step calculates initial rewards using the full distribution amount. This establishes baseline amounts that will be used to cap fixed rewards. For each hodler:

- Balances are checked against minimum hodler requirements
- Time-based adjustments are applied based on qualification period
- Send ceiling/slash adjustments are applied to balances
- Initial weighted distribution is calculated

#### 2. Fixed Pool Rewards

Fixed rewards are calculated based on user verifications and achievements:

- Each verification type can have fixed values and multipliers
- Multipliers increase based on repeated verifications
- Fixed rewards are capped by the initial hodler amounts
- Send ceiling/slash adjustments are applied
- Total fixed pool allocation is tracked

#### 3. Final Hodler Pool Rewards

The remaining amount after fixed pool allocation is distributed:

- Uses (total distribution amount - fixed pool allocated amount)
- Applies time-based adjustments to the remaining pool
- Applies send ceiling/slash adjustments
- Distributes based on weighted hodler balances

### Key Mechanisms

#### Time-based Adjustments

Distribution amounts are progressively released throughout the qualification period:

- Calculated based on hours in qualification month
- Adjusted for current hour in qualification period
- Prevents early participants from receiving full allocation immediately
- Formula: `hourlyAmount * currentHour / totalHours`

#### Send Ceiling and Slash Mechanism

Rewards are adjusted based on send activity:

- Previous distribution rewards affect base calculation
- Send ceiling verification weight impacts reward allocation
- Scaling divisor applied to previous rewards
- Slash percentage calculated as: `(cappedSendScore * PERC_DENOM) / scaledPreviousReward`

#### Verification Multipliers

Fixed rewards can be amplified through multipliers:

- Each verification type can have min/max multiplier values
- Multiplier steps increase based on verification count
- Multiple verification types can compound multipliers

### API Usage

To manually request a distribution be recalculated, send a `POST` request to the `/distributor` endpoint:

process.env.DISTRIBUTOR_URL="https://distributor.prod.send.it"
process.env.DISTRIBUTION_ID="11"
process.env.SUPABASE_SERVICE_ROLE =
'<same service role configured on distributor>'

const response = await fetch(`${process.env.DISTRIBUTOR_URL}/distributor/v2`, {
method: 'POST',
body: JSON.stringify({ id: process.env.DISTRIBUTION_ID }),
headers: {
'Content-Type': 'application/json',
Authorization: process.env.SUPABASE_SERVICE_ROLE,
},
})

// get the response body
const body = await response.json()
console.log(body)

## Generate Merkle Tree Root

yarn workspace @my/contracts run gen-dist-merkle-tree $DISTRIBUTION_ID

The output of the command is the merkle root hash. This hash is used to create a distribution tranche. You can find the full details (including the distribution total) in the ./var directory.

## Creating a Distribution

[Send Token `0xEab49138BA2Ea6dd776220fE26b7b8E446638956`](https://basescan.io/address/0xEab49138BA2Ea6dd776220fE26b7b8E446638956)
[SendMerkleDrop (distribution contract) `0xB9310daE45E71c7a160A13D64204623071a8E347`](https://basescan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)

To get started, connect [Send Distribution Safe](https://app.safe.global/home?safe=eth:0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7) via WalletConnect to etherscan

1. Approve amount for SendMerkleDrop contract to transfer `0xB9310daE45E71c7a160A13D64204623071a8E347` add to batch
2. Add tranche pasing in the merkle root and amount add to batch. :warning: must match exactly, no spaces, etc.. :warning:
3. Wait for tx, then claim!
