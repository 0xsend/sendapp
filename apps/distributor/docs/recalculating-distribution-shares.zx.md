# Creating Distribution Tranche

## Recalculating Distribution Shares

The distributor app will re-calculate the distribution shares for each Send token holder by analyzing the Ethereum mainnet blocks for Send token transfers. The distributor app will then update the distribution shares for each Send token holder in the database.

To manually request a distribution be recalculated, send a `POST` request to the `/distributor` endpoint:

```js
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
```

## Generate Merkle Tree Root

```shell
yarn workspace @my/contracts run gen-dist-merkle-tree $DISTRIBUTION_ID
```

The output of the command is the merkle root hash. This hash is used to create a distribution tranche. You can find the full details (including the distribution total) in the `./var` directory.

## Creating a Distribution

[Send Token `0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A`](https://etherscan.io/address/0x3f14920c99beb920afa163031c4e47a3e03b3e4a)
[SendMerkleDrop (distribution contract) `0xB9310daE45E71c7a160A13D64204623071a8E347`](
https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)

To get started, connect [Send Distribution Safe](https://app.safe.global/home?safe=eth:0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7) via WalletConnect to etherscan

1. Approve amount for SendMerkleDrop contract to transfer `0xB9310daE45E71c7a160A13D64204623071a8E347` add to batch
2. Add tranche pasing in the merkle root and amount add to batch. :warning: must match exactly, no spaces, etc.. :warning:
3. Wait for tx, then claim!
