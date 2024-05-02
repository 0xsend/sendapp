# Testing Add Backup flow

Send app is p2p future cash app. It allows users to send ERC-20 tokens, a kind of cryptocurrency, to each other.

We will be convering how to test the add backup signers flow in localnet, a forked version of the [Base](https://base.org/) chain.

## Setup

Let's start by setting up the localnet.

- Reset your database and project
  - `tilt down`

- Start your project
  - `tilt up`
  - Wait until the [NextJS server](http://localhost:10350/r/next%3Aweb/overview) is running.

- Again, ensure there are no errors in the tilt UI. If not, try again.

## Adding a backup (passkey) signer

Let's add a backup signer to our account. This flow demonstrates how to add multiple signers to an account so that a
Send account can be backed up. This allows multiple devices to sign transactions for the account.

### Adding a backup signer

- Open the [Send app](http://localhost:3000/)
- Complete the onboarding flow
  1. Enter your phone number (123456 is fine for localnet.)
  2. Enter one-time password (OTP). The code is `123456` for localnet.

      At this point, you have created a supabase user, not a Send account. The app should redirect you to onboarding to open your Send account.

  3. Create your passkey.

      **What's happening:** This opens your Send account which is a smart contract wallet that holds your tokens onchain. It pre-approves a USDC paymaster allowing for transacting onchain without actually holding any ether. Initially, the smart account has only one approved signer, the passkey.

  4. Grab some tokens from the secret shop.

      **Note:** On testnet, we operate a faucet that gives you tokens for free. On [Base mainnet](https://basescan.org/), you must follow the deposit flow to fund your Send account.
- Visit Backup screen
  1. From the Home screen, click the `account` button.
  2. Click the `Settings` button.
  3. Click the `Backup` link.
- Click the `Add Passkey` button

  **Note:** This will need to direct the user to scan a QR code so that new device can add a signer. For now, we will _mock_ this and use the same device to add a signer.

- Give the passkey a name
- Click the `Create Passkey` button

    **What's happening:** This will create a new passkey and save it to the database. This is a prerequisite for the next step. **IT DOES NOT ADD A NEW SIGNER TO THE SEND ACCOUNT ONCHAIN YET**.

- Click the `Add Passkey as Signer` button.
  1. Approve the passkey prompt with key created during onboarding.

      **What's happening:** This is adding the X & Y coordinates of the public key as a signer to the account. It uses the `SendAccount.addSigningKey` function to add the signer.

  2. Wait for the transaction to be confirmed.
  3. See that you have been redirected to the backup screen and the new passkey is now listed.

## Conclusion

In this tutorial, we have demonstrated how to add a backup signer to a Send account. This allows multiple devices to sign transactions for the account.

There are some limitations to this approach. The new passkey must be created and saved to our database before the account is created onchain. This means that a new passkey is in sort of a "pending" state until it is added onchain as a signer.
