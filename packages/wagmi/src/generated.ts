import {
  createReadContract,
  createWatchContractEvent,
  createWriteContract,
  createSimulateContract,
} from 'wagmi/codegen'

import {
  createUseReadContract,
  createUseWatchContractEvent,
  createUseWriteContract,
  createUseSimulateContract,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC165
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc165Abi = [
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Proxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967ProxyAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'implementation', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'payable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Utils
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967UtilsAbi = [
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'previousAdmin', internalType: 'address', type: 'address', indexed: false },
      { name: 'newAdmin', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AdminChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'beacon', internalType: 'address', type: 'address', indexed: true }],
    name: 'BeaconUpgraded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'admin', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidAdmin',
  },
  {
    type: 'error',
    inputs: [{ name: 'beacon', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidBeacon',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20Abi = [
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address', indexed: true },
      { name: 'spender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Transfer',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EntryPoint
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const entryPointAbi = [
  {
    type: 'function',
    inputs: [{ name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint256', type: 'uint256' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct PackedUserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
              { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
              { name: 'signature', internalType: 'bytes', type: 'bytes' },
            ],
          },
          { name: 'aggregator', internalType: 'contract IAggregator', type: 'address' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct PackedUserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'factory', internalType: 'address', type: 'address', indexed: false },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AccountDeployed',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BeforeExecution' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalDeposit', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'PostOpRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address', indexed: true }],
    name: 'SignatureAggregatorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalStaked', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawTime', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'actualGasUsed', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationPrefundTooLow',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'UserOperationRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'ret', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'FailedOp',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'inner', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
  },
  {
    type: 'error',
    inputs: [{ name: 'returnData', internalType: 'bytes', type: 'bytes' }],
    name: 'PostOpReverted',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const entryPointAddress = {
  1: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  1337: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  8453: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  84532: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  845337: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
  11155111: '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const entryPointConfig = { address: entryPointAddress, abi: entryPointAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EntryPointSimulations
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const entryPointSimulationsAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [
      { name: 'initCode', internalType: 'bytes', type: 'bytes' },
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
    ],
    name: '_validateSenderAndPaymaster',
    outputs: [],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'deposits',
    outputs: [
      { name: 'deposit', internalType: 'uint256', type: 'uint256' },
      { name: 'staked', internalType: 'bool', type: 'bool' },
      { name: 'stake', internalType: 'uint112', type: 'uint112' },
      { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
      { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint256', type: 'uint256' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct PackedUserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
              { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
              { name: 'signature', internalType: 'bytes', type: 'bytes' },
            ],
          },
          { name: 'aggregator', internalType: 'contract IAggregator', type: 'address' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct PackedUserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'callData', internalType: 'bytes', type: 'bytes' },
      {
        name: 'opInfo',
        internalType: 'struct EntryPoint.UserOpInfo',
        type: 'tuple',
        components: [
          {
            name: 'mUserOp',
            internalType: 'struct EntryPoint.MemoryUserOp',
            type: 'tuple',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterVerificationGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterPostOpGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'paymaster', internalType: 'address', type: 'address' },
              { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
            ],
          },
          { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'contextOffset', internalType: 'uint256', type: 'uint256' },
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
        ],
      },
      { name: 'context', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'innerHandleOp',
    outputs: [{ name: 'actualGasCost', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'nonceSequenceNumber',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'op',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'targetCallData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [
      {
        name: '',
        internalType: 'struct IEntryPointSimulations.ExecutionResult',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paid', internalType: 'uint256', type: 'uint256' },
          { name: 'accountValidationData', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterValidationData', internalType: 'uint256', type: 'uint256' },
          { name: 'targetSuccess', internalType: 'bool', type: 'bool' },
          { name: 'targetResult', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'simulateValidation',
    outputs: [
      {
        name: '',
        internalType: 'struct IEntryPointSimulations.ValidationResult',
        type: 'tuple',
        components: [
          {
            name: 'returnInfo',
            internalType: 'struct IEntryPoint.ReturnInfo',
            type: 'tuple',
            components: [
              { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
              { name: 'prefund', internalType: 'uint256', type: 'uint256' },
              { name: 'accountValidationData', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterValidationData', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterContext', internalType: 'bytes', type: 'bytes' },
            ],
          },
          {
            name: 'senderInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'factoryInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'paymasterInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'aggregatorInfo',
            internalType: 'struct IEntryPoint.AggregatorStakeInfo',
            type: 'tuple',
            components: [
              { name: 'aggregator', internalType: 'address', type: 'address' },
              {
                name: 'stakeInfo',
                internalType: 'struct IStakeManager.StakeInfo',
                type: 'tuple',
                components: [
                  { name: 'stake', internalType: 'uint256', type: 'uint256' },
                  { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
                ],
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'interfaceId', internalType: 'bytes4', type: 'bytes4' }],
    name: 'supportsInterface',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'factory', internalType: 'address', type: 'address', indexed: false },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AccountDeployed',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BeforeExecution' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalDeposit', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'PostOpRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address', indexed: true }],
    name: 'SignatureAggregatorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalStaked', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawTime', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'actualGasUsed', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationPrefundTooLow',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'UserOperationRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'ret', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'FailedOp',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'inner', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
  },
  {
    type: 'error',
    inputs: [{ name: 'returnData', internalType: 'bytes', type: 'bytes' }],
    name: 'PostOpReverted',
  },
  { type: 'error', inputs: [], name: 'ReentrancyGuardReentrantCall' },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IEntryPoint
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iEntryPointAbi = [
  {
    type: 'function',
    inputs: [{ name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint256', type: 'uint256' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct PackedUserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
              { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
              { name: 'signature', internalType: 'bytes', type: 'bytes' },
            ],
          },
          { name: 'aggregator', internalType: 'contract IAggregator', type: 'address' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct PackedUserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'factory', internalType: 'address', type: 'address', indexed: false },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AccountDeployed',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BeforeExecution' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalDeposit', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'PostOpRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address', indexed: true }],
    name: 'SignatureAggregatorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalStaked', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawTime', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'actualGasUsed', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationPrefundTooLow',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'UserOperationRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'ret', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'FailedOp',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'inner', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
  },
  {
    type: 'error',
    inputs: [{ name: 'returnData', internalType: 'bytes', type: 'bytes' }],
    name: 'PostOpReverted',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IEntryPointSimulations
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iEntryPointSimulationsAbi = [
  {
    type: 'function',
    inputs: [{ name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'delegateAndRevert',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint256', type: 'uint256' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct PackedUserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
              { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
              { name: 'signature', internalType: 'bytes', type: 'bytes' },
            ],
          },
          { name: 'aggregator', internalType: 'contract IAggregator', type: 'address' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleAggregatedOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct PackedUserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'op',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'targetCallData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [
      {
        name: '',
        internalType: 'struct IEntryPointSimulations.ExecutionResult',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paid', internalType: 'uint256', type: 'uint256' },
          { name: 'accountValidationData', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterValidationData', internalType: 'uint256', type: 'uint256' },
          { name: 'targetSuccess', internalType: 'bool', type: 'bool' },
          { name: 'targetResult', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'simulateValidation',
    outputs: [
      {
        name: '',
        internalType: 'struct IEntryPointSimulations.ValidationResult',
        type: 'tuple',
        components: [
          {
            name: 'returnInfo',
            internalType: 'struct IEntryPoint.ReturnInfo',
            type: 'tuple',
            components: [
              { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
              { name: 'prefund', internalType: 'uint256', type: 'uint256' },
              { name: 'accountValidationData', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterValidationData', internalType: 'uint256', type: 'uint256' },
              { name: 'paymasterContext', internalType: 'bytes', type: 'bytes' },
            ],
          },
          {
            name: 'senderInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'factoryInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'paymasterInfo',
            internalType: 'struct IStakeManager.StakeInfo',
            type: 'tuple',
            components: [
              { name: 'stake', internalType: 'uint256', type: 'uint256' },
              { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
            ],
          },
          {
            name: 'aggregatorInfo',
            internalType: 'struct IEntryPoint.AggregatorStakeInfo',
            type: 'tuple',
            components: [
              { name: 'aggregator', internalType: 'address', type: 'address' },
              {
                name: 'stakeInfo',
                internalType: 'struct IStakeManager.StakeInfo',
                type: 'tuple',
                components: [
                  { name: 'stake', internalType: 'uint256', type: 'uint256' },
                  { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256' },
                ],
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'factory', internalType: 'address', type: 'address', indexed: false },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'AccountDeployed',
  },
  { type: 'event', anonymous: false, inputs: [], name: 'BeforeExecution' },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalDeposit', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Deposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'PostOpRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address', indexed: true }],
    name: 'SignatureAggregatorChanged',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'totalStaked', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'unstakeDelaySec', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeLocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawTime', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeUnlocked',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'StakeWithdrawn',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'paymaster', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'success', internalType: 'bool', type: 'bool', indexed: false },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'actualGasUsed', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationEvent',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationPrefundTooLow',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'nonce', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'revertReason', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'UserOperationRevertReason',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    type: 'error',
    inputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'ret', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'DelegateAndRevert',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
    ],
    name: 'FailedOp',
  },
  {
    type: 'error',
    inputs: [
      { name: 'opIndex', internalType: 'uint256', type: 'uint256' },
      { name: 'reason', internalType: 'string', type: 'string' },
      { name: 'inner', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'FailedOpWithRevert',
  },
  {
    type: 'error',
    inputs: [{ name: 'returnData', internalType: 'bytes', type: 'bytes' }],
    name: 'PostOpReverted',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendAccount
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendAccountAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_sendVerifier', internalType: 'contract SendVerifier', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'slot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
    ],
    name: 'addSigningKey',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct SendAccount.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'dest', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'executeBatch',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getActiveSigningKeys',
    outputs: [
      { name: 'activeSigningKeys', internalType: 'bytes32[2][]', type: 'bytes32[2][]' },
      { name: 'activeSigningKeySlots', internalType: 'uint8[]', type: 'uint8[]' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'slot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
      {
        name: 'initCalls',
        internalType: 'struct SendAccount.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'dest', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'message', internalType: 'bytes32', type: 'bytes32' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ name: 'magicValue', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint8', type: 'uint8' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'keys',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'maxKeys',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'numActiveKeys',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'slot', internalType: 'uint8', type: 'uint8' }],
    name: 'removeSigningKey',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'sig',
        internalType: 'struct Signature',
        type: 'tuple',
        components: [
          { name: 'authenticatorData', internalType: 'bytes', type: 'bytes' },
          { name: 'clientDataJSON', internalType: 'string', type: 'string' },
          { name: 'challengeLocation', internalType: 'uint256', type: 'uint256' },
          { name: 'responseTypeLocation', internalType: 'uint256', type: 'uint256' },
          { name: 'r', internalType: 'uint256', type: 'uint256' },
          { name: 's', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'signatureStruct',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'missingAccountFunds', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'validateUserOp',
    outputs: [{ name: 'validationData', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'verifier',
    outputs: [{ name: '', internalType: 'contract SendVerifier', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'entryPoint', internalType: 'contract IEntryPoint', type: 'address', indexed: true },
    ],
    name: 'AccountInitialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'version', internalType: 'uint64', type: 'uint64', indexed: false }],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Received',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'contract IAccount', type: 'address', indexed: true },
      { name: 'keySlot', internalType: 'uint8', type: 'uint8', indexed: false },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]', indexed: false },
    ],
    name: 'SigningKeyAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'account', internalType: 'contract IAccount', type: 'address', indexed: true },
      { name: 'keySlot', internalType: 'uint8', type: 'uint8', indexed: false },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]', indexed: false },
    ],
    name: 'SigningKeyRemoved',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendAccountFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const sendAccountFactoryAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_verifier', internalType: 'contract SendVerifier', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'accountImplementation',
    outputs: [{ name: '', internalType: 'contract SendAccount', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'keySlot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
      {
        name: 'initCalls',
        internalType: 'struct SendAccount.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'dest', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'salt', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createAccount',
    outputs: [{ name: 'ret', internalType: 'contract SendAccount', type: 'address' }],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'keySlot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
      {
        name: 'initCalls',
        internalType: 'struct SendAccount.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'dest', internalType: 'address', type: 'address' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'data', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'salt', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getAddress',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'verifier',
    outputs: [{ name: '', internalType: 'contract SendVerifier', type: 'address' }],
    stateMutability: 'view',
  },
] as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const sendAccountFactoryAddress = {
  8453: '0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745',
  845337: '0xDf11654D97006885F4D7bff6F2c1260C4d72D984',
} as const

/**
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const sendAccountFactoryConfig = {
  address: sendAccountFactoryAddress,
  abi: sendAccountFactoryAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendAirdropsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendAirdropsSafeAbi = [] as const

export const sendAirdropsSafeAddress = '0x077c4E5983e5c495599C1Eb5c1511A52C538eB50' as const

export const sendAirdropsSafeConfig = {
  address: sendAirdropsSafeAddress,
  abi: sendAirdropsSafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendMerkleDrop
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const sendMerkleDropAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_token', internalType: 'contract IERC20', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_merkleRoot', internalType: 'bytes32', type: 'bytes32' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addTranche',
    outputs: [{ name: 'trancheId', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_address', internalType: 'address', type: 'address' },
      { name: '_tranche', internalType: 'uint256', type: 'uint256' },
      { name: '_index', internalType: 'uint256', type: 'uint256' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_merkleProof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'claimTranche',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_address', internalType: 'address', type: 'address' },
      { name: '_tranches', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '_indexes', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '_amounts', internalType: 'uint256[]', type: 'uint256[]' },
      { name: '_merkleProofs', internalType: 'bytes32[][]', type: 'bytes32[][]' },
    ],
    name: 'claimTranches',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '_trancheId', internalType: 'uint256', type: 'uint256' }],
    name: 'expireTranche',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tranche', internalType: 'uint256', type: 'uint256' },
      { name: '_index', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'isClaimed',
    outputs: [{ name: 'claimed', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'merkleRoots',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheActive',
    outputs: [{ name: 'valid', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmount',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmountClaimed',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmounts',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmountsClaimed',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'trancheCursor',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_transferTo', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferToken',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: '_address', internalType: 'address', type: 'address' },
      { name: '_tranche', internalType: 'uint256', type: 'uint256' },
      { name: '_index', internalType: 'uint256', type: 'uint256' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_merkleProof', internalType: 'bytes32[]', type: 'bytes32[]' },
    ],
    name: 'verifyClaim',
    outputs: [{ name: 'valid', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address payable', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'claimer', internalType: 'address', type: 'address', indexed: false },
      { name: 'tranche', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Claimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'previousOwner', internalType: 'address', type: 'address', indexed: true },
      { name: 'newOwner', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'tranche', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'merkleRoot', internalType: 'bytes32', type: 'bytes32', indexed: false },
      { name: 'totalAmount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'TrancheAdded',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'tranche', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'TrancheExpired',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'AddressInsufficientBalance',
  },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const sendMerkleDropAddress = {
  1: '0xB9310daE45E71c7a160A13D64204623071a8E347',
  1337: '0xB9310daE45E71c7a160A13D64204623071a8E347',
  8453: '0x240761104aF5DAeDFd9025810FfEB741fEB316B3',
  84532: '0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE',
  845337: '0x614F5273FdB63C1E1972fe1457Ce77DF1Ca440A6',
  11155111: '0xB9310daE45E71c7a160A13D64204623071a8E347',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const sendMerkleDropConfig = {
  address: sendMerkleDropAddress,
  abi: sendMerkleDropAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendRevenueSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x71fa02bb11e4b119bEDbeeD2f119F62048245301)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x269cD0a2afd1BAbdA7A74ab1dC853869a37aa4a7)
 */
export const sendRevenueSafeAbi = [] as const

/**
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x71fa02bb11e4b119bEDbeeD2f119F62048245301)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x269cD0a2afd1BAbdA7A74ab1dC853869a37aa4a7)
 */
export const sendRevenueSafeAddress = {
  8453: '0x71fa02bb11e4b119bEDbeeD2f119F62048245301',
  84532: '0x269cD0a2afd1BAbdA7A74ab1dC853869a37aa4a7',
  845337: '0x71fa02bb11e4b119bEDbeeD2f119F62048245301',
} as const

/**
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x71fa02bb11e4b119bEDbeeD2f119F62048245301)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x269cD0a2afd1BAbdA7A74ab1dC853869a37aa4a7)
 */
export const sendRevenueSafeConfig = {
  address: sendRevenueSafeAddress,
  abi: sendRevenueSafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendToken
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const sendTokenAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address', indexed: true },
      { name: 'spender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Transfer',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const sendTokenAddress = {
  1: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  1337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  8453: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  84532: '0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680',
  845337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  11155111: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const sendTokenConfig = { address: sendTokenAddress, abi: sendTokenAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendTreasurySafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendTreasurySafeAbi = [] as const

export const sendTreasurySafeAddress = '0x05CEa6C36f3a44944A4F4bA39B1820677AcB97EE' as const

export const sendTreasurySafeConfig = {
  address: sendTreasurySafeAddress,
  abi: sendTreasurySafeAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendUniswapV3Pool
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendUniswapV3PoolAbi = [] as const

export const sendUniswapV3PoolAddress = '0xA1B2457C0B627F97f6cc892946A382451e979014' as const

export const sendUniswapV3PoolConfig = {
  address: sendUniswapV3PoolAddress,
  abi: sendUniswapV3PoolAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendVerifier
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const sendVerifierAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [],
    name: 'UPGRADE_INTERFACE_VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'initialOwner', internalType: 'address', type: 'address' }],
    name: 'init',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'message', internalType: 'bytes', type: 'bytes' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
      { name: 'x', internalType: 'uint256', type: 'uint256' },
      { name: 'y', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'verifySignature',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'version', internalType: 'uint64', type: 'uint64', indexed: false }],
    name: 'Initialized',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'previousOwner', internalType: 'address', type: 'address', indexed: true },
      { name: 'newOwner', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  { type: 'error', inputs: [], name: 'InvalidInitialization' },
  { type: 'error', inputs: [], name: 'NotInitializing' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  { type: 'error', inputs: [], name: 'UUPSUnauthorizedCallContext' },
  {
    type: 'error',
    inputs: [{ name: 'slot', internalType: 'bytes32', type: 'bytes32' }],
    name: 'UUPSUnsupportedProxiableUUID',
  },
] as const

/**
 *
 */
export const sendVerifierAddress = {
  845337: '0xE269194e41Cd50E2986f82Fc23A2B95D8bAFED2B',
} as const

/**
 *
 */
export const sendVerifierConfig = { address: sendVerifierAddress, abi: sendVerifierAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendVerifierProxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const sendVerifierProxyAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'fallback', stateMutability: 'payable' },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address' }],
    name: 'ERC1967InvalidImplementation',
  },
  { type: 'error', inputs: [], name: 'ERC1967NonPayable' },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
] as const

/**
 *
 */
export const sendVerifierProxyAddress = {
  845337: '0x6c38612d3f645711dd080711021fC1bA998a5628',
} as const

/**
 *
 */
export const sendVerifierProxyConfig = {
  address: sendVerifierProxyAddress,
  abi: sendVerifierProxyAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SenderCreator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const senderCreatorAbi = [
  {
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'createSender',
    outputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    stateMutability: 'nonpayable',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TokenPaymaster
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 *
 */
export const tokenPaymasterAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_token', internalType: 'contract IERC20Metadata', type: 'address' },
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_wrappedNative', internalType: 'contract IERC20', type: 'address' },
      { name: '_uniswap', internalType: 'contract ISwapRouter', type: 'address' },
      {
        name: '_tokenPaymasterConfig',
        internalType: 'struct TokenPaymasterConfig',
        type: 'tuple',
        components: [
          { name: 'priceMarkup', internalType: 'uint256', type: 'uint256' },
          { name: 'minEntryPointBalance', internalType: 'uint128', type: 'uint128' },
          { name: 'refundPostopCost', internalType: 'uint48', type: 'uint48' },
          { name: 'priceMaxAge', internalType: 'uint48', type: 'uint48' },
          { name: 'baseFee', internalType: 'uint40', type: 'uint40' },
        ],
      },
      {
        name: '_rewardsConfig',
        internalType: 'struct RewardsConfig',
        type: 'tuple',
        components: [
          { name: 'rewardsShare', internalType: 'uint16', type: 'uint16' },
          { name: 'rewardsPool', internalType: 'address', type: 'address' },
        ],
      },
      {
        name: '_oracleHelperConfig',
        internalType: 'struct OracleHelperConfig',
        type: 'tuple',
        components: [
          { name: 'cacheTimeToLive', internalType: 'uint48', type: 'uint48' },
          { name: 'maxOracleRoundAge', internalType: 'uint48', type: 'uint48' },
          { name: 'tokenOracle', internalType: 'contract IOracle', type: 'address' },
          { name: 'nativeOracle', internalType: 'contract IOracle', type: 'address' },
          { name: 'tokenToNativeOracle', internalType: 'bool', type: 'bool' },
          { name: 'tokenOracleReverse', internalType: 'bool', type: 'bool' },
          { name: 'nativeOracleReverse', internalType: 'bool', type: 'bool' },
          { name: 'priceUpdateThreshold', internalType: 'uint256', type: 'uint256' },
        ],
      },
      {
        name: '_uniswapHelperConfig',
        internalType: 'struct UniswapHelperConfig',
        type: 'tuple',
        components: [
          { name: 'minSwapAmount', internalType: 'uint256', type: 'uint256' },
          { name: 'uniswapPoolFee', internalType: 'uint24', type: 'uint24' },
          { name: 'slippage', internalType: 'uint8', type: 'uint8' },
        ],
      },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [{ name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
    stateMutability: 'payable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cachedPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'cachedPriceTimestamp',
    outputs: [{ name: '', internalType: 'uint48', type: 'uint48' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'tokenPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'nativeAssetPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'tokenOracleReverse', internalType: 'bool', type: 'bool' },
      { name: 'nativeOracleReverse', internalType: 'bool', type: 'bool' },
    ],
    name: 'calculatePrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  { type: 'function', inputs: [], name: 'deposit', outputs: [], stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'oracleHelperConfig',
    outputs: [
      { name: 'cacheTimeToLive', internalType: 'uint48', type: 'uint48' },
      { name: 'maxOracleRoundAge', internalType: 'uint48', type: 'uint48' },
      { name: 'tokenOracle', internalType: 'contract IOracle', type: 'address' },
      { name: 'nativeOracle', internalType: 'contract IOracle', type: 'address' },
      { name: 'tokenToNativeOracle', internalType: 'bool', type: 'bool' },
      { name: 'tokenOracleReverse', internalType: 'bool', type: 'bool' },
      { name: 'nativeOracleReverse', internalType: 'bool', type: 'bool' },
      { name: 'priceUpdateThreshold', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'mode', internalType: 'enum IPaymaster.PostOpMode', type: 'uint8' },
      { name: 'context', internalType: 'bytes', type: 'bytes' },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256' },
      { name: 'actualUserOpFeePerGas', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'postOp',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'rewardsConfig',
    outputs: [
      { name: 'rewardsShare', internalType: 'uint16', type: 'uint16' },
      { name: 'rewardsPool', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_oracleHelperConfig',
        internalType: 'struct OracleHelperConfig',
        type: 'tuple',
        components: [
          { name: 'cacheTimeToLive', internalType: 'uint48', type: 'uint48' },
          { name: 'maxOracleRoundAge', internalType: 'uint48', type: 'uint48' },
          { name: 'tokenOracle', internalType: 'contract IOracle', type: 'address' },
          { name: 'nativeOracle', internalType: 'contract IOracle', type: 'address' },
          { name: 'tokenToNativeOracle', internalType: 'bool', type: 'bool' },
          { name: 'tokenOracleReverse', internalType: 'bool', type: 'bool' },
          { name: 'nativeOracleReverse', internalType: 'bool', type: 'bool' },
          { name: 'priceUpdateThreshold', internalType: 'uint256', type: 'uint256' },
        ],
      },
    ],
    name: 'setOracleConfiguration',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_rewardsConfig',
        internalType: 'struct RewardsConfig',
        type: 'tuple',
        components: [
          { name: 'rewardsShare', internalType: 'uint16', type: 'uint16' },
          { name: 'rewardsPool', internalType: 'address', type: 'address' },
        ],
      },
    ],
    name: 'setRewardsConfig',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_tokenPaymasterConfig',
        internalType: 'struct TokenPaymasterConfig',
        type: 'tuple',
        components: [
          { name: 'priceMarkup', internalType: 'uint256', type: 'uint256' },
          { name: 'minEntryPointBalance', internalType: 'uint128', type: 'uint128' },
          { name: 'refundPostopCost', internalType: 'uint48', type: 'uint48' },
          { name: 'priceMaxAge', internalType: 'uint48', type: 'uint48' },
          { name: 'baseFee', internalType: 'uint40', type: 'uint40' },
        ],
      },
    ],
    name: 'setTokenPaymasterConfig',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_uniswapHelperConfig',
        internalType: 'struct UniswapHelperConfig',
        type: 'tuple',
        components: [
          { name: 'minSwapAmount', internalType: 'uint256', type: 'uint256' },
          { name: 'uniswapPoolFee', internalType: 'uint24', type: 'uint24' },
          { name: 'slippage', internalType: 'uint8', type: 'uint8' },
        ],
      },
    ],
    name: 'setUniswapConfiguration',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tokenPaymasterConfig',
    outputs: [
      { name: 'priceMarkup', internalType: 'uint256', type: 'uint256' },
      { name: 'minEntryPointBalance', internalType: 'uint128', type: 'uint128' },
      { name: 'refundPostopCost', internalType: 'uint48', type: 'uint48' },
      { name: 'priceMaxAge', internalType: 'uint48', type: 'uint48' },
      { name: 'baseFee', internalType: 'uint40', type: 'uint40' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'price', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'tokenToWei',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'uniswap',
    outputs: [{ name: '', internalType: 'contract ISwapRouter', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'uniswapHelperConfig',
    outputs: [
      { name: 'minSwapAmount', internalType: 'uint256', type: 'uint256' },
      { name: 'uniswapPoolFee', internalType: 'uint24', type: 'uint24' },
      { name: 'slippage', internalType: 'uint8', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  { type: 'function', inputs: [], name: 'unlockStake', outputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [{ name: 'force', internalType: 'bool', type: 'bool' }],
    name: 'updateCachedPrice',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct PackedUserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'accountGasLimits', internalType: 'bytes32', type: 'bytes32' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'gasFees', internalType: 'bytes32', type: 'bytes32' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'maxCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'validatePaymasterUserOp',
    outputs: [
      { name: 'context', internalType: 'bytes', type: 'bytes' },
      { name: 'validationData', internalType: 'uint256', type: 'uint256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
      { name: 'price', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'weiToToken',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'recipient', internalType: 'address payable', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawEth',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawToken',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'wrappedNative',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'tokenPaymasterConfig',
        internalType: 'struct TokenPaymasterConfig',
        type: 'tuple',
        components: [
          { name: 'priceMarkup', internalType: 'uint256', type: 'uint256' },
          { name: 'minEntryPointBalance', internalType: 'uint128', type: 'uint128' },
          { name: 'refundPostopCost', internalType: 'uint48', type: 'uint48' },
          { name: 'priceMaxAge', internalType: 'uint48', type: 'uint48' },
          { name: 'baseFee', internalType: 'uint40', type: 'uint40' },
        ],
        indexed: false,
      },
    ],
    name: 'ConfigUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'oracleHelperConfig',
        internalType: 'struct OracleHelperConfig',
        type: 'tuple',
        components: [
          { name: 'cacheTimeToLive', internalType: 'uint48', type: 'uint48' },
          { name: 'maxOracleRoundAge', internalType: 'uint48', type: 'uint48' },
          { name: 'tokenOracle', internalType: 'contract IOracle', type: 'address' },
          { name: 'nativeOracle', internalType: 'contract IOracle', type: 'address' },
          { name: 'tokenToNativeOracle', internalType: 'bool', type: 'bool' },
          { name: 'tokenOracleReverse', internalType: 'bool', type: 'bool' },
          { name: 'nativeOracleReverse', internalType: 'bool', type: 'bool' },
          { name: 'priceUpdateThreshold', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
    ],
    name: 'OracleConfigUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'previousOwner', internalType: 'address', type: 'address', indexed: true },
      { name: 'newOwner', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'OwnershipTransferred',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Received',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'rewardsConfig',
        internalType: 'struct RewardsConfig',
        type: 'tuple',
        components: [
          { name: 'rewardsShare', internalType: 'uint16', type: 'uint16' },
          { name: 'rewardsPool', internalType: 'address', type: 'address' },
        ],
        indexed: false,
      },
    ],
    name: 'RewardsConfigUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'currentPrice', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'previousPrice', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'cachedPriceTimestamp', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'TokenPriceUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'uniswapHelperConfig',
        internalType: 'struct UniswapHelperConfig',
        type: 'tuple',
        components: [
          { name: 'minSwapAmount', internalType: 'uint256', type: 'uint256' },
          { name: 'uniswapPoolFee', internalType: 'uint24', type: 'uint24' },
          { name: 'slippage', internalType: 'uint8', type: 'uint8' },
        ],
        indexed: false,
      },
    ],
    name: 'UniswapConfigUpdated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'tokenIn', internalType: 'address', type: 'address', indexed: false },
      { name: 'tokenOut', internalType: 'address', type: 'address', indexed: false },
      { name: 'amountIn', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'amountOutMin', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UniswapReverted',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'user', internalType: 'address', type: 'address', indexed: true },
      { name: 'actualTokenCharge', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        name: 'actualTokenPriceWithMarkup',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      { name: 'baseFee', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationSponsored',
  },
  {
    type: 'error',
    inputs: [{ name: 'target', internalType: 'address', type: 'address' }],
    name: 'AddressEmptyCode',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'AddressInsufficientBalance',
  },
  { type: 'error', inputs: [], name: 'FailedInnerCall' },
  {
    type: 'error',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'OwnableInvalidOwner',
  },
  {
    type: 'error',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'OwnableUnauthorizedAccount',
  },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
] as const

/**
 *
 */
export const tokenPaymasterAddress = {
  845337: '0x60C8bFee4148017F7A1d5141155baA782342A156',
} as const

/**
 *
 */
export const tokenPaymasterConfig = {
  address: tokenPaymasterAddress,
  abi: tokenPaymasterAbi,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// USDC
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const usdcAbi = [
  {
    type: 'event',
    inputs: [
      { name: 'owner', type: 'address', indexed: true },
      { name: 'spender', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    inputs: [
      { name: 'from', type: 'address', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false },
    ],
    name: 'Transfer',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', type: 'address' },
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const usdcAddress = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  1337: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  8453: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  84532: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  845337: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  11155111: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const usdcConfig = { address: usdcAddress, abi: usdcAbi } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Action
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc165Abi}__
 */
export const readErc165 = /*#__PURE__*/ createReadContract({ abi: erc165Abi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc165Abi}__ and `functionName` set to `"supportsInterface"`
 */
export const readErc165SupportsInterface = /*#__PURE__*/ createReadContract({
  abi: erc165Abi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__
 */
export const watchErc1967ProxyEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967ProxyAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchErc1967ProxyUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__
 */
export const watchErc1967UtilsEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UtilsAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const watchErc1967UtilsAdminChangedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const watchErc1967UtilsBeaconUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'BeaconUpgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchErc1967UtilsUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const readErc20 = /*#__PURE__*/ createReadContract({ abi: erc20Abi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"allowance"`
 */
export const readErc20Allowance = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"balanceOf"`
 */
export const readErc20BalanceOf = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decimals"`
 */
export const readErc20Decimals = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"name"`
 */
export const readErc20Name = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"symbol"`
 */
export const readErc20Symbol = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"totalSupply"`
 */
export const readErc20TotalSupply = /*#__PURE__*/ createReadContract({
  abi: erc20Abi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const writeErc20 = /*#__PURE__*/ createWriteContract({ abi: erc20Abi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const writeErc20Approve = /*#__PURE__*/ createWriteContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const writeErc20Transfer = /*#__PURE__*/ createWriteContract({
  abi: erc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const writeErc20TransferFrom = /*#__PURE__*/ createWriteContract({
  abi: erc20Abi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const prepareWriteErc20 = /*#__PURE__*/ createSimulateContract({ abi: erc20Abi })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const prepareWriteErc20Approve = /*#__PURE__*/ createSimulateContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const prepareWriteErc20Transfer = /*#__PURE__*/ createSimulateContract({
  abi: erc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const prepareWriteErc20TransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: erc20Abi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20Abi}__
 */
export const watchErc20Event = /*#__PURE__*/ createWatchContractEvent({ abi: erc20Abi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Approval"`
 */
export const watchErc20ApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc20Abi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Transfer"`
 */
export const watchErc20TransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: erc20Abi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPoint = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPointBalanceOf = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPointGetDepositInfo = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPointGetNonce = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const readEntryPointGetUserOpHash = /*#__PURE__*/ createReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPoint = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointAddStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointDelegateAndRevert = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointDepositTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointGetSenderAddress = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointHandleAggregatedOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointHandleOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointIncrementNonce = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const writeEntryPointWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPoint = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointAddStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointDelegateAndRevert = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointDepositTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointGetSenderAddress = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointHandleAggregatedOps = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointHandleOps = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointIncrementNonce = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointWithdrawStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const prepareWriteEntryPointWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointAccountDeployedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointBeforeExecutionEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Deposited"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointDepositedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"PostOpRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointPostOpRevertReasonEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'PostOpRevertReason',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeLocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointStakeLockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointStakeUnlockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointUserOperationEventEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'UserOperationEvent',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointUserOperationRevertReasonEvent = /*#__PURE__*/ createWatchContractEvent(
  { abi: entryPointAbi, address: entryPointAddress, eventName: 'UserOperationRevertReason' }
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Withdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const watchEntryPointWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const readEntryPointSimulations = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"_validateSenderAndPaymaster"`
 */
export const readEntryPointSimulationsValidateSenderAndPaymaster = /*#__PURE__*/ createReadContract(
  { abi: entryPointSimulationsAbi, functionName: '_validateSenderAndPaymaster' }
)

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"balanceOf"`
 */
export const readEntryPointSimulationsBalanceOf = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"deposits"`
 */
export const readEntryPointSimulationsDeposits = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'deposits',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const readEntryPointSimulationsGetDepositInfo = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getNonce"`
 */
export const readEntryPointSimulationsGetNonce = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const readEntryPointSimulationsGetUserOpHash = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"nonceSequenceNumber"`
 */
export const readEntryPointSimulationsNonceSequenceNumber = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'nonceSequenceNumber',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const readEntryPointSimulationsSupportsInterface = /*#__PURE__*/ createReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const writeEntryPointSimulations = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const writeEntryPointSimulationsAddStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const writeEntryPointSimulationsDelegateAndRevert = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const writeEntryPointSimulationsDepositTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const writeEntryPointSimulationsGetSenderAddress = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const writeEntryPointSimulationsHandleAggregatedOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const writeEntryPointSimulationsHandleOps = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const writeEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"innerHandleOp"`
 */
export const writeEntryPointSimulationsInnerHandleOp = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'innerHandleOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const writeEntryPointSimulationsSimulateHandleOp = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const writeEntryPointSimulationsSimulateValidation = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'simulateValidation',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const writeEntryPointSimulationsUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const writeEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const writeEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const prepareWriteEntryPointSimulations = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const prepareWriteEntryPointSimulationsAddStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const prepareWriteEntryPointSimulationsDelegateAndRevert =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'delegateAndRevert',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const prepareWriteEntryPointSimulationsDepositTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const prepareWriteEntryPointSimulationsGetSenderAddress =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'getSenderAddress',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const prepareWriteEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const prepareWriteEntryPointSimulationsHandleOps = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const prepareWriteEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createSimulateContract(
  { abi: entryPointSimulationsAbi, functionName: 'incrementNonce' }
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"innerHandleOp"`
 */
export const prepareWriteEntryPointSimulationsInnerHandleOp = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'innerHandleOp',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const prepareWriteEntryPointSimulationsSimulateHandleOp =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'simulateHandleOp',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const prepareWriteEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const prepareWriteEntryPointSimulationsUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const prepareWriteEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const prepareWriteEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const watchEntryPointSimulationsEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const watchEntryPointSimulationsAccountDeployedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'AccountDeployed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const watchEntryPointSimulationsBeforeExecutionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'BeforeExecution',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"Deposited"`
 */
export const watchEntryPointSimulationsDepositedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const watchEntryPointSimulationsPostOpRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'PostOpRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const watchEntryPointSimulationsSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const watchEntryPointSimulationsStakeLockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const watchEntryPointSimulationsStakeUnlockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const watchEntryPointSimulationsStakeWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent(
  { abi: entryPointSimulationsAbi, eventName: 'StakeWithdrawn' }
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const watchEntryPointSimulationsUserOperationEventEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationEvent',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const watchEntryPointSimulationsUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const watchEntryPointSimulationsUserOperationRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const watchEntryPointSimulationsWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: entryPointSimulationsAbi,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const readIEntryPoint = /*#__PURE__*/ createReadContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"balanceOf"`
 */
export const readIEntryPointBalanceOf = /*#__PURE__*/ createReadContract({
  abi: iEntryPointAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const readIEntryPointGetDepositInfo = /*#__PURE__*/ createReadContract({
  abi: iEntryPointAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getNonce"`
 */
export const readIEntryPointGetNonce = /*#__PURE__*/ createReadContract({
  abi: iEntryPointAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const readIEntryPointGetUserOpHash = /*#__PURE__*/ createReadContract({
  abi: iEntryPointAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const writeIEntryPoint = /*#__PURE__*/ createWriteContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"addStake"`
 */
export const writeIEntryPointAddStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const writeIEntryPointDelegateAndRevert = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"depositTo"`
 */
export const writeIEntryPointDepositTo = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const writeIEntryPointGetSenderAddress = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const writeIEntryPointHandleAggregatedOps = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleOps"`
 */
export const writeIEntryPointHandleOps = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const writeIEntryPointIncrementNonce = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"unlockStake"`
 */
export const writeIEntryPointUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const writeIEntryPointWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const writeIEntryPointWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const prepareWriteIEntryPoint = /*#__PURE__*/ createSimulateContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"addStake"`
 */
export const prepareWriteIEntryPointAddStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const prepareWriteIEntryPointDelegateAndRevert = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"depositTo"`
 */
export const prepareWriteIEntryPointDepositTo = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const prepareWriteIEntryPointGetSenderAddress = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const prepareWriteIEntryPointHandleAggregatedOps = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleOps"`
 */
export const prepareWriteIEntryPointHandleOps = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const prepareWriteIEntryPointIncrementNonce = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"unlockStake"`
 */
export const prepareWriteIEntryPointUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const prepareWriteIEntryPointWithdrawStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const prepareWriteIEntryPointWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const watchIEntryPointEvent = /*#__PURE__*/ createWatchContractEvent({ abi: iEntryPointAbi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const watchIEntryPointAccountDeployedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const watchIEntryPointBeforeExecutionEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"Deposited"`
 */
export const watchIEntryPointDepositedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const watchIEntryPointPostOpRevertReasonEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'PostOpRevertReason',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const watchIEntryPointSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const watchIEntryPointStakeLockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const watchIEntryPointStakeUnlockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const watchIEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const watchIEntryPointUserOperationEventEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'UserOperationEvent',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const watchIEntryPointUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const watchIEntryPointUserOperationRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const watchIEntryPointWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const readIEntryPointSimulations = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"balanceOf"`
 */
export const readIEntryPointSimulationsBalanceOf = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const readIEntryPointSimulationsGetDepositInfo = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getNonce"`
 */
export const readIEntryPointSimulationsGetNonce = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const readIEntryPointSimulationsGetUserOpHash = /*#__PURE__*/ createReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const writeIEntryPointSimulations = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const writeIEntryPointSimulationsAddStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const writeIEntryPointSimulationsDelegateAndRevert = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const writeIEntryPointSimulationsDepositTo = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const writeIEntryPointSimulationsGetSenderAddress = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const writeIEntryPointSimulationsHandleAggregatedOps = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const writeIEntryPointSimulationsHandleOps = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const writeIEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const writeIEntryPointSimulationsSimulateHandleOp = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const writeIEntryPointSimulationsSimulateValidation = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'simulateValidation',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const writeIEntryPointSimulationsUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const writeIEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const writeIEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const prepareWriteIEntryPointSimulations = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const prepareWriteIEntryPointSimulationsAddStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const prepareWriteIEntryPointSimulationsDelegateAndRevert =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'delegateAndRevert',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const prepareWriteIEntryPointSimulationsDepositTo = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const prepareWriteIEntryPointSimulationsGetSenderAddress =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'getSenderAddress',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const prepareWriteIEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const prepareWriteIEntryPointSimulationsHandleOps = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const prepareWriteIEntryPointSimulationsIncrementNonce =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'incrementNonce',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const prepareWriteIEntryPointSimulationsSimulateHandleOp =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateHandleOp',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const prepareWriteIEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const prepareWriteIEntryPointSimulationsUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const prepareWriteIEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createSimulateContract(
  { abi: iEntryPointSimulationsAbi, functionName: 'withdrawStake' }
)

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const prepareWriteIEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const watchIEntryPointSimulationsEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const watchIEntryPointSimulationsAccountDeployedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'AccountDeployed',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const watchIEntryPointSimulationsBeforeExecutionEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'BeforeExecution',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"Deposited"`
 */
export const watchIEntryPointSimulationsDepositedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const watchIEntryPointSimulationsPostOpRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'PostOpRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const watchIEntryPointSimulationsSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const watchIEntryPointSimulationsStakeLockedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const watchIEntryPointSimulationsStakeUnlockedEvent = /*#__PURE__*/ createWatchContractEvent(
  { abi: iEntryPointSimulationsAbi, eventName: 'StakeUnlocked' }
)

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const watchIEntryPointSimulationsStakeWithdrawnEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'StakeWithdrawn',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const watchIEntryPointSimulationsUserOperationEventEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationEvent',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const watchIEntryPointSimulationsUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const watchIEntryPointSimulationsUserOperationRevertReasonEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const watchIEntryPointSimulationsWithdrawnEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__
 */
export const readSendAccount = /*#__PURE__*/ createReadContract({ abi: sendAccountAbi })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 */
export const readSendAccountUpgradeInterfaceVersion = /*#__PURE__*/ createReadContract({
  abi: sendAccountAbi,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"entryPoint"`
 */
export const readSendAccountEntryPoint = /*#__PURE__*/ createReadContract({
  abi: sendAccountAbi,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"getActiveSigningKeys"`
 */
export const readSendAccountGetActiveSigningKeys = /*#__PURE__*/ createReadContract({
  abi: sendAccountAbi,
  functionName: 'getActiveSigningKeys',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"isValidSignature"`
 */
export const readSendAccountIsValidSignature = /*#__PURE__*/ createReadContract({
  abi: sendAccountAbi,
  functionName: 'isValidSignature',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"keys"`
 */
export const readSendAccountKeys = /*#__PURE__*/ createReadContract({
  abi: sendAccountAbi,
  functionName: 'keys',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"maxKeys"`
 */
export const readSendAccountMaxKeys = /*#__PURE__*/ createReadContract({
  abi: sendAccountAbi,
  functionName: 'maxKeys',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"numActiveKeys"`
 */
export const readSendAccountNumActiveKeys = /*#__PURE__*/ createReadContract({
  abi: sendAccountAbi,
  functionName: 'numActiveKeys',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const readSendAccountProxiableUuid = /*#__PURE__*/ createReadContract({
  abi: sendAccountAbi,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"verifier"`
 */
export const readSendAccountVerifier = /*#__PURE__*/ createReadContract({
  abi: sendAccountAbi,
  functionName: 'verifier',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountAbi}__
 */
export const writeSendAccount = /*#__PURE__*/ createWriteContract({ abi: sendAccountAbi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"addSigningKey"`
 */
export const writeSendAccountAddSigningKey = /*#__PURE__*/ createWriteContract({
  abi: sendAccountAbi,
  functionName: 'addSigningKey',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"executeBatch"`
 */
export const writeSendAccountExecuteBatch = /*#__PURE__*/ createWriteContract({
  abi: sendAccountAbi,
  functionName: 'executeBatch',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"initialize"`
 */
export const writeSendAccountInitialize = /*#__PURE__*/ createWriteContract({
  abi: sendAccountAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"removeSigningKey"`
 */
export const writeSendAccountRemoveSigningKey = /*#__PURE__*/ createWriteContract({
  abi: sendAccountAbi,
  functionName: 'removeSigningKey',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"signatureStruct"`
 */
export const writeSendAccountSignatureStruct = /*#__PURE__*/ createWriteContract({
  abi: sendAccountAbi,
  functionName: 'signatureStruct',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const writeSendAccountUpgradeToAndCall = /*#__PURE__*/ createWriteContract({
  abi: sendAccountAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"validateUserOp"`
 */
export const writeSendAccountValidateUserOp = /*#__PURE__*/ createWriteContract({
  abi: sendAccountAbi,
  functionName: 'validateUserOp',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountAbi}__
 */
export const prepareWriteSendAccount = /*#__PURE__*/ createSimulateContract({ abi: sendAccountAbi })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"addSigningKey"`
 */
export const prepareWriteSendAccountAddSigningKey = /*#__PURE__*/ createSimulateContract({
  abi: sendAccountAbi,
  functionName: 'addSigningKey',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"executeBatch"`
 */
export const prepareWriteSendAccountExecuteBatch = /*#__PURE__*/ createSimulateContract({
  abi: sendAccountAbi,
  functionName: 'executeBatch',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"initialize"`
 */
export const prepareWriteSendAccountInitialize = /*#__PURE__*/ createSimulateContract({
  abi: sendAccountAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"removeSigningKey"`
 */
export const prepareWriteSendAccountRemoveSigningKey = /*#__PURE__*/ createSimulateContract({
  abi: sendAccountAbi,
  functionName: 'removeSigningKey',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"signatureStruct"`
 */
export const prepareWriteSendAccountSignatureStruct = /*#__PURE__*/ createSimulateContract({
  abi: sendAccountAbi,
  functionName: 'signatureStruct',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const prepareWriteSendAccountUpgradeToAndCall = /*#__PURE__*/ createSimulateContract({
  abi: sendAccountAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"validateUserOp"`
 */
export const prepareWriteSendAccountValidateUserOp = /*#__PURE__*/ createSimulateContract({
  abi: sendAccountAbi,
  functionName: 'validateUserOp',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__
 */
export const watchSendAccountEvent = /*#__PURE__*/ createWatchContractEvent({ abi: sendAccountAbi })

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"AccountInitialized"`
 */
export const watchSendAccountAccountInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'AccountInitialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"Initialized"`
 */
export const watchSendAccountInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"Received"`
 */
export const watchSendAccountReceivedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'Received',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"SigningKeyAdded"`
 */
export const watchSendAccountSigningKeyAddedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'SigningKeyAdded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"SigningKeyRemoved"`
 */
export const watchSendAccountSigningKeyRemovedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'SigningKeyRemoved',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"Upgraded"`
 */
export const watchSendAccountUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const readSendAccountFactory = /*#__PURE__*/ createReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"accountImplementation"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const readSendAccountFactoryAccountImplementation = /*#__PURE__*/ createReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'accountImplementation',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"entryPoint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const readSendAccountFactoryEntryPoint = /*#__PURE__*/ createReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"getAddress"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const readSendAccountFactoryGetAddress = /*#__PURE__*/ createReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'getAddress',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"verifier"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const readSendAccountFactoryVerifier = /*#__PURE__*/ createReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'verifier',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const writeSendAccountFactory = /*#__PURE__*/ createWriteContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"createAccount"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const writeSendAccountFactoryCreateAccount = /*#__PURE__*/ createWriteContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'createAccount',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const prepareWriteSendAccountFactory = /*#__PURE__*/ createSimulateContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"createAccount"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const prepareWriteSendAccountFactoryCreateAccount = /*#__PURE__*/ createSimulateContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'createAccount',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDrop = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"isClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropIsClaimed = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'isClaimed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"merkleRoots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropMerkleRoots = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'merkleRoots',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropOwner = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"token"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropToken = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'token',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheActive"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropTrancheActive = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheActive',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropTrancheAmount = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmount',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmountClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropTrancheAmountClaimed = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmountClaimed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmounts"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropTrancheAmounts = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmounts',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmountsClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropTrancheAmountsClaimed = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmountsClaimed',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheCursor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropTrancheCursor = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheCursor',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"verifyClaim"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const readSendMerkleDropVerifyClaim = /*#__PURE__*/ createReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'verifyClaim',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const writeSendMerkleDrop = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"addTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const writeSendMerkleDropAddTranche = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'addTranche',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const writeSendMerkleDropClaimTranche = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranche',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const writeSendMerkleDropClaimTranches = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranches',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"expireTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const writeSendMerkleDropExpireTranche = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'expireTranche',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const writeSendMerkleDropRenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const writeSendMerkleDropTransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const writeSendMerkleDropTransferToken = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const writeSendMerkleDropWithdraw = /*#__PURE__*/ createWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const prepareWriteSendMerkleDrop = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"addTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const prepareWriteSendMerkleDropAddTranche = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'addTranche',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const prepareWriteSendMerkleDropClaimTranche = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranche',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const prepareWriteSendMerkleDropClaimTranches = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranches',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"expireTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const prepareWriteSendMerkleDropExpireTranche = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'expireTranche',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const prepareWriteSendMerkleDropRenounceOwnership = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const prepareWriteSendMerkleDropTransferOwnership = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const prepareWriteSendMerkleDropTransferToken = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const prepareWriteSendMerkleDropWithdraw = /*#__PURE__*/ createSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const watchSendMerkleDropEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"Claimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const watchSendMerkleDropClaimedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'Claimed',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const watchSendMerkleDropOwnershipTransferredEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'OwnershipTransferred',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"TrancheAdded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const watchSendMerkleDropTrancheAddedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'TrancheAdded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"TrancheExpired"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const watchSendMerkleDropTrancheExpiredEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'TrancheExpired',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendToken = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenAllowance = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenBalanceOf = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenDecimals = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenName = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenSymbol = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const readSendTokenTotalSupply = /*#__PURE__*/ createReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendToken = /*#__PURE__*/ createWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTokenApprove = /*#__PURE__*/ createWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTokenTransfer = /*#__PURE__*/ createWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const writeSendTokenTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendToken = /*#__PURE__*/ createSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTokenApprove = /*#__PURE__*/ createSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTokenTransfer = /*#__PURE__*/ createSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const prepareWriteSendTokenTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendTokenEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendTokenApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const watchSendTokenTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendVerifierAbi}__
 *
 *
 */
export const readSendVerifier = /*#__PURE__*/ createReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 *
 */
export const readSendVerifierUpgradeInterfaceVersion = /*#__PURE__*/ createReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"implementation"`
 *
 *
 */
export const readSendVerifierImplementation = /*#__PURE__*/ createReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'implementation',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"owner"`
 *
 *
 */
export const readSendVerifierOwner = /*#__PURE__*/ createReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 *
 */
export const readSendVerifierProxiableUuid = /*#__PURE__*/ createReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"verifySignature"`
 *
 *
 */
export const readSendVerifierVerifySignature = /*#__PURE__*/ createReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'verifySignature',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendVerifierAbi}__
 *
 *
 */
export const writeSendVerifier = /*#__PURE__*/ createWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"init"`
 *
 *
 */
export const writeSendVerifierInit = /*#__PURE__*/ createWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'init',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const writeSendVerifierRenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const writeSendVerifierTransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"upgradeTo"`
 *
 *
 */
export const writeSendVerifierUpgradeTo = /*#__PURE__*/ createWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const writeSendVerifierUpgradeToAndCall = /*#__PURE__*/ createWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendVerifierAbi}__
 *
 *
 */
export const prepareWriteSendVerifier = /*#__PURE__*/ createSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"init"`
 *
 *
 */
export const prepareWriteSendVerifierInit = /*#__PURE__*/ createSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'init',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const prepareWriteSendVerifierRenounceOwnership = /*#__PURE__*/ createSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const prepareWriteSendVerifierTransferOwnership = /*#__PURE__*/ createSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"upgradeTo"`
 *
 *
 */
export const prepareWriteSendVerifierUpgradeTo = /*#__PURE__*/ createSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const prepareWriteSendVerifierUpgradeToAndCall = /*#__PURE__*/ createSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendVerifierAbi}__
 *
 *
 */
export const watchSendVerifierEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendVerifierAbi}__ and `eventName` set to `"Initialized"`
 *
 *
 */
export const watchSendVerifierInitializedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendVerifierAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 *
 */
export const watchSendVerifierOwnershipTransferredEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  eventName: 'OwnershipTransferred',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendVerifierAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const watchSendVerifierUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendVerifierProxyAbi}__
 *
 *
 */
export const watchSendVerifierProxyEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendVerifierProxyAbi,
  address: sendVerifierProxyAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link sendVerifierProxyAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const watchSendVerifierProxyUpgradedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: sendVerifierProxyAbi,
  address: sendVerifierProxyAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link senderCreatorAbi}__
 */
export const writeSenderCreator = /*#__PURE__*/ createWriteContract({ abi: senderCreatorAbi })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link senderCreatorAbi}__ and `functionName` set to `"createSender"`
 */
export const writeSenderCreatorCreateSender = /*#__PURE__*/ createWriteContract({
  abi: senderCreatorAbi,
  functionName: 'createSender',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link senderCreatorAbi}__
 */
export const prepareWriteSenderCreator = /*#__PURE__*/ createSimulateContract({
  abi: senderCreatorAbi,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link senderCreatorAbi}__ and `functionName` set to `"createSender"`
 */
export const prepareWriteSenderCreatorCreateSender = /*#__PURE__*/ createSimulateContract({
  abi: senderCreatorAbi,
  functionName: 'createSender',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__
 *
 *
 */
export const readTokenPaymaster = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"cachedPrice"`
 *
 *
 */
export const readTokenPaymasterCachedPrice = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'cachedPrice',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"cachedPriceTimestamp"`
 *
 *
 */
export const readTokenPaymasterCachedPriceTimestamp = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'cachedPriceTimestamp',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"calculatePrice"`
 *
 *
 */
export const readTokenPaymasterCalculatePrice = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'calculatePrice',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"entryPoint"`
 *
 *
 */
export const readTokenPaymasterEntryPoint = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"getDeposit"`
 *
 *
 */
export const readTokenPaymasterGetDeposit = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'getDeposit',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"oracleHelperConfig"`
 *
 *
 */
export const readTokenPaymasterOracleHelperConfig = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'oracleHelperConfig',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"owner"`
 *
 *
 */
export const readTokenPaymasterOwner = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"rewardsConfig"`
 *
 *
 */
export const readTokenPaymasterRewardsConfig = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'rewardsConfig',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"token"`
 *
 *
 */
export const readTokenPaymasterToken = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'token',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"tokenPaymasterConfig"`
 *
 *
 */
export const readTokenPaymasterTokenPaymasterConfig = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'tokenPaymasterConfig',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"tokenToWei"`
 *
 *
 */
export const readTokenPaymasterTokenToWei = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'tokenToWei',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"uniswap"`
 *
 *
 */
export const readTokenPaymasterUniswap = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'uniswap',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"uniswapHelperConfig"`
 *
 *
 */
export const readTokenPaymasterUniswapHelperConfig = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'uniswapHelperConfig',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"weiToToken"`
 *
 *
 */
export const readTokenPaymasterWeiToToken = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'weiToToken',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"wrappedNative"`
 *
 *
 */
export const readTokenPaymasterWrappedNative = /*#__PURE__*/ createReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'wrappedNative',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__
 *
 *
 */
export const writeTokenPaymaster = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"addStake"`
 *
 *
 */
export const writeTokenPaymasterAddStake = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"deposit"`
 *
 *
 */
export const writeTokenPaymasterDeposit = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'deposit',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"postOp"`
 *
 *
 */
export const writeTokenPaymasterPostOp = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'postOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const writeTokenPaymasterRenounceOwnership = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setOracleConfiguration"`
 *
 *
 */
export const writeTokenPaymasterSetOracleConfiguration = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setOracleConfiguration',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setRewardsConfig"`
 *
 *
 */
export const writeTokenPaymasterSetRewardsConfig = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setRewardsConfig',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setTokenPaymasterConfig"`
 *
 *
 */
export const writeTokenPaymasterSetTokenPaymasterConfig = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setTokenPaymasterConfig',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setUniswapConfiguration"`
 *
 *
 */
export const writeTokenPaymasterSetUniswapConfiguration = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setUniswapConfiguration',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const writeTokenPaymasterTransferOwnership = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"unlockStake"`
 *
 *
 */
export const writeTokenPaymasterUnlockStake = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"updateCachedPrice"`
 *
 *
 */
export const writeTokenPaymasterUpdateCachedPrice = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'updateCachedPrice',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"validatePaymasterUserOp"`
 *
 *
 */
export const writeTokenPaymasterValidatePaymasterUserOp = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'validatePaymasterUserOp',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawEth"`
 *
 *
 */
export const writeTokenPaymasterWithdrawEth = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawEth',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawStake"`
 *
 *
 */
export const writeTokenPaymasterWithdrawStake = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawTo"`
 *
 *
 */
export const writeTokenPaymasterWithdrawTo = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawToken"`
 *
 *
 */
export const writeTokenPaymasterWithdrawToken = /*#__PURE__*/ createWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawToken',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__
 *
 *
 */
export const prepareWriteTokenPaymaster = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"addStake"`
 *
 *
 */
export const prepareWriteTokenPaymasterAddStake = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"deposit"`
 *
 *
 */
export const prepareWriteTokenPaymasterDeposit = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'deposit',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"postOp"`
 *
 *
 */
export const prepareWriteTokenPaymasterPostOp = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'postOp',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const prepareWriteTokenPaymasterRenounceOwnership = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setOracleConfiguration"`
 *
 *
 */
export const prepareWriteTokenPaymasterSetOracleConfiguration =
  /*#__PURE__*/ createSimulateContract({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    functionName: 'setOracleConfiguration',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setRewardsConfig"`
 *
 *
 */
export const prepareWriteTokenPaymasterSetRewardsConfig = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setRewardsConfig',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setTokenPaymasterConfig"`
 *
 *
 */
export const prepareWriteTokenPaymasterSetTokenPaymasterConfig =
  /*#__PURE__*/ createSimulateContract({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    functionName: 'setTokenPaymasterConfig',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setUniswapConfiguration"`
 *
 *
 */
export const prepareWriteTokenPaymasterSetUniswapConfiguration =
  /*#__PURE__*/ createSimulateContract({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    functionName: 'setUniswapConfiguration',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const prepareWriteTokenPaymasterTransferOwnership = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"unlockStake"`
 *
 *
 */
export const prepareWriteTokenPaymasterUnlockStake = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"updateCachedPrice"`
 *
 *
 */
export const prepareWriteTokenPaymasterUpdateCachedPrice = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'updateCachedPrice',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"validatePaymasterUserOp"`
 *
 *
 */
export const prepareWriteTokenPaymasterValidatePaymasterUserOp =
  /*#__PURE__*/ createSimulateContract({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    functionName: 'validatePaymasterUserOp',
  })

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawEth"`
 *
 *
 */
export const prepareWriteTokenPaymasterWithdrawEth = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawEth',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawStake"`
 *
 *
 */
export const prepareWriteTokenPaymasterWithdrawStake = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawTo"`
 *
 *
 */
export const prepareWriteTokenPaymasterWithdrawTo = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawToken"`
 *
 *
 */
export const prepareWriteTokenPaymasterWithdrawToken = /*#__PURE__*/ createSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawToken',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__
 *
 *
 */
export const watchTokenPaymasterEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"ConfigUpdated"`
 *
 *
 */
export const watchTokenPaymasterConfigUpdatedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'ConfigUpdated',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"OracleConfigUpdated"`
 *
 *
 */
export const watchTokenPaymasterOracleConfigUpdatedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'OracleConfigUpdated',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 *
 */
export const watchTokenPaymasterOwnershipTransferredEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'OwnershipTransferred',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"Received"`
 *
 *
 */
export const watchTokenPaymasterReceivedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'Received',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"RewardsConfigUpdated"`
 *
 *
 */
export const watchTokenPaymasterRewardsConfigUpdatedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'RewardsConfigUpdated',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"TokenPriceUpdated"`
 *
 *
 */
export const watchTokenPaymasterTokenPriceUpdatedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'TokenPriceUpdated',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"UniswapConfigUpdated"`
 *
 *
 */
export const watchTokenPaymasterUniswapConfigUpdatedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'UniswapConfigUpdated',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"UniswapReverted"`
 *
 *
 */
export const watchTokenPaymasterUniswapRevertedEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'UniswapReverted',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"UserOperationSponsored"`
 *
 *
 */
export const watchTokenPaymasterUserOperationSponsoredEvent =
  /*#__PURE__*/ createWatchContractEvent({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    eventName: 'UserOperationSponsored',
  })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const readUsdc = /*#__PURE__*/ createReadContract({ abi: usdcAbi, address: usdcAddress })

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const readUsdcAllowance = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const readUsdcBalanceOf = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const readUsdcDecimals = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const readUsdcName = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const readUsdcSymbol = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const readUsdcTotalSupply = /*#__PURE__*/ createReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const writeUsdc = /*#__PURE__*/ createWriteContract({ abi: usdcAbi, address: usdcAddress })

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const writeUsdcApprove = /*#__PURE__*/ createWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const writeUsdcTransfer = /*#__PURE__*/ createWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const writeUsdcTransferFrom = /*#__PURE__*/ createWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const prepareWriteUsdc = /*#__PURE__*/ createSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const prepareWriteUsdcApprove = /*#__PURE__*/ createSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const prepareWriteUsdcTransfer = /*#__PURE__*/ createSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link simulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const prepareWriteUsdcTransferFrom = /*#__PURE__*/ createSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const watchUsdcEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const watchUsdcApprovalEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link watchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const watchUsdcTransferEvent = /*#__PURE__*/ createWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
  eventName: 'Transfer',
})

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc165Abi}__
 */
export const useReadErc165 = /*#__PURE__*/ createUseReadContract({ abi: erc165Abi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc165Abi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadErc165SupportsInterface = /*#__PURE__*/ createUseReadContract({
  abi: erc165Abi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__
 */
export const useWatchErc1967ProxyEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967ProxyAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967ProxyAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchErc1967ProxyUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967ProxyAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__
 */
export const useWatchErc1967UtilsEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UtilsAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"AdminChanged"`
 */
export const useWatchErc1967UtilsAdminChangedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'AdminChanged',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"BeaconUpgraded"`
 */
export const useWatchErc1967UtilsBeaconUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'BeaconUpgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc1967UtilsAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchErc1967UtilsUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc1967UtilsAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useReadErc20 = /*#__PURE__*/ createUseReadContract({ abi: erc20Abi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"allowance"`
 */
export const useReadErc20Allowance = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadErc20BalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decimals"`
 */
export const useReadErc20Decimals = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"name"`
 */
export const useReadErc20Name = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"symbol"`
 */
export const useReadErc20Symbol = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadErc20TotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useWriteErc20 = /*#__PURE__*/ createUseWriteContract({ abi: erc20Abi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useWriteErc20Approve = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const useWriteErc20Transfer = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteErc20TransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useSimulateErc20 = /*#__PURE__*/ createUseSimulateContract({ abi: erc20Abi })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useSimulateErc20Approve = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateErc20Transfer = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateErc20TransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20Abi}__
 */
export const useWatchErc20Event = /*#__PURE__*/ createUseWatchContractEvent({ abi: erc20Abi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Approval"`
 */
export const useWatchErc20ApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc20Abi,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link erc20Abi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchErc20TransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: erc20Abi,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPoint = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPointBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPointGetDepositInfo = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPointGetNonce = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useReadEntryPointGetUserOpHash = /*#__PURE__*/ createUseReadContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPoint = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointDelegateAndRevert = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointDepositTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointGetSenderAddress = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointHandleOps = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointIncrementNonce = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWriteEntryPointWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPoint = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"addStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointDelegateAndRevert = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"depositTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointDepositTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointGetSenderAddress = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"handleOps"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointHandleOps = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"incrementNonce"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointIncrementNonce = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"unlockStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointUnlockStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawStake"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointWithdrawStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointAbi}__ and `functionName` set to `"withdrawTo"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useSimulateEntryPointWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointAbi,
  address: entryPointAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointAccountDeployedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointBeforeExecutionEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Deposited"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointDepositedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"PostOpRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointPostOpRevertReasonEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'PostOpRevertReason',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeLocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointStakeLockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointStakeUnlockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointUserOperationEventEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'UserOperationEvent',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointUserOperationRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointAbi,
    address: entryPointAddress,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointAbi}__ and `eventName` set to `"Withdrawn"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x0000000071727De22E5E9d8BAf0edAc6f37da032)
 */
export const useWatchEntryPointWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointAbi,
  address: entryPointAddress,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const useReadEntryPointSimulations = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"_validateSenderAndPaymaster"`
 */
export const useReadEntryPointSimulationsValidateSenderAndPaymaster =
  /*#__PURE__*/ createUseReadContract({
    abi: entryPointSimulationsAbi,
    functionName: '_validateSenderAndPaymaster',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadEntryPointSimulationsBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"deposits"`
 */
export const useReadEntryPointSimulationsDeposits = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'deposits',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const useReadEntryPointSimulationsGetDepositInfo = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getNonce"`
 */
export const useReadEntryPointSimulationsGetNonce = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const useReadEntryPointSimulationsGetUserOpHash = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"nonceSequenceNumber"`
 */
export const useReadEntryPointSimulationsNonceSequenceNumber = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'nonceSequenceNumber',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"supportsInterface"`
 */
export const useReadEntryPointSimulationsSupportsInterface = /*#__PURE__*/ createUseReadContract({
  abi: entryPointSimulationsAbi,
  functionName: 'supportsInterface',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const useWriteEntryPointSimulations = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const useWriteEntryPointSimulationsAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useWriteEntryPointSimulationsDelegateAndRevert = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const useWriteEntryPointSimulationsDepositTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useWriteEntryPointSimulationsGetSenderAddress = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useWriteEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createUseWriteContract({
    abi: entryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const useWriteEntryPointSimulationsHandleOps = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useWriteEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"innerHandleOp"`
 */
export const useWriteEntryPointSimulationsInnerHandleOp = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'innerHandleOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useWriteEntryPointSimulationsSimulateHandleOp = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useWriteEntryPointSimulationsSimulateValidation = /*#__PURE__*/ createUseWriteContract(
  { abi: entryPointSimulationsAbi, functionName: 'simulateValidation' }
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useWriteEntryPointSimulationsUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useWriteEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useWriteEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const useSimulateEntryPointSimulations = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const useSimulateEntryPointSimulationsAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useSimulateEntryPointSimulationsDelegateAndRevert =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'delegateAndRevert',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const useSimulateEntryPointSimulationsDepositTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useSimulateEntryPointSimulationsGetSenderAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'getSenderAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useSimulateEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const useSimulateEntryPointSimulationsHandleOps = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useSimulateEntryPointSimulationsIncrementNonce =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'incrementNonce',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"innerHandleOp"`
 */
export const useSimulateEntryPointSimulationsInnerHandleOp =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'innerHandleOp',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useSimulateEntryPointSimulationsSimulateHandleOp =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'simulateHandleOp',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useSimulateEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useSimulateEntryPointSimulationsUnlockStake = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useSimulateEntryPointSimulationsWithdrawStake =
  /*#__PURE__*/ createUseSimulateContract({
    abi: entryPointSimulationsAbi,
    functionName: 'withdrawStake',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useSimulateEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: entryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__
 */
export const useWatchEntryPointSimulationsEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: entryPointSimulationsAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const useWatchEntryPointSimulationsAccountDeployedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'AccountDeployed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const useWatchEntryPointSimulationsBeforeExecutionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'BeforeExecution',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"Deposited"`
 */
export const useWatchEntryPointSimulationsDepositedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'Deposited',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const useWatchEntryPointSimulationsPostOpRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'PostOpRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const useWatchEntryPointSimulationsSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const useWatchEntryPointSimulationsStakeLockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'StakeLocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const useWatchEntryPointSimulationsStakeUnlockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'StakeUnlocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const useWatchEntryPointSimulationsStakeWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'StakeWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const useWatchEntryPointSimulationsUserOperationEventEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationEvent',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const useWatchEntryPointSimulationsUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const useWatchEntryPointSimulationsUserOperationRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link entryPointSimulationsAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const useWatchEntryPointSimulationsWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: entryPointSimulationsAbi,
    eventName: 'Withdrawn',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const useReadIEntryPoint = /*#__PURE__*/ createUseReadContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadIEntryPointBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const useReadIEntryPointGetDepositInfo = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getNonce"`
 */
export const useReadIEntryPointGetNonce = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const useReadIEntryPointGetUserOpHash = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const useWriteIEntryPoint = /*#__PURE__*/ createUseWriteContract({ abi: iEntryPointAbi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"addStake"`
 */
export const useWriteIEntryPointAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useWriteIEntryPointDelegateAndRevert = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"depositTo"`
 */
export const useWriteIEntryPointDepositTo = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useWriteIEntryPointGetSenderAddress = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useWriteIEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleOps"`
 */
export const useWriteIEntryPointHandleOps = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useWriteIEntryPointIncrementNonce = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useWriteIEntryPointUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useWriteIEntryPointWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useWriteIEntryPointWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const useSimulateIEntryPoint = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"addStake"`
 */
export const useSimulateIEntryPointAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useSimulateIEntryPointDelegateAndRevert = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'delegateAndRevert',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"depositTo"`
 */
export const useSimulateIEntryPointDepositTo = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useSimulateIEntryPointGetSenderAddress = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useSimulateIEntryPointHandleAggregatedOps = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'handleAggregatedOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"handleOps"`
 */
export const useSimulateIEntryPointHandleOps = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useSimulateIEntryPointIncrementNonce = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useSimulateIEntryPointUnlockStake = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useSimulateIEntryPointWithdrawStake = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useSimulateIEntryPointWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__
 */
export const useWatchIEntryPointEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const useWatchIEntryPointAccountDeployedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'AccountDeployed',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const useWatchIEntryPointBeforeExecutionEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'BeforeExecution',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"Deposited"`
 */
export const useWatchIEntryPointDepositedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'Deposited',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const useWatchIEntryPointPostOpRevertReasonEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: iEntryPointAbi, eventName: 'PostOpRevertReason' }
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const useWatchIEntryPointSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const useWatchIEntryPointStakeLockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeLocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const useWatchIEntryPointStakeUnlockedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeUnlocked',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const useWatchIEntryPointStakeWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'StakeWithdrawn',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const useWatchIEntryPointUserOperationEventEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: iEntryPointAbi, eventName: 'UserOperationEvent' }
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const useWatchIEntryPointUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const useWatchIEntryPointUserOperationRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const useWatchIEntryPointWithdrawnEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointAbi,
  eventName: 'Withdrawn',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const useReadIEntryPointSimulations = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadIEntryPointSimulationsBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getDepositInfo"`
 */
export const useReadIEntryPointSimulationsGetDepositInfo = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getDepositInfo',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getNonce"`
 */
export const useReadIEntryPointSimulationsGetNonce = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getNonce',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getUserOpHash"`
 */
export const useReadIEntryPointSimulationsGetUserOpHash = /*#__PURE__*/ createUseReadContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getUserOpHash',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const useWriteIEntryPointSimulations = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const useWriteIEntryPointSimulationsAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useWriteIEntryPointSimulationsDelegateAndRevert = /*#__PURE__*/ createUseWriteContract(
  { abi: iEntryPointSimulationsAbi, functionName: 'delegateAndRevert' }
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const useWriteIEntryPointSimulationsDepositTo = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useWriteIEntryPointSimulationsGetSenderAddress = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'getSenderAddress',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useWriteIEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createUseWriteContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const useWriteIEntryPointSimulationsHandleOps = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useWriteIEntryPointSimulationsIncrementNonce = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'incrementNonce',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useWriteIEntryPointSimulationsSimulateHandleOp = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'simulateHandleOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useWriteIEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createUseWriteContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useWriteIEntryPointSimulationsUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useWriteIEntryPointSimulationsWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useWriteIEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const useSimulateIEntryPointSimulations = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"addStake"`
 */
export const useSimulateIEntryPointSimulationsAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"delegateAndRevert"`
 */
export const useSimulateIEntryPointSimulationsDelegateAndRevert =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'delegateAndRevert',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"depositTo"`
 */
export const useSimulateIEntryPointSimulationsDepositTo = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'depositTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"getSenderAddress"`
 */
export const useSimulateIEntryPointSimulationsGetSenderAddress =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'getSenderAddress',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleAggregatedOps"`
 */
export const useSimulateIEntryPointSimulationsHandleAggregatedOps =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'handleAggregatedOps',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"handleOps"`
 */
export const useSimulateIEntryPointSimulationsHandleOps = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'handleOps',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"incrementNonce"`
 */
export const useSimulateIEntryPointSimulationsIncrementNonce =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'incrementNonce',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateHandleOp"`
 */
export const useSimulateIEntryPointSimulationsSimulateHandleOp =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateHandleOp',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"simulateValidation"`
 */
export const useSimulateIEntryPointSimulationsSimulateValidation =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'simulateValidation',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"unlockStake"`
 */
export const useSimulateIEntryPointSimulationsUnlockStake = /*#__PURE__*/ createUseSimulateContract(
  { abi: iEntryPointSimulationsAbi, functionName: 'unlockStake' }
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawStake"`
 */
export const useSimulateIEntryPointSimulationsWithdrawStake =
  /*#__PURE__*/ createUseSimulateContract({
    abi: iEntryPointSimulationsAbi,
    functionName: 'withdrawStake',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `functionName` set to `"withdrawTo"`
 */
export const useSimulateIEntryPointSimulationsWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: iEntryPointSimulationsAbi,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__
 */
export const useWatchIEntryPointSimulationsEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: iEntryPointSimulationsAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"AccountDeployed"`
 */
export const useWatchIEntryPointSimulationsAccountDeployedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'AccountDeployed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"BeforeExecution"`
 */
export const useWatchIEntryPointSimulationsBeforeExecutionEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'BeforeExecution',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"Deposited"`
 */
export const useWatchIEntryPointSimulationsDepositedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'Deposited',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"PostOpRevertReason"`
 */
export const useWatchIEntryPointSimulationsPostOpRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'PostOpRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"SignatureAggregatorChanged"`
 */
export const useWatchIEntryPointSimulationsSignatureAggregatorChangedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'SignatureAggregatorChanged',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeLocked"`
 */
export const useWatchIEntryPointSimulationsStakeLockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'StakeLocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeUnlocked"`
 */
export const useWatchIEntryPointSimulationsStakeUnlockedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'StakeUnlocked',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"StakeWithdrawn"`
 */
export const useWatchIEntryPointSimulationsStakeWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'StakeWithdrawn',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationEvent"`
 */
export const useWatchIEntryPointSimulationsUserOperationEventEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationEvent',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationPrefundTooLow"`
 */
export const useWatchIEntryPointSimulationsUserOperationPrefundTooLowEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationPrefundTooLow',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"UserOperationRevertReason"`
 */
export const useWatchIEntryPointSimulationsUserOperationRevertReasonEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'UserOperationRevertReason',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link iEntryPointSimulationsAbi}__ and `eventName` set to `"Withdrawn"`
 */
export const useWatchIEntryPointSimulationsWithdrawnEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: iEntryPointSimulationsAbi,
    eventName: 'Withdrawn',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__
 */
export const useReadSendAccount = /*#__PURE__*/ createUseReadContract({ abi: sendAccountAbi })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 */
export const useReadSendAccountUpgradeInterfaceVersion = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountAbi,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"entryPoint"`
 */
export const useReadSendAccountEntryPoint = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountAbi,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"getActiveSigningKeys"`
 */
export const useReadSendAccountGetActiveSigningKeys = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountAbi,
  functionName: 'getActiveSigningKeys',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"isValidSignature"`
 */
export const useReadSendAccountIsValidSignature = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountAbi,
  functionName: 'isValidSignature',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"keys"`
 */
export const useReadSendAccountKeys = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountAbi,
  functionName: 'keys',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"maxKeys"`
 */
export const useReadSendAccountMaxKeys = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountAbi,
  functionName: 'maxKeys',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"numActiveKeys"`
 */
export const useReadSendAccountNumActiveKeys = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountAbi,
  functionName: 'numActiveKeys',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"proxiableUUID"`
 */
export const useReadSendAccountProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountAbi,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"verifier"`
 */
export const useReadSendAccountVerifier = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountAbi,
  functionName: 'verifier',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountAbi}__
 */
export const useWriteSendAccount = /*#__PURE__*/ createUseWriteContract({ abi: sendAccountAbi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"addSigningKey"`
 */
export const useWriteSendAccountAddSigningKey = /*#__PURE__*/ createUseWriteContract({
  abi: sendAccountAbi,
  functionName: 'addSigningKey',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"executeBatch"`
 */
export const useWriteSendAccountExecuteBatch = /*#__PURE__*/ createUseWriteContract({
  abi: sendAccountAbi,
  functionName: 'executeBatch',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"initialize"`
 */
export const useWriteSendAccountInitialize = /*#__PURE__*/ createUseWriteContract({
  abi: sendAccountAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"removeSigningKey"`
 */
export const useWriteSendAccountRemoveSigningKey = /*#__PURE__*/ createUseWriteContract({
  abi: sendAccountAbi,
  functionName: 'removeSigningKey',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"signatureStruct"`
 */
export const useWriteSendAccountSignatureStruct = /*#__PURE__*/ createUseWriteContract({
  abi: sendAccountAbi,
  functionName: 'signatureStruct',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useWriteSendAccountUpgradeToAndCall = /*#__PURE__*/ createUseWriteContract({
  abi: sendAccountAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"validateUserOp"`
 */
export const useWriteSendAccountValidateUserOp = /*#__PURE__*/ createUseWriteContract({
  abi: sendAccountAbi,
  functionName: 'validateUserOp',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountAbi}__
 */
export const useSimulateSendAccount = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"addSigningKey"`
 */
export const useSimulateSendAccountAddSigningKey = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountAbi,
  functionName: 'addSigningKey',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"executeBatch"`
 */
export const useSimulateSendAccountExecuteBatch = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountAbi,
  functionName: 'executeBatch',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"initialize"`
 */
export const useSimulateSendAccountInitialize = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountAbi,
  functionName: 'initialize',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"removeSigningKey"`
 */
export const useSimulateSendAccountRemoveSigningKey = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountAbi,
  functionName: 'removeSigningKey',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"signatureStruct"`
 */
export const useSimulateSendAccountSignatureStruct = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountAbi,
  functionName: 'signatureStruct',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"upgradeToAndCall"`
 */
export const useSimulateSendAccountUpgradeToAndCall = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountAbi,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountAbi}__ and `functionName` set to `"validateUserOp"`
 */
export const useSimulateSendAccountValidateUserOp = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountAbi,
  functionName: 'validateUserOp',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__
 */
export const useWatchSendAccountEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAccountAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"AccountInitialized"`
 */
export const useWatchSendAccountAccountInitializedEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: sendAccountAbi, eventName: 'AccountInitialized' }
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"Initialized"`
 */
export const useWatchSendAccountInitializedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"Received"`
 */
export const useWatchSendAccountReceivedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'Received',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"SigningKeyAdded"`
 */
export const useWatchSendAccountSigningKeyAddedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'SigningKeyAdded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"SigningKeyRemoved"`
 */
export const useWatchSendAccountSigningKeyRemovedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'SigningKeyRemoved',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendAccountAbi}__ and `eventName` set to `"Upgraded"`
 */
export const useWatchSendAccountUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendAccountAbi,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const useReadSendAccountFactory = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"accountImplementation"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const useReadSendAccountFactoryAccountImplementation = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'accountImplementation',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"entryPoint"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const useReadSendAccountFactoryEntryPoint = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"getAddress"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const useReadSendAccountFactoryGetAddress = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'getAddress',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"verifier"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const useReadSendAccountFactoryVerifier = /*#__PURE__*/ createUseReadContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'verifier',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const useWriteSendAccountFactory = /*#__PURE__*/ createUseWriteContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"createAccount"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const useWriteSendAccountFactoryCreateAccount = /*#__PURE__*/ createUseWriteContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'createAccount',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const useSimulateSendAccountFactory = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendAccountFactoryAbi}__ and `functionName` set to `"createAccount"`
 *
 * [__View Contract on Base Basescan__](https://basescan.org/address/0x95DaEEEF8Ac6f28648559aDBEdbcAC00ef4d1745)
 */
export const useSimulateSendAccountFactoryCreateAccount = /*#__PURE__*/ createUseSimulateContract({
  abi: sendAccountFactoryAbi,
  address: sendAccountFactoryAddress,
  functionName: 'createAccount',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDrop = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"isClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropIsClaimed = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'isClaimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"merkleRoots"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropMerkleRoots = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'merkleRoots',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"owner"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropOwner = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"token"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropToken = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'token',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheActive"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropTrancheActive = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheActive',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmount"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropTrancheAmount = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmount',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmountClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropTrancheAmountClaimed = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmountClaimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmounts"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropTrancheAmounts = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmounts',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheAmountsClaimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropTrancheAmountsClaimed = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheAmountsClaimed',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"trancheCursor"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropTrancheCursor = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'trancheCursor',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"verifyClaim"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useReadSendMerkleDropVerifyClaim = /*#__PURE__*/ createUseReadContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'verifyClaim',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWriteSendMerkleDrop = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"addTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWriteSendMerkleDropAddTranche = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'addTranche',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWriteSendMerkleDropClaimTranche = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranche',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWriteSendMerkleDropClaimTranches = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranches',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"expireTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWriteSendMerkleDropExpireTranche = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'expireTranche',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWriteSendMerkleDropRenounceOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWriteSendMerkleDropTransferOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWriteSendMerkleDropTransferToken = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWriteSendMerkleDropWithdraw = /*#__PURE__*/ createUseWriteContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useSimulateSendMerkleDrop = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"addTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useSimulateSendMerkleDropAddTranche = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'addTranche',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useSimulateSendMerkleDropClaimTranche = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranche',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"claimTranches"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useSimulateSendMerkleDropClaimTranches = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'claimTranches',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"expireTranche"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useSimulateSendMerkleDropExpireTranche = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'expireTranche',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useSimulateSendMerkleDropRenounceOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferOwnership"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useSimulateSendMerkleDropTransferOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"transferToken"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useSimulateSendMerkleDropTransferToken = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'transferToken',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `functionName` set to `"withdraw"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useSimulateSendMerkleDropWithdraw = /*#__PURE__*/ createUseSimulateContract({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  functionName: 'withdraw',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWatchSendMerkleDropEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"Claimed"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWatchSendMerkleDropClaimedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'Claimed',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWatchSendMerkleDropOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: sendMerkleDropAbi,
    address: sendMerkleDropAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"TrancheAdded"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWatchSendMerkleDropTrancheAddedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'TrancheAdded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendMerkleDropAbi}__ and `eventName` set to `"TrancheExpired"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x240761104aF5DAeDFd9025810FfEB741fEB316B3)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x91dA349c74576Ab7ff05c16DaC4E4F92E9a798bE)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 */
export const useWatchSendMerkleDropTrancheExpiredEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendMerkleDropAbi,
  address: sendMerkleDropAddress,
  eventName: 'TrancheExpired',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendToken = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenAllowance = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenDecimals = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenName = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenSymbol = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useReadSendTokenTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendToken = /*#__PURE__*/ createUseWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTokenApprove = /*#__PURE__*/ createUseWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTokenTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWriteSendTokenTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendToken = /*#__PURE__*/ createUseSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTokenApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTokenTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendTokenAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useSimulateSendTokenTransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendTokenEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendTokenApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendTokenAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x7cEfbe54c37a35dCdaD29b86373ca8353a2F4680)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 */
export const useWatchSendTokenTransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendTokenAbi,
  address: sendTokenAddress,
  eventName: 'Transfer',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendVerifierAbi}__
 *
 *
 */
export const useReadSendVerifier = /*#__PURE__*/ createUseReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"UPGRADE_INTERFACE_VERSION"`
 *
 *
 */
export const useReadSendVerifierUpgradeInterfaceVersion = /*#__PURE__*/ createUseReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'UPGRADE_INTERFACE_VERSION',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"implementation"`
 *
 *
 */
export const useReadSendVerifierImplementation = /*#__PURE__*/ createUseReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'implementation',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"owner"`
 *
 *
 */
export const useReadSendVerifierOwner = /*#__PURE__*/ createUseReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"proxiableUUID"`
 *
 *
 */
export const useReadSendVerifierProxiableUuid = /*#__PURE__*/ createUseReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'proxiableUUID',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"verifySignature"`
 *
 *
 */
export const useReadSendVerifierVerifySignature = /*#__PURE__*/ createUseReadContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'verifySignature',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendVerifierAbi}__
 *
 *
 */
export const useWriteSendVerifier = /*#__PURE__*/ createUseWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"init"`
 *
 *
 */
export const useWriteSendVerifierInit = /*#__PURE__*/ createUseWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'init',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useWriteSendVerifierRenounceOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useWriteSendVerifierTransferOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"upgradeTo"`
 *
 *
 */
export const useWriteSendVerifierUpgradeTo = /*#__PURE__*/ createUseWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const useWriteSendVerifierUpgradeToAndCall = /*#__PURE__*/ createUseWriteContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendVerifierAbi}__
 *
 *
 */
export const useSimulateSendVerifier = /*#__PURE__*/ createUseSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"init"`
 *
 *
 */
export const useSimulateSendVerifierInit = /*#__PURE__*/ createUseSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'init',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useSimulateSendVerifierRenounceOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useSimulateSendVerifierTransferOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"upgradeTo"`
 *
 *
 */
export const useSimulateSendVerifierUpgradeTo = /*#__PURE__*/ createUseSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'upgradeTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link sendVerifierAbi}__ and `functionName` set to `"upgradeToAndCall"`
 *
 *
 */
export const useSimulateSendVerifierUpgradeToAndCall = /*#__PURE__*/ createUseSimulateContract({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  functionName: 'upgradeToAndCall',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendVerifierAbi}__
 *
 *
 */
export const useWatchSendVerifierEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendVerifierAbi}__ and `eventName` set to `"Initialized"`
 *
 *
 */
export const useWatchSendVerifierInitializedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  eventName: 'Initialized',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendVerifierAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 *
 */
export const useWatchSendVerifierOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: sendVerifierAbi,
    address: sendVerifierAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendVerifierAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const useWatchSendVerifierUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendVerifierAbi,
  address: sendVerifierAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendVerifierProxyAbi}__
 *
 *
 */
export const useWatchSendVerifierProxyEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendVerifierProxyAbi,
  address: sendVerifierProxyAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link sendVerifierProxyAbi}__ and `eventName` set to `"Upgraded"`
 *
 *
 */
export const useWatchSendVerifierProxyUpgradedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: sendVerifierProxyAbi,
  address: sendVerifierProxyAddress,
  eventName: 'Upgraded',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link senderCreatorAbi}__
 */
export const useWriteSenderCreator = /*#__PURE__*/ createUseWriteContract({ abi: senderCreatorAbi })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link senderCreatorAbi}__ and `functionName` set to `"createSender"`
 */
export const useWriteSenderCreatorCreateSender = /*#__PURE__*/ createUseWriteContract({
  abi: senderCreatorAbi,
  functionName: 'createSender',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link senderCreatorAbi}__
 */
export const useSimulateSenderCreator = /*#__PURE__*/ createUseSimulateContract({
  abi: senderCreatorAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link senderCreatorAbi}__ and `functionName` set to `"createSender"`
 */
export const useSimulateSenderCreatorCreateSender = /*#__PURE__*/ createUseSimulateContract({
  abi: senderCreatorAbi,
  functionName: 'createSender',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__
 *
 *
 */
export const useReadTokenPaymaster = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"cachedPrice"`
 *
 *
 */
export const useReadTokenPaymasterCachedPrice = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'cachedPrice',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"cachedPriceTimestamp"`
 *
 *
 */
export const useReadTokenPaymasterCachedPriceTimestamp = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'cachedPriceTimestamp',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"calculatePrice"`
 *
 *
 */
export const useReadTokenPaymasterCalculatePrice = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'calculatePrice',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"entryPoint"`
 *
 *
 */
export const useReadTokenPaymasterEntryPoint = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'entryPoint',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"getDeposit"`
 *
 *
 */
export const useReadTokenPaymasterGetDeposit = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'getDeposit',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"oracleHelperConfig"`
 *
 *
 */
export const useReadTokenPaymasterOracleHelperConfig = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'oracleHelperConfig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"owner"`
 *
 *
 */
export const useReadTokenPaymasterOwner = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"rewardsConfig"`
 *
 *
 */
export const useReadTokenPaymasterRewardsConfig = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'rewardsConfig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"token"`
 *
 *
 */
export const useReadTokenPaymasterToken = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'token',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"tokenPaymasterConfig"`
 *
 *
 */
export const useReadTokenPaymasterTokenPaymasterConfig = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'tokenPaymasterConfig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"tokenToWei"`
 *
 *
 */
export const useReadTokenPaymasterTokenToWei = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'tokenToWei',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"uniswap"`
 *
 *
 */
export const useReadTokenPaymasterUniswap = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'uniswap',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"uniswapHelperConfig"`
 *
 *
 */
export const useReadTokenPaymasterUniswapHelperConfig = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'uniswapHelperConfig',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"weiToToken"`
 *
 *
 */
export const useReadTokenPaymasterWeiToToken = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'weiToToken',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"wrappedNative"`
 *
 *
 */
export const useReadTokenPaymasterWrappedNative = /*#__PURE__*/ createUseReadContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'wrappedNative',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__
 *
 *
 */
export const useWriteTokenPaymaster = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"addStake"`
 *
 *
 */
export const useWriteTokenPaymasterAddStake = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"deposit"`
 *
 *
 */
export const useWriteTokenPaymasterDeposit = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"postOp"`
 *
 *
 */
export const useWriteTokenPaymasterPostOp = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'postOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useWriteTokenPaymasterRenounceOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setOracleConfiguration"`
 *
 *
 */
export const useWriteTokenPaymasterSetOracleConfiguration = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setOracleConfiguration',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setRewardsConfig"`
 *
 *
 */
export const useWriteTokenPaymasterSetRewardsConfig = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setRewardsConfig',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setTokenPaymasterConfig"`
 *
 *
 */
export const useWriteTokenPaymasterSetTokenPaymasterConfig = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setTokenPaymasterConfig',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setUniswapConfiguration"`
 *
 *
 */
export const useWriteTokenPaymasterSetUniswapConfiguration = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setUniswapConfiguration',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useWriteTokenPaymasterTransferOwnership = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"unlockStake"`
 *
 *
 */
export const useWriteTokenPaymasterUnlockStake = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"updateCachedPrice"`
 *
 *
 */
export const useWriteTokenPaymasterUpdateCachedPrice = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'updateCachedPrice',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"validatePaymasterUserOp"`
 *
 *
 */
export const useWriteTokenPaymasterValidatePaymasterUserOp = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'validatePaymasterUserOp',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawEth"`
 *
 *
 */
export const useWriteTokenPaymasterWithdrawEth = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawEth',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawStake"`
 *
 *
 */
export const useWriteTokenPaymasterWithdrawStake = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawTo"`
 *
 *
 */
export const useWriteTokenPaymasterWithdrawTo = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawToken"`
 *
 *
 */
export const useWriteTokenPaymasterWithdrawToken = /*#__PURE__*/ createUseWriteContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawToken',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__
 *
 *
 */
export const useSimulateTokenPaymaster = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"addStake"`
 *
 *
 */
export const useSimulateTokenPaymasterAddStake = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'addStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"deposit"`
 *
 *
 */
export const useSimulateTokenPaymasterDeposit = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'deposit',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"postOp"`
 *
 *
 */
export const useSimulateTokenPaymasterPostOp = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'postOp',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"renounceOwnership"`
 *
 *
 */
export const useSimulateTokenPaymasterRenounceOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'renounceOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setOracleConfiguration"`
 *
 *
 */
export const useSimulateTokenPaymasterSetOracleConfiguration =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    functionName: 'setOracleConfiguration',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setRewardsConfig"`
 *
 *
 */
export const useSimulateTokenPaymasterSetRewardsConfig = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'setRewardsConfig',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setTokenPaymasterConfig"`
 *
 *
 */
export const useSimulateTokenPaymasterSetTokenPaymasterConfig =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    functionName: 'setTokenPaymasterConfig',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"setUniswapConfiguration"`
 *
 *
 */
export const useSimulateTokenPaymasterSetUniswapConfiguration =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    functionName: 'setUniswapConfiguration',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"transferOwnership"`
 *
 *
 */
export const useSimulateTokenPaymasterTransferOwnership = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'transferOwnership',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"unlockStake"`
 *
 *
 */
export const useSimulateTokenPaymasterUnlockStake = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'unlockStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"updateCachedPrice"`
 *
 *
 */
export const useSimulateTokenPaymasterUpdateCachedPrice = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'updateCachedPrice',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"validatePaymasterUserOp"`
 *
 *
 */
export const useSimulateTokenPaymasterValidatePaymasterUserOp =
  /*#__PURE__*/ createUseSimulateContract({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    functionName: 'validatePaymasterUserOp',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawEth"`
 *
 *
 */
export const useSimulateTokenPaymasterWithdrawEth = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawEth',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawStake"`
 *
 *
 */
export const useSimulateTokenPaymasterWithdrawStake = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawStake',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawTo"`
 *
 *
 */
export const useSimulateTokenPaymasterWithdrawTo = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawTo',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `functionName` set to `"withdrawToken"`
 *
 *
 */
export const useSimulateTokenPaymasterWithdrawToken = /*#__PURE__*/ createUseSimulateContract({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  functionName: 'withdrawToken',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__
 *
 *
 */
export const useWatchTokenPaymasterEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"ConfigUpdated"`
 *
 *
 */
export const useWatchTokenPaymasterConfigUpdatedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'ConfigUpdated',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"OracleConfigUpdated"`
 *
 *
 */
export const useWatchTokenPaymasterOracleConfigUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    eventName: 'OracleConfigUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"OwnershipTransferred"`
 *
 *
 */
export const useWatchTokenPaymasterOwnershipTransferredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    eventName: 'OwnershipTransferred',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"Received"`
 *
 *
 */
export const useWatchTokenPaymasterReceivedEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: tokenPaymasterAbi,
  address: tokenPaymasterAddress,
  eventName: 'Received',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"RewardsConfigUpdated"`
 *
 *
 */
export const useWatchTokenPaymasterRewardsConfigUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    eventName: 'RewardsConfigUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"TokenPriceUpdated"`
 *
 *
 */
export const useWatchTokenPaymasterTokenPriceUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    eventName: 'TokenPriceUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"UniswapConfigUpdated"`
 *
 *
 */
export const useWatchTokenPaymasterUniswapConfigUpdatedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    eventName: 'UniswapConfigUpdated',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"UniswapReverted"`
 *
 *
 */
export const useWatchTokenPaymasterUniswapRevertedEvent = /*#__PURE__*/ createUseWatchContractEvent(
  { abi: tokenPaymasterAbi, address: tokenPaymasterAddress, eventName: 'UniswapReverted' }
)

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link tokenPaymasterAbi}__ and `eventName` set to `"UserOperationSponsored"`
 *
 *
 */
export const useWatchTokenPaymasterUserOperationSponsoredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: tokenPaymasterAbi,
    address: tokenPaymasterAddress,
    eventName: 'UserOperationSponsored',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useReadUsdc = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"allowance"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useReadUsdcAllowance = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"balanceOf"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useReadUsdcBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"decimals"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useReadUsdcDecimals = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"name"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useReadUsdcName = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"symbol"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useReadUsdcSymbol = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"totalSupply"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useReadUsdcTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useWriteUsdc = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useWriteUsdcApprove = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useWriteUsdcTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useWriteUsdcTransferFrom = /*#__PURE__*/ createUseWriteContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useSimulateUsdc = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"approve"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useSimulateUsdcApprove = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useSimulateUsdcTransfer = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link usdcAbi}__ and `functionName` set to `"transferFrom"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useSimulateUsdcTransferFrom = /*#__PURE__*/ createUseSimulateContract({
  abi: usdcAbi,
  address: usdcAddress,
  functionName: 'transferFrom',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdcAbi}__
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useWatchUsdcEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Approval"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useWatchUsdcApprovalEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
  eventName: 'Approval',
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link usdcAbi}__ and `eventName` set to `"Transfer"`
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48)
 * -
 * - [__View Contract on Base Basescan__](https://basescan.org/address/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
 * - [__View Contract on Base Sepolia Blockscout__](https://base-sepolia.blockscout.com/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e)
 * - [__View Contract on Sepolia Etherscan__](https://sepolia.etherscan.io/address/0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238)
 */
export const useWatchUsdcTransferEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: usdcAbi,
  address: usdcAddress,
  eventName: 'Transfer',
})
