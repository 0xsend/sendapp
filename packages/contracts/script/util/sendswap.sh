#!/bin/bash

# Set up variables
DEPLOYER_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
RPC_URL="http://127.0.0.1:8545"

WETH_TOKEN=0x4200000000000000000000000000000000000006 
USDC_TOKEN=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 
SEND_TOKEN=0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A 

ETH_WHALE=0x3304e22ddaa22bcdc5fca2269b418046ae7b566a
SEND_WHALE=0xD3DCFf1823714a4399AD2927A3800686D4CEB53A 
USDC_WHALE=0x3304E22DDaa22bCdC5fCa2269b418046aE7b566A 
WETH_WHALE=0x46a83dC1a264Bff133dB887023d2884167094837 

# Amount of tokens to transfer (adjust as needed)
ETH_AMOUNT=10000000000000000000  # 10 ETH
WETH_AMOUNT=10000000000000000000  # 10 WETH
SEND_AMOUNT=100000000  # 100000000 send (0 decimals)
USDC_AMOUNT=10000000000  # 10000 USDC (6 decimals)

# Impersonate accounts and transfer tokens
echo "Transferring ETH..."
cast rpc anvil_impersonateAccount $ETH_WHALE --rpc-url $RPC_URL
cast send $DEPLOYER_ADDRESS --from $ETH_WHALE --value $ETH_AMOUNT --rpc-url $RPC_URL --unlocked

echo "Transferring WETH..."
cast rpc anvil_impersonateAccount $WETH_WHALE --rpc-url $RPC_URL
cast send $WETH_TOKEN "transfer(address,uint256)" $DEPLOYER_ADDRESS $WETH_AMOUNT --from $WETH_WHALE --rpc-url $RPC_URL --unlocked

echo "Transferring SEND tokens..."
cast rpc anvil_impersonateAccount $SEND_WHALE --rpc-url $RPC_URL
cast send $SEND_TOKEN "transfer(address,uint256)" $DEPLOYER_ADDRESS $SEND_AMOUNT --from $SEND_WHALE --rpc-url $RPC_URL --unlocked

echo "Transferring USDC..."
cast rpc anvil_impersonateAccount $USDC_WHALE --rpc-url $RPC_URL
cast send $USDC_TOKEN "transfer(address,uint256)" $DEPLOYER_ADDRESS $USDC_AMOUNT --from $USDC_WHALE --rpc-url $RPC_URL --unlocked

# Print balances
echo "Final balances:"
echo "ETH: $(cast balance $DEPLOYER_ADDRESS --rpc-url $RPC_URL)"
echo "SEND: $(cast call $SEND_TOKEN "balanceOf(address)(uint256)" $DEPLOYER_ADDRESS --rpc-url $RPC_URL)"
echo "USDC: $(cast call $USDC_TOKEN "balanceOf(address)(uint256)" $DEPLOYER_ADDRESS --rpc-url $RPC_URL)"
echo "WETH: $(cast call $WETH_TOKEN "balanceOf(address)(uint256)" $DEPLOYER_ADDRESS --rpc-url $RPC_URL)"

echo "Done!"