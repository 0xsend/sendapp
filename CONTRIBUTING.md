<!-- markdownlint-disable MD033 -->

# Contribution Guide

## Preface

Send Stack uses bleeding-edge web development technology to deliver great DX to our contributors, quick iteration cycles, and clean code.

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
<code>
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
|   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/shovel">shovel</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/snaplet">snaplet</a>
|   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/temporal">temporal</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/ui">ui</a>
│   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/wagmi">wagmi</a>
|   ├── <a href="https://github.com/0xsend/sendapp/tree/main/packages/webauthn-authenticator">webauthn-authenticator</a>
│   └── <a href="https://github.com/0xsend/sendapp/tree/main/packages/workflows">workflows</a>
└── <a href="https://github.com/0xsend/sendapp/tree/main/supabase">supabase</a>
</code>
</pre>

<details style="padding: 1rem 0">
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

When cloning the repo, you will need to initialize the submodules:

```console
git clone --recurse-submodules https://github.com/0xsend/sendapp.git && cd sendapp
```

If you missed the `--recurse-submodules` flag, you can initialize them manually:

```console
git submodule deinit --force .
git submodule update --init --recursive
```

### Tools

You'll need a basic understanding of JS tooling

Required JS Runtime: [Node >= 20.9.0](https://nodejs.org/en/download)

#### [Yarn Package Manager](https://yarnpkg.com/)

See [yarn package manager](https://yarnpkg.com/). We are using Yarn 4 with workspaces.

```console
corepack enable
```

<details style="padding: 0.5rem 0">
<summary style="font-size:16px;font-weight: bold;"><h4 style="display:inline;padding:0 0.5rem;">Issues</h4></summary>

If you are running a M1, M2 or M3 Mac this may cause some issues.

###### Failing to install `better-sqlite3`

If you get the following error:

`error: libtool: file: Release/obj.target/sqlite3/gen/sqlite3/sqlite3.0 is not an object file (not allowed in a library)`

See the following [issue](https://github.com/TryGhost/node-sqlite3/issues/1538)
for instructions on how to solve it, essentially setting the following values
solves the issue:

```sh
export LDFLAGS="-L/opt/homebrew/opt/sqlite/lib"
export CPPFLAGS="-I/opt/homebrew/opt/sqlite/include"
export PKG_CONFIG_PATH="/opt/homebrew/opt/sqlite/lib/pkgconfig"
```

Ensure these are added to `.env.local` in the following way, so they work in tilt:

```
LDFLAGS=-L/opt/homebrew/opt/sqlite/lib
CPPFLAGS=-I/opt/homebrew/opt/sqlite/include
PKG_CONFIG_PATH=/opt/homebrew/opt/sqlite/lib/pkgconfig
```

</details>

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

#### [Bun](https://bunpkg.com/)

```console
curl -fsSL https://bun.sh/install | bash
```

#### Brew Bundle

Many other dependencies are installed via [Homebrew](https://brew.sh/). To install all dependencies, run from the
project root:

```console
brew bundle
```

</details>

<details style="padding: 1rem 0">
<summary style="font-size:20px;font-weight:bold;"><h2 style="display:inline;padding:0 1rem;">Your First Build</h2></summary>

<h3 style="font-size:20px;font-weight:bold;">Build Steps</h3>

To streamline the project setup and build process, we recommend using [Tilt](https://docs.tilt.dev/install.html). Tilt automates and optimizes the development cycle, making it faster and more efficient. Tilt is also used for CI, so using it locally ensures that your code will build and deploy correctly in the CI environment.

### Getting Started with Tilt

First, install Tilt by following the instructions on their [installation page](https://docs.tilt.dev/install.html). Once installed, you can proceed with the following steps:

#### 1. Initialize Project with Tilt

In the project root directory, run:

```console
tilt up
```

This command will start all the services defined in the [Tiltfile](/Tiltfile), building and deploying your application in a local development environment.

##### Efficient Tilt Usage

`tilt up` will start a local Postgres database, Supabase, local Ethereum node, and local Base node. It also starts the unit tests for the application.

To save some resources on your local machine, you can limit the amount of resources used by Tilt by specifying them on the command line or disabling them in the [Tilt UI](http://localhost:10350).

This command for example will only start the Next.js web app and it's dependencies:

```console
tilt up next:web
```

You can always re-enable the disabled resources by re-running the `tilt up` command or manually enabling them in the [Tilt UI](http://localhost:10350).

#### 2. Monitoring and Logs

You can monitor the build process and access logs directly through the Tilt UI. Simply navigate to `http://localhost:10350` in your web browser to view the status of your services.

#### 3. Making Changes

With Tilt, you can make changes to your codebase, and Tilt will automatically detect these changes, rebuild, and redeploy the affected services. This live update feature ensures that you always test against the latest version of your code.

#### 4. Shutting Down

Once you're done developing, you can shut down all services by pressing `Ctrl+C` in the terminal where you ran `tilt up`.

It will leave somethings running in the background. To stop all services, run `tilt down`.

```console
❯ tilt down
Loading Tiltfile at: /Users/bigboss/src/0xsend/sendapp/Tiltfile
Loading environment from .env
Loading environment from .env.local
local: sh -c "yarn supabase stop --no-backup\n    # can be removed once supabase stop --no-backup is fixed\n    docker volume ls --filter label=com.supabase.cli.project=send | awk 'NR>1 {print $2}' | xargs -I {} docker volume rm {}"
 → Stopping containers...
 → Stopped supabase local development setup.
 → Local data are backed up to docker volume. Use docker to show them: docker volume ls --filter label=com.supabase.cli.project=send
 → supabase_storage_send
local: yarn clean
 → Done in 0s 663ms
Successfully loaded Tiltfile (3.632166166s)
```

By leveraging Tilt, you can focus more on coding and less on the setup, significantly improving your development experience with the Send Stack.

</details>
