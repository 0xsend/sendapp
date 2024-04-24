# Testing the Send Flow

Send app is p2p future cash app. It allows users to send ERC-20 tokens, a kind of cryptocurrency, to each other.

We will be convering how to test the send flow in localnet, a forked version of the [Base](https://base.org/) chain.

## Setup

Let's start by setting up the localnet.

- Reset your database and project
  - `tilt down`

- Start your project
  - `tilt up`
  - Wait until the [NextJS server](http://localhost:10350/r/next%3Aweb/overview) is running.

- Seed your database with some data
  - `yarn snaplet:seed` or by clicking the `snaplet seed` button in the Tilt UI.

- Again, ensure there are no errors in the tilt UI. If not, try again.

## Send App

Send app is a [React Native](https://reactnative.dev/) app built using a UI library called [Tamagui](https://tamagui.dev). It is built on top [React Native Web](https://necolas.github.io/react-native-web/) and [Expo](https://docs.expo.dev/) to allow for cross platform development.

For this guide, we will only focus on the React Native part of the app and it's interaction with localnet.

### Sending Tokens

Let's start by sending tokens to another user.

- Open the [Send app](http://localhost:3000/)
- Commplete the onboarding flow
  1. Enter your phone number (123456 is fine for localnet.)
  2. Enter one-time password (OTP). The code is `123456` for localnet.

      At this point, you have created a supabase user, not a Send account. The app should redirect you to onboarding to open your Send account.

  3. Create your passkey.

      **What's happening:** This opens your Send account which is a smart contract wallet that holds your tokens onchain. It pre-approves a USDC paymaster allowing for transacting onchain without actually holding any ether. Initially, the smart account has only one approved signer, the passkey.

  4. Grab some tokens from the secret shop.

      **Note:** On testnet, we operate a faucet that gives you tokens for free. On [Base mainnet](https://basescan.org/), you must follow the deposit flow to fund your Send account.
- Visit a profile of another user
  1. Open the [Send app](http://localhost:3000/activity)
  2. Search for another user
  3. Click on their profile
- Click on the `Send` button
- Enter the amount of tokens you want to send
- Click on the `Send` button

At this point, there should have been a transaction on the localnet blockchain. You can inspect it in our local block explorer [Otterscan](http://localhost:5101/) by pasting the transaction hash in the search bar. Or by clicking, `View on Otterscan` in the button.
