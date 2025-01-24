# Send Token Upgrade Contract Deployments

Using `0x647eb43401e13e995D89Cf26cD87e68890EE3f89` or the original send deployer account

- [Base Sepolia](https://sepolia.basescan.org/address/0x647eb43401e13e995d89cf26cd87e68890ee3f89)
- [Base](https://basescan.org/address/0x647eb43401e13e995d89cf26cd87e68890ee3f89)

## Base Sepolia

- Send Token V0 Address -> [`0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680`](https://sepolia.basescan.org/address/0x7cefbe54c37a35dcdad29b86373ca8353a2f4680)
- Send Token V1 Address -> [`0xB5Ac39587df1B5CE6252b3Ea0510Eb460Cbf4aDb`](https://sepolia.basescan.org/address/0xB5Ac39587df1B5CE6252b3Ea0510Eb460Cbf4aDb)

### Deploy Send Merkle Drop

```shell
SEND_TOKEN=0xB5Ac39587df1B5CE6252b3Ea0510Eb460Cbf4aDb \
SEND_MERKLE_DROP_OWNER=0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
forge script ./script/DeploySendMerkleDrop.s.sol:DeploySendMerkleDropScript \
  -vvvv \
  --rpc-url base-sepolia \
  --sender 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --froms 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --keystores ~/.foundry/keystores/send_deployer \
  --broadcast --verify --verifier etherscan
```

### Deploy Send Verifying Paymaster

```shell
VERIFIER='0xF7055D18A745B155369d78B5c143C24C563E8B51' \
OWNER='0x647eb43401e13e995D89Cf26cD87e68890EE3f89' \
forge script ./script/DeploySendVerifyingPaymaster.s.sol:DeploySendVerifyingPaymasterScript \
  -vvvv \
  --rpc-url base-sepolia \
  --sender 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --froms 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --keystores ~/.foundry/keystores/send_deployer \
  --broadcast --verify --verifier etherscan
```

## Base

- Send Token V0 Address -> [`0x3f14920c99beb920afa163031c4e47a3e03b3e4a`](https://basescan.org/address/0x3f14920c99beb920afa163031c4e47a3e03b3e4a)
- Send Token V1 Address -> [`0xEab49138BA2Ea6dd776220fE26b7b8E446638956`](https://basescan.org/address/0xEab49138BA2Ea6dd776220fE26b7b8E446638956)

### Deploy Send Merkle Drop

```shell
SEND_TOKEN=0xEab49138BA2Ea6dd776220fE26b7b8E446638956 \
SEND_MERKLE_DROP_OWNER=0xD3DCFf1823714a4399AD2927A3800686D4CEB53A \
forge script ./script/DeploySendMerkleDrop.s.sol:DeploySendMerkleDropScript \
  -vvvv \
  --rpc-url base \
  --sender 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --froms 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --keystores ~/.foundry/keystores/send_deployer \
  --broadcast --verify --verifier etherscan
```

### Deploy Send Verifying Paymaster

```shell
VERIFIER='0x589d516Fe1b6F807396f0e9CA24fa0B7F3aE9470' \
OWNER='0x647eb43401e13e995D89Cf26cD87e68890EE3f89' \
forge script ./script/DeploySendVerifyingPaymaster.s.sol:DeploySendVerifyingPaymasterScript \
  -vvvv \
  --rpc-url base \
  --sender 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --froms 0x647eb43401e13e995D89Cf26cD87e68890EE3f89 \
  --keystores ~/.foundry/keystores/send_deployer \
  --broadcast --verify --verifier etherscan
```
