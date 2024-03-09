
# Deploy

Currently hosted on Digital Ocean Ubuntu 23.04 droplets.

```shell
doctl compute droplet create \
    --image ubuntu-23-04-x64 \
    --size s-2vcpu-4gb \
    --region nyc1 \
    --vpc-uuid vpc-uuid \
    --enable-monitoring \
    --ssh-keys ssh-key-id \
    distributor-stage-send-nyc1-01
```

To see existing droplets and their IP addresses:

```shell
doctl auth list
doctl auth switch send
doctl compute droplet ls
```

Then, ssh into the droplet and run the following commands.

## Install dependencies

### Install fnm and node

```shell
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg git unzip
curl -fsSL https://fnm.vercel.app/install | bash
source /root/.bashrc
fnm install
corepack enable
```

### Install Shovel

```shell
# linux/amd64, darwin/arm64, darwin/amd64, windows/amd64
curl -LO https://indexsupply.net/bin/main/linux/amd64/shovel
chmod +x shovel
mv shovel /usr/local/bin/shovel
shovel -version
# vmain 0ec8
```

### Install Caddy

We use Caddy as a reverse proxy to route traffic to the app for automatic SSL.

```shell
# Install Caddy
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install caddy
```

### Install app dependencies

Then, clone the repo and install dependencies:

```shell
ssh-keygen -t rsa -b 4096 -C "distributor-stage-send-nyc1-01"
cat ~/.ssh/id_rsa.pub
# Add the key to the repo as a deploy key
# https://github.com/0xsend/sendstack/settings/keys
git clone git@github.com:0xsend/sendstack.git
cd sendstack
npm -g install yarn pm2
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc
foundryup
yarn install
```

### Configure the app

This uses development settings. For production, use the production settings.

```shell
cat <<EOF > .env.local
# 🧑‍💻 DEVELOPMENT SETTING
NODE_ENV=development
NEXT_PUBLIC_SUPABASE_PROJECT_ID=default
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
NEXT_PUBLIC_SUPABASE_GRAPHQL_URL=http://localhost:54321/graphql/v1
NEXT_PUBLIC_MAINNET_RPC_URL=http://127.0.0.1:8545/
SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:54322/postgres
SUPABASE_SERVICE_ROLE=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long
NEXT_PUBLIC_MAINNET_CHAIN_ID=1337
```

### Running the app

#### Distributor

This is the main application that recalculates the distribution shares for each Send token holder. Then, run the app:

```shell
pm2 start --name distributor "yarn distributor start"
pm2 logs distributor
```

Check that the app is running:

```shell
curl http://localhost:3050/distributor
# {"distributor":true,"id":"keworl","lastBlockNumber":"18252625","lastBlockNumberAt":"2023-10-14T16:54:05.346Z","running":true}
```

#### Shovel

This is a background worker that listens for new Send token transfers and saves them to the database. It requires
some environment variables to be set. You can set them in a script and run the script.

Ensure the `shovel` binary is installed and the `shovel` command is available in the terminal. Then, pass the path config file to the `shovel` command.

```shell
cat <<EOF > shovel.sh
#!/bin/bash
set -e

export DASHBOARD_ROOT_PASSWORD=$(tr -dc 'A-Za-z0-9!?%=' < /dev/urandom | head -c 32)
export DATABASE_URL=postgres://postgres:postgres@localhost:54322/postgres
export BASE_NAME=basesepolia
export BASE_RPC_URL=https://base-sepolia-rpc.publicnode.com/
export BASE_CHAIN_ID=84532
export BASE_BLOCK_START=4570291

shovel -config /root/sendapp/packages/shovel/etc/config.json
EOF

chmod +x shovel.sh
pm2 start --name shovel $(pwd)/shovel.sh
pm2 logs shovel
```

#### ⚠️ If this is the first deployment, you should also run the following commands

This will ensure that the app is restarted on reboot.

```shell
pm2 startup
pm2 save
```

### Configure Caddy

Be sure to configure the DNS records for the domain to point to the droplet's IP address so that Caddy can automatically provision SSL certificates. Or prefix the domain with `http://` to disable SSL.

```shell
cat <<EOF > /etc/caddy/Caddyfile
distributor.stage.send.it {
        reverse_proxy localhost:3050
}
EOF
caddy reload -c /etc/caddy/Caddyfile
```

## Deploying updates

```shell
git pull
yarn install
pm2 restart distributor
pm2 restart shovel
```

## Monitoring

```shell
pm2 monit
```
