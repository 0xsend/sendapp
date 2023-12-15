# Contribution Guide: WIP

## Preface
Send Stack uses bleeding-edge web development technology to deliver great DX to our contributors, quick iteration cycles, and clean bug-free code.

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
<summary style="font-size: 20px;font-weight: bold;">Thinking in Send</summary>

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
     <li>
     ?
     </li>
     </ul>
</details>
<hr/>



<details style="padding: 1rem 0">
<summary style="font-size: 20px;font-weight: bold;">Prerequisites</summary>


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
<hr/>


<details style="padding: 1rem 0">
<summary style="font-size: 20px;font-weight: bold;">Your First Build</summary>

<h2 style="font-size: 20px;font-weight: bold;">Build Steps</h2>


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



If the build succeeds you're good to go!


<details style="padding: 1rem 0">
<summary style="font-size: 20px;font-weight: bold;">Next App Development</summary>

In project root, run

```console!
yarn web
```

If everything is setup, the app should open in dev mode on your [localhost](http://localhost:3000)!


![image](https://hackmd.io/_uploads/B1heDBuSa.png)
</details>

<details style="padding: 1rem 0">
<summary style="font-size: 20px;font-weight: bold;">Entering the App</summary>


- *Entering the app requires Send's supabase instance running*
     `yarn supabase start`

Once the next app is running in dev mode, enter the app using the standard dev credentials

![image](https://hackmd.io/_uploads/BkKRmSF8p.png)
*Any 10 letter phone number will work*

![image](https://hackmd.io/_uploads/By9e4rtL6.png)
*123456*
</details>
<hr/>



<details  style="padding: 1rem 0">
<summary style="font-size: 20px;font-weight: bold;">Native App Development</summary>
*Note: Send uses React Native with Expo. [Download Expo Go ](https://expo.dev/client)for a streamlined native development experience

```console!
yarn native
```
</details>
<hr/>
