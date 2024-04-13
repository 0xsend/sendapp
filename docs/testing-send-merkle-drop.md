# Testing the Send Merkle Drop

## Setup

To test the Send Merkle Drop distributions, we will use a local Base fork to allow us to test the claim process. It leverages a scrubbed snapshot of our production database so we can impersonate a user and claim their tokens in a test environment.

- Reset your database and project
  - `tilt down`

- Start your project
  - `tilt up`
  - Wait until the supabase resource is ready

- Restore your database from our latest snapshot
  - Ensure you are logged into Snaplet and have been granted access to the Send team in the Snaplet team settings.
  - Ensure you have a copy of the private key to decrypt the snapshot in your project `./.snaplet/id_rsa`.
  - Restore the database from the latest snapshot: `yarn snaplet:snapshot:restore`

Now, ensure there are no errors in the tilt UI. If not, try again.

## Distributor

Let's check on the distributor. It is a simple Express app that re-calculates the distribution shares for each Send token holder every minute. You can find it's logs in the [`distributor:web`](http://localhost:10350/r/distributor%3Aweb/overview) resource.

After completing the steps above, you should see some logs in the [`distributor:web`](http://localhost:10350/r/distributor%3Aweb/overview) resource.

<!-- markdownlint-disable MD033 -->
<details>

  <summary>Click to expand</summary>
  
```json
{"level":30,"time":1713033056353,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"distribution_id":4,"msg":"Calculating distribution shares."}
{"level":30,"time":1713033056409,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"msg":"Found 2932 verifications."}
{"level":30,"time":1713033056410,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"msg":"Found 2284 users with verifications."}
{"level":30,"time":1713033056544,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"msg":"Found 2277 addresses."}
⚠️ Overriding Base chain ID 8453 with 845337 in __DEV__ mode
{"level":30,"time":1713033056659,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"msg":"Found 2277 balances."}
{"level":30,"time":1713033056659,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"msg":"Found 250 balances after filtering hodler_min_balance of 100000"}
{"level":30,"time":1713033056659,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"totalWeight":12212201658,"hodlerPoolAvailableAmount":585000000,"weightPerSend":208755,"msg":"Calculated 250 weights."}
{"level":30,"time":1713033056661,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"maxBonusPoolBips":5384,"msg":"Calculated fixed & bonus pool amounts."}
{"level":30,"time":1713033056662,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"totalAmount":603654778,"totalHodlerPoolAmount":585001514,"totalBonusPoolAmount":13143264,"totalFixedPoolAmount":5510000,"maxBonusPoolBips":5384,"name":"Distribution #4","shares":250,"msg":"Distribution totals"}
{"level":30,"time":1713033056662,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","distribution_id":4,"msg":"Calculated 250 shares."}
{"level":30,"time":1713033056687,"pid":72637,"hostname":"PixelProton.attlocal.net","module":"distributor","id":"o11pif","lastDistributionId":4,"msg":"Finished calculating distributions."}
```

</details>
<!-- markdownlint-enable MD033 -->

The important lines look like this `Calculated NNNN shares.`. Where NNNN is the number of shares that were calculated.

## Create a new distribution onchain

Let's create a new distribution onchain in your local anvil fork.

```shell
tilt trigger anvil:base
tilt wait --timeout 5m --for=condition=Ready "uiresource/anvil:base"
tilt trigger anvil:anvil-add-send-merkle-drop-fixtures
```

Again, ensure there are no errors in the tilt UI. If not, try again.

## Impersonate a user

For this next step, we will impersonate a user and claim their tokens. Let's poke around in the supabase UI to find the user we want to impersonate. Hopefully, you already know a public address that has not claimed their tokens yet.

- Open the [Supabase Studio](http://localhost:54323/)
- Go to the [Table Editor](http://localhost:54323/project/default/editor/17787) tab and find the `distribution_shares` table.
  - Take note of their Ethereum address.
- Filter to the `distribution_id` you'd like to claim and copy the `user_id` of the user you want to impersonate.
- Finally, find that user in the `auth.users` table by filtering to their `id`
  - Take note of their phone number.

Now, let's impersonate the user and claim their tokens. Before you continue, make sure you have copied the phone number and the user's Ethereum public address.

### A note on impersonation

If this is not your first time impersonating a user, you may skip this step.

Unless you have the private key of the user you are impersonating, you will not be able to claim their tokens. This is a security feature of cryptography and blockchains.

Impersonation is a feature of [`anvil`](https://book.getfoundry.sh/reference/anvil/#custom-methods). We will leverage a browser extension that enables us to impersonate a user in the browser.

#### Install the browser extension

- 1. Install the [Rivet Browser Extension](https://github.com/paradigmxyz/rivet). I do not recommend using the version from the Chrome Web Store.
  - 1. `git clone --branch v0.0.10 https://github.com/paradigmxyz/rivet.git`
  - 2. `cd rivet`
  - 3. `bun install`
  - 4. `bun run dev`
- 2. Open the [Send app](http://localhost:3000/)
- 3. Click the Rivet icon in the top right corner (click the puzzle piece icon if you don't see it).
- 4. Click the `Create Anvil Instance` button
- 5. Click `Continue` when it asks to install Foundry (you should already have it installed).
- 6. Enter the local Base node in the Setup Configure Options section.
  - 1. Use `8546` for the port.
  - 2. All other options can be left as is, it will automatically configure after it connects to the node.
  - 3. Once the extension is loaded, showing you the list of accounts. You may want to also add a connection for the ethereum mainnet fork. Click the `RPC URL` row and add `http://127.0.0.1:8545/` as the URL, then press `Import` button.
- 7. **Important** Import the public address of the user you want to impersonate.
- 8. **Important** Switch to the public address of the user you want to impersonate.

## Claiming the tokens

Let's claim the tokens. Let's use that user's phone number to impersonate them in Send app.

- Open the [Send app](http://localhost:3000/)
- Paste the phone number of the user you want to impersonate without the country code prefix, all phones in the snapshot are in the US (dial code 1).
- Enter `123456` as the OTP code
- Navigate to the [Send It Rewards](http://localhost:3000/account/rewards) page
- Click the `Connect Wallet` button
- Select `Browser Wallet` from the modal
- Approve in Rivet
- Click the `Claim` button
- Approve in Rivet
- Wait for the transaction to be confirmed
- Hopefully, you will see the tokens in your wallet
