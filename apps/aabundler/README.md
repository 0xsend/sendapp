# Account Abstraction Bundler

The account abstraction bundler is responsible for writing user operations onchain via the Entrypoint contract.

## Usage

```shell
docker run --rm \
        --name aa-bundler \
        --add-host=host.docker.internal:host-gateway \
        -p 127.0.0.1:3030:3030 \
        -v ./keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266:/app/keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        -v ./etc/aabundler:/app/etc/aabundler \
        -e "DEBUG=aa.rpc" \
        -e "DEBUG_COLORS=true" \
        accountabstraction/bundler:0.7.0 \
        --port 3030 \
        --config /app/etc/aabundler/aabundler.config.json \
        --mnemonic /app/keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
        --network http://host.docker.internal:8546 \
        --entryPoint 0x0000000071727De22E5E9d8BAf0edAc6f37da032 \
        --beneficiary 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
```

## Configuration

The bundler is configured via a JSON file or command line arguments. Below is an example configuration file.

```json
{
  "gasFactor": "1",
  "minBalance": "50000000000000",
  "maxBundleGas": 5e6,
  "minStake": "50000000000000",
  "minUnstakeDelay": 86400,
  "autoBundleInterval": 2,
  "autoBundleMempoolSize": 10,
  "mnemonic": "/app/keys/0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  "network": "http://host.docker.internal:8546",
  "entryPoint": "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
  "beneficiary": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
}
```

### Developer mode

You can run the bundler in developer mode by running the following commands from the root of the bundler repo.

```bash
cd $FULLPATH/eth-infinitism-bundler/packages/utils/
yarn run tsc

cd $FULLPATH/eth-infinitism-bundler/packages/bundler/

DEBUG="aa.*" yarn run ts-node ./src/exec.ts \

--port 3030 \

--config $FULLPATH/etc/aabundler-nodocker.config.json
```
