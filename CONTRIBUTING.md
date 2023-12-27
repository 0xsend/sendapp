# Contribution Guide: WIP

## Preface
Send Stack uses bleeding-edge web development technology to deliver great DX to our contributors, quick iteration cycles, and clean code.

**Send Stack**
 - **Typescript** (strict mode)
 - **Bun** Package Manager
 - **Yarn** workspaces w/ Yarn berry
 - **Turborepo** Build System
 - **Foundry** Toolkit
 - **React Native** w/ Expo
 - **Next.js**
 - **Tamagui** for cross-platform styles
 - **Solito** for cross-platform routing
 - **Supabase** a OSS firebase alternative for DB and auth



## Send Stack
Here is a quick peek at the send stack. Quickly jump to any of the submodules by clicking the links below.

<pre>
.
├── apps
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/apps/distributor">distributor</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/apps/expo">expo</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/apps/next">next</a>
├── <a href="https://github.com/0xsend/sendapp/tree/main/docs">docs</a>
├── packages
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/api">api</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/app">app</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/contracts">contracts</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/daimo-expo-passkeys">daimo-expo-passkeys</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/eslint-config-custom">eslint-config-customs</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/playwright">playwright</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/ui">ui</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/wagmi">wagmi</a>
│   └── <a href="https://github.com/0xsend/sendapp/tree/main/packages/webauthn-authenticator">webauthn-authenticator</a>
└── <a href="https://github.com/0xsend/sendapp/tree/main/supabase">supabase</a>
 </code>
</pre>


<details padding="1rem 0">
<summary style="font-size:20px;font-weight: bold;"><h2 style="display:inline;padding:0 1rem;">Thinking in Send</h2></summary>

Here are some things to keep in mind about thee SEND philosophy when contributing
  <ul>
     <li>
  Simplicity over complexity (K.I.S.S)
     </li>
     <li>
     Don't repeat yourself (DRY)
     </li>
     <li>
     Write a test. Don't click the same button over and over
     </li>
     <li>
     Write once, Run everywhere
     </li>
     </ul>
</details>




<details style="padding: 1rem 0">
<summary style="font-size:20px;font-weight: bold;"><h2 style="display:inline;padding:0 1rem;">Prerequisites</h2></summary>


```console
git clone https://github.com/0xsend/sendapp.git && cd sendapp
```

You'll need a basic understanding of JS tooling

Required JS Runtime: [Node >= 20.9.0](https://nodejs.org/en/download)

#### [yarn package manager](https://yarnpkg.com/)
```console
corepack enable
```


#### [Turborepo](https://turbo.build/repo/docs/installing#install-globally)
```console
npm install turbo --global
```

#### [Foundry](https://book.getfoundry.sh/getting-started/installation)

Installation is easiest with `foundryup`

```console!
curl -L https://foundry.paradigm.xyz | bash
```
then in a new terminal run
```console
foundryup
```
</details>



<details style="padding: 1rem 0">
<summary style="font-size:20px;font-weight:bold;"><h2 style="display:inline;padding:0 1rem;">Your First Build<h2></summary>

<h3 style="font-size:20px;font-weight:bold;">Build Steps</h3>


#### 1. Install dependencies
```console
yarn
```

#### 2. Create .env.local
```console!
cp .env.local.template .env.local
```

#### 3. Build monorepo
```console!
turbo run build
```

#### 4. Initialize supabase DB and auth
Prerequisites:
- [Docker](https://docs.docker.com/desktop/)
```console!
yarn supabase start
```

#### 5. Fork blockchain to local node
Use foundry's local testnet node [anvil](https://book.getfoundry.sh/anvil/)

**Fork Ethereum Mainnet (port: 8545)**
```console!
anvil -f https://rpc.ankr.com/eth
```
**Fork Base Mainnet (port: 8546)**
```console!
anvil -f https://mainnet.base.org -p 8546
```

*Note*: These RPC urls can be rate limited. If you want something more reliable, use [Alchemy](https://www.alchemy.com/) or [Infura](https://infura.io/)


Alright If the build succeeds you're ready to send it 🚀


<details style="padding: 1rem">
   <summary ><h3 style="display:inline;padding:0 1rem;">Next App Development</h3></summary>
   <br/>
   In project root, run

   ```console!
   yarn web
   ```

   If everything is setup, the app should open in dev mode on your [localhost](http://localhost:3000)!



   <img src="https://hackmd.io/_uploads/B1heDBuSa.png" width="100" style="border-radius:9999px">

   <details style="padding: 1rem;">
      <summary ><h3 style="display:inline;padding:0 1rem;">Entering the App</h3></summary>
      <br/>

  - *Entering the app requires Send's supabase instance running*

   `yarn supabase start`


   Once the next app is running in dev mode, enter the app using the standard dev credentials

   <img src="https://hackmd.io/_uploads/BkKRmSF8p.png" width="600">

   *Any 10 letter phone number will work*

   <img src="https://hackmd.io/_uploads/By9e4rtL6.png" width="600">

   *123456*
   </details>
   <details style="padding: 1rem;">
      <summary ><h3 style="display:inline;padding:0 1rem;">Interacting with Send contracts</h3></summary>
      <br/>

  - *Interacting with contracts requires a local blockchain node to be running in the background*

   `anvil -f https://rpc.ankr.com/eth` (or any other mainnet RPC url)

   </details>
</details>






<details  style="padding: 1rem">
   <summary><h3 style="display:inline;padding:0 1rem;">Native App Development</h3></summary>
   <br/>

   *Note:* Send uses React Native with Expo. [Download Expo Go ](https://expo.dev/client)for a streamlined native development experience

   ```console!
   yarn native
   ```
</details>