import {
  getContract,
  GetContractArgs,
  readContract,
  ReadContractConfig,
  writeContract,
  WriteContractArgs,
  WriteContractPreparedArgs,
  WriteContractUnpreparedArgs,
  prepareWriteContract,
  PrepareWriteContractConfig,
  WriteContractMode,
} from 'wagmi/actions'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BaseGoerliForkTest
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const baseGoerliForkTestABI = [
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: '', internalType: 'string', type: 'string', indexed: false }],
    name: 'log',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: '', internalType: 'address', type: 'address', indexed: false }],
    name: 'log_address',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'val', internalType: 'uint256[]', type: 'uint256[]', indexed: false }],
    name: 'log_array',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'val', internalType: 'int256[]', type: 'int256[]', indexed: false }],
    name: 'log_array',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'val', internalType: 'address[]', type: 'address[]', indexed: false }],
    name: 'log_array',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: '', internalType: 'bytes', type: 'bytes', indexed: false }],
    name: 'log_bytes',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32', indexed: false }],
    name: 'log_bytes32',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: '', internalType: 'int256', type: 'int256', indexed: false }],
    name: 'log_int',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'log_named_address',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'uint256[]', type: 'uint256[]', indexed: false },
    ],
    name: 'log_named_array',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'int256[]', type: 'int256[]', indexed: false },
    ],
    name: 'log_named_array',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'address[]', type: 'address[]', indexed: false },
    ],
    name: 'log_named_array',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'bytes', type: 'bytes', indexed: false },
    ],
    name: 'log_named_bytes',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'bytes32', type: 'bytes32', indexed: false },
    ],
    name: 'log_named_bytes32',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'int256', type: 'int256', indexed: false },
      { name: 'decimals', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'log_named_decimal_int',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'decimals', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'log_named_decimal_uint',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'int256', type: 'int256', indexed: false },
    ],
    name: 'log_named_int',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'string', type: 'string', indexed: false },
    ],
    name: 'log_named_string',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'key', internalType: 'string', type: 'string', indexed: false },
      { name: 'val', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'log_named_uint',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: '', internalType: 'string', type: 'string', indexed: false }],
    name: 'log_string',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'log_uint',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: '', internalType: 'bytes', type: 'bytes', indexed: false }],
    name: 'logs',
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'IS_TEST',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'createAndSelectFork',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'excludeArtifacts',
    outputs: [{ name: 'excludedArtifacts_', internalType: 'string[]', type: 'string[]' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'excludeContracts',
    outputs: [{ name: 'excludedContracts_', internalType: 'address[]', type: 'address[]' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'excludeSenders',
    outputs: [{ name: 'excludedSenders_', internalType: 'address[]', type: 'address[]' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'failed',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'targetArtifactSelectors',
    outputs: [
      {
        name: 'targetedArtifactSelectors_',
        internalType: 'struct StdInvariant.FuzzSelector[]',
        type: 'tuple[]',
        components: [
          { name: 'addr', internalType: 'address', type: 'address' },
          { name: 'selectors', internalType: 'bytes4[]', type: 'bytes4[]' },
        ],
      },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'targetArtifacts',
    outputs: [{ name: 'targetedArtifacts_', internalType: 'string[]', type: 'string[]' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'targetContracts',
    outputs: [{ name: 'targetedContracts_', internalType: 'address[]', type: 'address[]' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'targetSelectors',
    outputs: [
      {
        name: 'targetedSelectors_',
        internalType: 'struct StdInvariant.FuzzSelector[]',
        type: 'tuple[]',
        components: [
          { name: 'addr', internalType: 'address', type: 'address' },
          { name: 'selectors', internalType: 'bytes4[]', type: 'bytes4[]' },
        ],
      },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'targetSenders',
    outputs: [{ name: 'targetedSenders_', internalType: 'address[]', type: 'address[]' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BasePaymaster
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const basePaymasterABI = [
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
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
  },
  { stateMutability: 'payable', type: 'function', inputs: [], name: 'deposit', outputs: [] },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'mode', internalType: 'enum IPaymaster.PostOpMode', type: 'uint8' },
      { name: 'context', internalType: 'bytes', type: 'bytes' },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'postOp',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  { stateMutability: 'nonpayable', type: 'function', inputs: [], name: 'unlockStake', outputs: [] },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ContextUpgradeable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const contextUpgradeableABI = [
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
    name: 'Initialized',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoAccount
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoAccountABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_daimoVerifier', internalType: 'contract DaimoVerifier', type: 'address' },
    ],
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
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
    name: 'Initialized',
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
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'slot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
    ],
    name: 'addSigningKey',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct DaimoAccount.Call[]',
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getActiveSigningKeys',
    outputs: [
      { name: 'activeSigningKeys', internalType: 'bytes32[2][]', type: 'bytes32[2][]' },
      { name: 'activeSigningKeySlots', internalType: 'uint8[]', type: 'uint8[]' },
    ],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'slot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
      {
        name: 'initCalls',
        internalType: 'struct DaimoAccount.Call[]',
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'message', internalType: 'bytes32', type: 'bytes32' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ name: 'magicValue', internalType: 'bytes4', type: 'bytes4' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: '', internalType: 'uint8', type: 'uint8' },
      { name: '', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'keys',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'maxKeys',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'numActiveKeys',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'slot', internalType: 'uint8', type: 'uint8' }],
    name: 'removeSigningKey',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'missingAccountFunds', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'validateUserOp',
    outputs: [{ name: 'validationData', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'verifier',
    outputs: [{ name: '', internalType: 'contract DaimoVerifier', type: 'address' }],
  },
  { stateMutability: 'payable', type: 'receive' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoAccountFactory
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoAccountFactoryABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_verifier', internalType: 'contract DaimoVerifier', type: 'address' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'accountImplementation',
    outputs: [{ name: '', internalType: 'contract DaimoAccount', type: 'address' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'keySlot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
      {
        name: 'initCalls',
        internalType: 'struct DaimoAccount.Call[]',
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
    outputs: [{ name: 'ret', internalType: 'contract DaimoAccount', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'keySlot', internalType: 'uint8', type: 'uint8' },
      { name: 'key', internalType: 'bytes32[2]', type: 'bytes32[2]' },
      {
        name: 'initCalls',
        internalType: 'struct DaimoAccount.Call[]',
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'verifier',
    outputs: [{ name: '', internalType: 'contract DaimoVerifier', type: 'address' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoEphemeralNotes
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoEphemeralNotesABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [{ name: '_token', internalType: 'contract IERC20', type: 'address' }],
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'note',
        internalType: 'struct Note',
        type: 'tuple',
        components: [
          { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
          { name: 'from', internalType: 'address', type: 'address' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
    ],
    name: 'NoteCreated',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'note',
        internalType: 'struct Note',
        type: 'tuple',
        components: [
          { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
          { name: 'from', internalType: 'address', type: 'address' },
          { name: 'amount', internalType: 'uint256', type: 'uint256' },
        ],
        indexed: false,
      },
      { name: 'redeemer', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'NoteRedeemed',
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_ephemeralOwner', internalType: 'address', type: 'address' },
      { name: '_signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'claimNote',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_ephemeralOwner', internalType: 'address', type: 'address' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'createNote',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'notes',
    outputs: [
      { name: 'ephemeralOwner', internalType: 'address', type: 'address' },
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoNameRegistry
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoNameRegistryABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
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
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
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
    inputs: [
      { name: 'name', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'addr', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'Registered',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'implementation', internalType: 'address', type: 'address', indexed: true }],
    name: 'Upgraded',
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'name', internalType: 'bytes32', type: 'bytes32' },
      { name: 'addr', internalType: 'address', type: 'address' },
    ],
    name: 'forceRegister',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'initialOwner', internalType: 'address', type: 'address' }],
    name: 'init',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'name', internalType: 'bytes32', type: 'bytes32' },
      { name: 'addr', internalType: 'address', type: 'address' },
    ],
    name: 'register',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'name', internalType: 'bytes32', type: 'bytes32' }],
    name: 'registerSelf',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'name', internalType: 'bytes32', type: 'bytes32' }],
    name: 'resolveAddr',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'addr', internalType: 'address', type: 'address' }],
    name: 'resolveName',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoNameRegistryProxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoNameRegistryProxyABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
  },
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
  { stateMutability: 'payable', type: 'fallback' },
  { stateMutability: 'payable', type: 'receive' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoPaymaster
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoPaymasterABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_entryPoint', internalType: 'contract IEntryPoint', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
      { name: '_metaPaymaster', internalType: 'contract IMetaPaymaster', type: 'address' },
    ],
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
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'requiredPreFund', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationSponsored',
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
  },
  { stateMutability: 'payable', type: 'function', inputs: [], name: 'deposit', outputs: [] },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'destWhitelist',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'entryPoint',
    outputs: [{ name: '', internalType: 'contract IEntryPoint', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getDeposit',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'metaPaymaster',
    outputs: [{ name: '', internalType: 'contract IMetaPaymaster', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'mode', internalType: 'enum IPaymaster.PostOpMode', type: 'uint8' },
      { name: 'context', internalType: 'bytes', type: 'bytes' },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'postOp',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'addresses', internalType: 'address[]', type: 'address[]' },
      { name: 'isWhitelisted', internalType: 'bool', type: 'bool' },
    ],
    name: 'setDestAddressWhitelist',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_ticketSigner', internalType: 'address', type: 'address' }],
    name: 'setTicketSigner',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'ticketSigner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  { stateMutability: 'nonpayable', type: 'function', inputs: [], name: 'unlockStake', outputs: [] },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoVerifier
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoVerifierABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
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
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
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
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'initialOwner', internalType: 'address', type: 'address' }],
    name: 'init',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'message', internalType: 'bytes', type: 'bytes' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
      { name: 'x', internalType: 'uint256', type: 'uint256' },
      { name: 'y', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'verifySignature',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DaimoVerifierProxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const daimoVerifierProxyABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
  },
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
  { stateMutability: 'payable', type: 'fallback' },
  { stateMutability: 'payable', type: 'receive' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Proxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967ProxyABI = [
  {
    stateMutability: 'payable',
    type: 'constructor',
    inputs: [
      { name: '_logic', internalType: 'address', type: 'address' },
      { name: '_data', internalType: 'bytes', type: 'bytes' },
    ],
  },
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
  { stateMutability: 'payable', type: 'fallback' },
  { stateMutability: 'payable', type: 'receive' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC1967Upgrade
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc1967UpgradeABI = [
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
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20ABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: 'name_', internalType: 'string', type: 'string' },
      { name: 'symbol_', internalType: 'string', type: 'string' },
    ],
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
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ERC20Snapshot
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20SnapshotABI = [
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
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'Snapshot',
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
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'snapshotId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'balanceOfAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'snapshotId', internalType: 'uint256', type: 'uint256' }],
    name: 'totalSupplyAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// EntryPoint
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const entryPointABI = [
  {
    type: 'error',
    inputs: [
      { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
      { name: 'paid', internalType: 'uint256', type: 'uint256' },
      { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
      { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
      { name: 'targetSuccess', internalType: 'bool', type: 'bool' },
      { name: 'targetResult', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'ExecutionResult',
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
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
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
    ],
    name: 'ValidationResult',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
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
    name: 'ValidationResultWithAggregation',
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
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'SIG_VALIDATION_FAILED',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'initCode', internalType: 'bytes', type: 'bytes' },
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
    ],
    name: '_validateSenderAndPaymaster',
    outputs: [],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'deposits',
    outputs: [
      { name: 'deposit', internalType: 'uint112', type: 'uint112' },
      { name: 'staked', internalType: 'bool', type: 'bool' },
      { name: 'stake', internalType: 'uint112', type: 'uint112' },
      { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
      { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint112', type: 'uint112' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct UserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct UserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
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
              { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
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
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'nonceSequenceNumber',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'op',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'targetCallData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'simulateValidation',
    outputs: [],
  },
  { stateMutability: 'nonpayable', type: 'function', inputs: [], name: 'unlockStake', outputs: [] },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
  },
  { stateMutability: 'payable', type: 'receive' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IAccount
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iAccountABI = [
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'userOpHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'missingAccountFunds', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'validateUserOp',
    outputs: [{ name: 'validationData', internalType: 'uint256', type: 'uint256' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IAggregator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iAggregatorABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      {
        name: 'userOps',
        internalType: 'struct UserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'aggregateSignatures',
    outputs: [{ name: 'aggregatedSignature', internalType: 'bytes', type: 'bytes' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      {
        name: 'userOps',
        internalType: 'struct UserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'validateSignatures',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'validateUserOpSignature',
    outputs: [{ name: 'sigForUserOp', internalType: 'bytes', type: 'bytes' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IBeacon
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iBeaconABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'implementation',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC1271
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc1271ABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'hash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'signature', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'isValidSignature',
    outputs: [{ name: 'magicValue', internalType: 'bytes4', type: 'bytes4' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC1822Proxiable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc1822ProxiableABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc20ABI = [
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
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC20Metadata
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc20MetadataABI = [
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
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IERC20Permit
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ierc20PermitABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'DOMAIN_SEPARATOR',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'nonces',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'deadline', internalType: 'uint256', type: 'uint256' },
      { name: 'v', internalType: 'uint8', type: 'uint8' },
      { name: 'r', internalType: 'bytes32', type: 'bytes32' },
      { name: 's', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'permit',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IEntryPoint
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iEntryPointABI = [
  {
    type: 'error',
    inputs: [
      { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
      { name: 'paid', internalType: 'uint256', type: 'uint256' },
      { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
      { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
      { name: 'targetSuccess', internalType: 'bool', type: 'bool' },
      { name: 'targetResult', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'ExecutionResult',
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
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'SenderAddressResult',
  },
  {
    type: 'error',
    inputs: [{ name: 'aggregator', internalType: 'address', type: 'address' }],
    name: 'SignatureValidationFailed',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
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
    ],
    name: 'ValidationResult',
  },
  {
    type: 'error',
    inputs: [
      {
        name: 'returnInfo',
        internalType: 'struct IEntryPoint.ReturnInfo',
        type: 'tuple',
        components: [
          { name: 'preOpGas', internalType: 'uint256', type: 'uint256' },
          { name: 'prefund', internalType: 'uint256', type: 'uint256' },
          { name: 'sigFailed', internalType: 'bool', type: 'bool' },
          { name: 'validAfter', internalType: 'uint48', type: 'uint48' },
          { name: 'validUntil', internalType: 'uint48', type: 'uint48' },
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
    name: 'ValidationResultWithAggregation',
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
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint112', type: 'uint112' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'getSenderAddress',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'getUserOpHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'opsPerAggregator',
        internalType: 'struct IEntryPoint.UserOpsPerAggregator[]',
        type: 'tuple[]',
        components: [
          {
            name: 'userOps',
            internalType: 'struct UserOperation[]',
            type: 'tuple[]',
            components: [
              { name: 'sender', internalType: 'address', type: 'address' },
              { name: 'nonce', internalType: 'uint256', type: 'uint256' },
              { name: 'initCode', internalType: 'bytes', type: 'bytes' },
              { name: 'callData', internalType: 'bytes', type: 'bytes' },
              { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
              { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
              { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'ops',
        internalType: 'struct UserOperation[]',
        type: 'tuple[]',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'beneficiary', internalType: 'address payable', type: 'address' },
    ],
    name: 'handleOps',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'op',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'targetCallData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateHandleOp',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'paymasterAndData', internalType: 'bytes', type: 'bytes' },
          { name: 'signature', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'simulateValidation',
    outputs: [],
  },
  { stateMutability: 'nonpayable', type: 'function', inputs: [], name: 'unlockStake', outputs: [] },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMetaPaymaster
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iMetaPaymasterABI = [
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'target', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'fund',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IMulticall3
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iMulticall3ABI = [
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'aggregate',
    outputs: [
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
      { name: 'returnData', internalType: 'bytes[]', type: 'bytes[]' },
    ],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call3[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'allowFailure', internalType: 'bool', type: 'bool' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'aggregate3',
    outputs: [
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call3Value[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'allowFailure', internalType: 'bool', type: 'bool' },
          { name: 'value', internalType: 'uint256', type: 'uint256' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'aggregate3Value',
    outputs: [
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'blockAndAggregate',
    outputs: [
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
      { name: 'blockHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getBasefee',
    outputs: [{ name: 'basefee', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'blockNumber', internalType: 'uint256', type: 'uint256' }],
    name: 'getBlockHash',
    outputs: [{ name: 'blockHash', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getBlockNumber',
    outputs: [{ name: 'blockNumber', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getChainId',
    outputs: [{ name: 'chainid', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getCurrentBlockCoinbase',
    outputs: [{ name: 'coinbase', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getCurrentBlockDifficulty',
    outputs: [{ name: 'difficulty', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getCurrentBlockGasLimit',
    outputs: [{ name: 'gaslimit', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getCurrentBlockTimestamp',
    outputs: [{ name: 'timestamp', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'addr', internalType: 'address', type: 'address' }],
    name: 'getEthBalance',
    outputs: [{ name: 'balance', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getLastBlockHash',
    outputs: [{ name: 'blockHash', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'requireSuccess', internalType: 'bool', type: 'bool' },
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'tryAggregate',
    outputs: [
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'requireSuccess', internalType: 'bool', type: 'bool' },
      {
        name: 'calls',
        internalType: 'struct IMulticall3.Call[]',
        type: 'tuple[]',
        components: [
          { name: 'target', internalType: 'address', type: 'address' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
    name: 'tryBlockAndAggregate',
    outputs: [
      { name: 'blockNumber', internalType: 'uint256', type: 'uint256' },
      { name: 'blockHash', internalType: 'bytes32', type: 'bytes32' },
      {
        name: 'returnData',
        internalType: 'struct IMulticall3.Result[]',
        type: 'tuple[]',
        components: [
          { name: 'success', internalType: 'bool', type: 'bool' },
          { name: 'returnData', internalType: 'bytes', type: 'bytes' },
        ],
      },
    ],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// INonceManager
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iNonceManagerABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IPaymaster
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iPaymasterABI = [
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'mode', internalType: 'enum IPaymaster.PostOpMode', type: 'uint8' },
      { name: 'context', internalType: 'bytes', type: 'bytes' },
      { name: 'actualGasCost', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'postOp',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      {
        name: 'userOp',
        internalType: 'struct UserOperation',
        type: 'tuple',
        components: [
          { name: 'sender', internalType: 'address', type: 'address' },
          { name: 'nonce', internalType: 'uint256', type: 'uint256' },
          { name: 'initCode', internalType: 'bytes', type: 'bytes' },
          { name: 'callData', internalType: 'bytes', type: 'bytes' },
          { name: 'callGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'verificationGasLimit', internalType: 'uint256', type: 'uint256' },
          { name: 'preVerificationGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxFeePerGas', internalType: 'uint256', type: 'uint256' },
          { name: 'maxPriorityFeePerGas', internalType: 'uint256', type: 'uint256' },
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
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// IStakeManager
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const iStakeManagerABI = [
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
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: '_unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint112', type: 'uint112' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
  },
  { stateMutability: 'nonpayable', type: 'function', inputs: [], name: 'unlockStake', outputs: [] },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Initializable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const initializableABI = [
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
    name: 'Initialized',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// NonceManager
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const nonceManagerABI = [
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'key', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'getNonce',
    outputs: [{ name: 'nonce', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'key', internalType: 'uint192', type: 'uint192' }],
    name: 'incrementNonce',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'uint192', type: 'uint192' },
    ],
    name: 'nonceSequenceNumber',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Ownable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ownableABI = [
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
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// OwnableUpgradeable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ownableUpgradeableABI = [
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'version', internalType: 'uint8', type: 'uint8', indexed: false }],
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
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Proxy
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const proxyABI = [
  { stateMutability: 'payable', type: 'fallback' },
  { stateMutability: 'payable', type: 'receive' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Send
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export const sendABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: 'multisig', internalType: 'address', type: 'address' },
      { name: 'manager', internalType: 'address', type: 'address' },
      { name: 'knownBots', internalType: 'address[]', type: 'address[]' },
      { name: 'initialMaxBuy', internalType: 'uint256', type: 'uint256' },
    ],
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
    inputs: [{ name: 'id', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'Snapshot',
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
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_botDefence',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_botDefenceActivatedOnce',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: '_knownBots',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_manager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_maxBuy',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_multisig',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: '_totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'activateBotDefenceOnce',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_spender', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approveToken',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'account', internalType: 'address', type: 'address' },
      { name: 'snapshotId', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'balanceOfAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_newManager', internalType: 'address', type: 'address' }],
    name: 'changeOwner',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'createSnapshot',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'deactivateBotDefence',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getLatestSnapshot',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_newMaxBuy', internalType: 'uint256', type: 'uint256' }],
    name: 'modifyMaxBuy',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_bots', internalType: 'address[]', type: 'address[]' }],
    name: 'removeBots',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'snapshotId', internalType: 'uint256', type: 'uint256' }],
    name: 'totalSupplyAt',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_transferTo', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferToken',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_transferFrom', internalType: 'address', type: 'address' },
      { name: '_transferTo', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferTokenFrom',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address payable', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [],
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export const sendAddress = {
  1: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  1337: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
  8008: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export const sendConfig = { address: sendAddress, abi: sendABI } as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendAirdropsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendAirdropsSafeABI = [] as const

export const sendAirdropsSafeAddress = '0x6204Bc0662ccd8a9A762d59fe7906733f251E3b7' as const

export const sendAirdropsSafeConfig = {
  address: sendAirdropsSafeAddress,
  abi: sendAirdropsSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendContributorIncentivesSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendContributorIncentivesSafeABI = [] as const

export const sendContributorIncentivesSafeAddress =
  '0x4F30818f5c1a20803AB2075B813DBDE810e51b98' as const

export const sendContributorIncentivesSafeConfig = {
  address: sendContributorIncentivesSafeAddress,
  abi: sendContributorIncentivesSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendCoreTeamSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendCoreTeamSafeABI = [] as const

export const sendCoreTeamSafeAddress = '0xE52D0967A2eE242098d11c209f53C8158E329eCC' as const

export const sendCoreTeamSafeConfig = {
  address: sendCoreTeamSafeAddress,
  abi: sendCoreTeamSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendEXListingsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendExListingsSafeABI = [] as const

export const sendExListingsSafeAddress = '0xF530e6E60e7a65Ea717f843a8b2e6fcdC727aC9E' as const

export const sendExListingsSafeConfig = {
  address: sendExListingsSafeAddress,
  abi: sendExListingsSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendMerkleDrop
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const sendMerkleDropABI = [
  {
    stateMutability: 'nonpayable',
    type: 'constructor',
    inputs: [
      { name: '_token', internalType: 'contract IERC20', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
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
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_merkleRoot', internalType: 'bytes32', type: 'bytes32' },
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addTranche',
    outputs: [{ name: 'trancheId', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_trancheId', internalType: 'uint256', type: 'uint256' }],
    name: 'expireTranche',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: '_tranche', internalType: 'uint256', type: 'uint256' },
      { name: '_index', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'isClaimed',
    outputs: [{ name: 'claimed', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'merkleRoots',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'token',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheActive',
    outputs: [{ name: 'valid', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmount',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '_tranche', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmountClaimed',
    outputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmounts',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'trancheAmountsClaimed',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'trancheCursor',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newOwner', internalType: 'address', type: 'address' }],
    name: 'transferOwnership',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_tokenContract', internalType: 'address', type: 'address' },
      { name: '_transferTo', internalType: 'address', type: 'address' },
      { name: '_value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferToken',
    outputs: [],
  },
  {
    stateMutability: 'view',
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
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_amount', internalType: 'uint256', type: 'uint256' },
      { name: '_to', internalType: 'address payable', type: 'address' },
    ],
    name: 'withdraw',
    outputs: [],
  },
] as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const sendMerkleDropAddress = {
  1: '0xB9310daE45E71c7a160A13D64204623071a8E347',
  1337: '0xB9310daE45E71c7a160A13D64204623071a8E347',
  8008: '0xB9310daE45E71c7a160A13D64204623071a8E347',
} as const

/**
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export const sendMerkleDropConfig = {
  address: sendMerkleDropAddress,
  abi: sendMerkleDropABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendMultisigSignerPayoutsSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendMultisigSignerPayoutsSafeABI = [] as const

export const sendMultisigSignerPayoutsSafeAddress =
  '0x5355c409fa3D0901292231Ddb953C949C2211D96' as const

export const sendMultisigSignerPayoutsSafeConfig = {
  address: sendMultisigSignerPayoutsSafeAddress,
  abi: sendMultisigSignerPayoutsSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendRevenueSafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendRevenueSafeABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'owner', internalType: 'address', type: 'address', indexed: false }],
    name: 'AddedOwner',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'approvedHash', internalType: 'bytes32', type: 'bytes32', indexed: true },
      { name: 'owner', internalType: 'address', type: 'address', indexed: true },
    ],
    name: 'ApproveHash',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'handler', internalType: 'address', type: 'address', indexed: false }],
    name: 'ChangedFallbackHandler',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'guard', internalType: 'address', type: 'address', indexed: false }],
    name: 'ChangedGuard',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'threshold', internalType: 'uint256', type: 'uint256', indexed: false }],
    name: 'ChangedThreshold',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'module', internalType: 'address', type: 'address', indexed: false }],
    name: 'DisabledModule',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'module', internalType: 'address', type: 'address', indexed: false }],
    name: 'EnabledModule',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'txHash', internalType: 'bytes32', type: 'bytes32', indexed: false },
      { name: 'payment', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ExecutionFailure',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'module', internalType: 'address', type: 'address', indexed: true }],
    name: 'ExecutionFromModuleFailure',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'module', internalType: 'address', type: 'address', indexed: true }],
    name: 'ExecutionFromModuleSuccess',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'txHash', internalType: 'bytes32', type: 'bytes32', indexed: false },
      { name: 'payment', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'ExecutionSuccess',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'owner', internalType: 'address', type: 'address', indexed: false }],
    name: 'RemovedOwner',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address', indexed: true },
      { name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'SafeReceived',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'initiator', internalType: 'address', type: 'address', indexed: true },
      { name: 'owners', internalType: 'address[]', type: 'address[]', indexed: false },
      { name: 'threshold', internalType: 'uint256', type: 'uint256', indexed: false },
      { name: 'initializer', internalType: 'address', type: 'address', indexed: false },
      { name: 'fallbackHandler', internalType: 'address', type: 'address', indexed: false },
    ],
    name: 'SafeSetup',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'msgHash', internalType: 'bytes32', type: 'bytes32', indexed: true }],
    name: 'SignMsg',
  },
  { stateMutability: 'nonpayable', type: 'fallback' },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'VERSION',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: '_threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'addOwnerWithThreshold',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'hashToApprove', internalType: 'bytes32', type: 'bytes32' }],
    name: 'approveHash',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: '', internalType: 'address', type: 'address' },
      { name: '', internalType: 'bytes32', type: 'bytes32' },
    ],
    name: 'approvedHashes',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: '_threshold', internalType: 'uint256', type: 'uint256' }],
    name: 'changeThreshold',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'dataHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'signatures', internalType: 'bytes', type: 'bytes' },
      { name: 'requiredSignatures', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'checkNSignatures',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'dataHash', internalType: 'bytes32', type: 'bytes32' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'signatures', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'checkSignatures',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'prevModule', internalType: 'address', type: 'address' },
      { name: 'module', internalType: 'address', type: 'address' },
    ],
    name: 'disableModule',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'domainSeparator',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'module', internalType: 'address', type: 'address' }],
    name: 'enableModule',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
      { name: 'safeTxGas', internalType: 'uint256', type: 'uint256' },
      { name: 'baseGas', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'gasToken', internalType: 'address', type: 'address' },
      { name: 'refundReceiver', internalType: 'address', type: 'address' },
      { name: '_nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'encodeTransactionData',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
      { name: 'safeTxGas', internalType: 'uint256', type: 'uint256' },
      { name: 'baseGas', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'gasToken', internalType: 'address', type: 'address' },
      { name: 'refundReceiver', internalType: 'address payable', type: 'address' },
      { name: 'signatures', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'execTransaction',
    outputs: [{ name: 'success', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'execTransactionFromModule',
    outputs: [{ name: 'success', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'execTransactionFromModuleReturnData',
    outputs: [
      { name: 'success', internalType: 'bool', type: 'bool' },
      { name: 'returnData', internalType: 'bytes', type: 'bytes' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getChainId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'start', internalType: 'address', type: 'address' },
      { name: 'pageSize', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getModulesPaginated',
    outputs: [
      { name: 'array', internalType: 'address[]', type: 'address[]' },
      { name: 'next', internalType: 'address', type: 'address' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getOwners',
    outputs: [{ name: '', internalType: 'address[]', type: 'address[]' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'offset', internalType: 'uint256', type: 'uint256' },
      { name: 'length', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getStorageAt',
    outputs: [{ name: '', internalType: 'bytes', type: 'bytes' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'getThreshold',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
      { name: 'safeTxGas', internalType: 'uint256', type: 'uint256' },
      { name: 'baseGas', internalType: 'uint256', type: 'uint256' },
      { name: 'gasPrice', internalType: 'uint256', type: 'uint256' },
      { name: 'gasToken', internalType: 'address', type: 'address' },
      { name: 'refundReceiver', internalType: 'address', type: 'address' },
      { name: '_nonce', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'getTransactionHash',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'module', internalType: 'address', type: 'address' }],
    name: 'isModuleEnabled',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'owner', internalType: 'address', type: 'address' }],
    name: 'isOwner',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'nonce',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: '_threshold', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'removeOwner',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'operation', internalType: 'enum Enum.Operation', type: 'uint8' },
    ],
    name: 'requiredTxGas',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'handler', internalType: 'address', type: 'address' }],
    name: 'setFallbackHandler',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'guard', internalType: 'address', type: 'address' }],
    name: 'setGuard',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: '_owners', internalType: 'address[]', type: 'address[]' },
      { name: '_threshold', internalType: 'uint256', type: 'uint256' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
      { name: 'fallbackHandler', internalType: 'address', type: 'address' },
      { name: 'paymentToken', internalType: 'address', type: 'address' },
      { name: 'payment', internalType: 'uint256', type: 'uint256' },
      { name: 'paymentReceiver', internalType: 'address payable', type: 'address' },
    ],
    name: 'setup',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'signedMessages',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'targetContract', internalType: 'address', type: 'address' },
      { name: 'calldataPayload', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'simulateAndRevert',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'prevOwner', internalType: 'address', type: 'address' },
      { name: 'oldOwner', internalType: 'address', type: 'address' },
      { name: 'newOwner', internalType: 'address', type: 'address' },
    ],
    name: 'swapOwner',
    outputs: [],
  },
  { stateMutability: 'payable', type: 'receive' },
] as const

export const sendRevenueSafeAddress = '0xBB253919a15C5E0C9986d83f205A9279b4247E3d' as const

export const sendRevenueSafeConfig = {
  address: sendRevenueSafeAddress,
  abi: sendRevenueSafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendTreasurySafe
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendTreasurySafeABI = [] as const

export const sendTreasurySafeAddress = '0x4bB2f4c771ccB60723a78a974a2537AD339071c7' as const

export const sendTreasurySafeConfig = {
  address: sendTreasurySafeAddress,
  abi: sendTreasurySafeABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SendUniswapV3Pool
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const sendUniswapV3PoolABI = [] as const

export const sendUniswapV3PoolAddress = '0x14F59C715C205002c6e3F36766D302c1a19bacC8' as const

export const sendUniswapV3PoolConfig = {
  address: sendUniswapV3PoolAddress,
  abi: sendUniswapV3PoolABI,
} as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SenderCreator
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const senderCreatorABI = [
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'initCode', internalType: 'bytes', type: 'bytes' }],
    name: 'createSender',
    outputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// StakeManager
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const stakeManagerABI = [
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
      { name: 'account', internalType: 'address', type: 'address', indexed: true },
      { name: 'withdrawAddress', internalType: 'address', type: 'address', indexed: false },
      { name: 'amount', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Withdrawn',
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' }],
    name: 'addStake',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'depositTo',
    outputs: [],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: '', internalType: 'address', type: 'address' }],
    name: 'deposits',
    outputs: [
      { name: 'deposit', internalType: 'uint112', type: 'uint112' },
      { name: 'staked', internalType: 'bool', type: 'bool' },
      { name: 'stake', internalType: 'uint112', type: 'uint112' },
      { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
      { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
    ],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'getDepositInfo',
    outputs: [
      {
        name: 'info',
        internalType: 'struct IStakeManager.DepositInfo',
        type: 'tuple',
        components: [
          { name: 'deposit', internalType: 'uint112', type: 'uint112' },
          { name: 'staked', internalType: 'bool', type: 'bool' },
          { name: 'stake', internalType: 'uint112', type: 'uint112' },
          { name: 'unstakeDelaySec', internalType: 'uint32', type: 'uint32' },
          { name: 'withdrawTime', internalType: 'uint48', type: 'uint48' },
        ],
      },
    ],
  },
  { stateMutability: 'nonpayable', type: 'function', inputs: [], name: 'unlockStake', outputs: [] },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'withdrawAddress', internalType: 'address payable', type: 'address' }],
    name: 'withdrawStake',
    outputs: [],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'withdrawAddress', internalType: 'address payable', type: 'address' },
      { name: 'withdrawAmount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'withdrawTo',
    outputs: [],
  },
  { stateMutability: 'payable', type: 'receive' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TestUSDC
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const testUsdcABI = [
  { stateMutability: 'nonpayable', type: 'constructor', inputs: [] },
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
    stateMutability: 'view',
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'pure',
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'subtractedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'decreaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'addedValue', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'increaseAllowance',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
  },
  {
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// UUPSUpgradeable
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const uupsUpgradeableABI = [
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
    stateMutability: 'view',
    type: 'function',
    inputs: [],
    name: 'proxiableUUID',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
  },
  {
    stateMutability: 'nonpayable',
    type: 'function',
    inputs: [{ name: 'newImplementation', internalType: 'address', type: 'address' }],
    name: 'upgradeTo',
    outputs: [],
  },
  {
    stateMutability: 'payable',
    type: 'function',
    inputs: [
      { name: 'newImplementation', internalType: 'address', type: 'address' },
      { name: 'data', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'upgradeToAndCall',
    outputs: [],
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Utils
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const utilsABI = [
  {
    stateMutability: 'pure',
    type: 'function',
    inputs: [
      { name: 'challenge', internalType: 'bytes', type: 'bytes' },
      { name: 'r', internalType: 'uint256', type: 'uint256' },
      { name: 's', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'rawSignatureToSignature',
    outputs: [
      {
        name: '',
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
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Core
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link baseGoerliForkTestABI}__.
 */
export function getBaseGoerliForkTest(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: baseGoerliForkTestABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link baseGoerliForkTestABI}__.
 */
export function readBaseGoerliForkTest<
  TAbi extends readonly unknown[] = typeof baseGoerliForkTestABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: baseGoerliForkTestABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link baseGoerliForkTestABI}__.
 */
export function writeBaseGoerliForkTest<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof baseGoerliForkTestABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof baseGoerliForkTestABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: baseGoerliForkTestABI, ...config } as unknown as WriteContractArgs<
    typeof baseGoerliForkTestABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link baseGoerliForkTestABI}__.
 */
export function prepareWriteBaseGoerliForkTest<
  TAbi extends readonly unknown[] = typeof baseGoerliForkTestABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: baseGoerliForkTestABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link basePaymasterABI}__.
 */
export function getBasePaymaster(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: basePaymasterABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link basePaymasterABI}__.
 */
export function readBasePaymaster<
  TAbi extends readonly unknown[] = typeof basePaymasterABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: basePaymasterABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link basePaymasterABI}__.
 */
export function writeBasePaymaster<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof basePaymasterABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof basePaymasterABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: basePaymasterABI, ...config } as unknown as WriteContractArgs<
    typeof basePaymasterABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link basePaymasterABI}__.
 */
export function prepareWriteBasePaymaster<
  TAbi extends readonly unknown[] = typeof basePaymasterABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: basePaymasterABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link contextUpgradeableABI}__.
 */
export function getContextUpgradeable(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: contextUpgradeableABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoAccountABI}__.
 */
export function getDaimoAccount(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoAccountABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountABI}__.
 */
export function readDaimoAccount<
  TAbi extends readonly unknown[] = typeof daimoAccountABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoAccountABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountABI}__.
 */
export function writeDaimoAccount<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoAccountABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoAccountABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoAccountABI, ...config } as unknown as WriteContractArgs<
    typeof daimoAccountABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoAccountABI}__.
 */
export function prepareWriteDaimoAccount<
  TAbi extends readonly unknown[] = typeof daimoAccountABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoAccountABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoAccountFactoryABI}__.
 */
export function getDaimoAccountFactory(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoAccountFactoryABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoAccountFactoryABI}__.
 */
export function readDaimoAccountFactory<
  TAbi extends readonly unknown[] = typeof daimoAccountFactoryABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoAccountFactoryABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoAccountFactoryABI}__.
 */
export function writeDaimoAccountFactory<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoAccountFactoryABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoAccountFactoryABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoAccountFactoryABI, ...config } as unknown as WriteContractArgs<
    typeof daimoAccountFactoryABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoAccountFactoryABI}__.
 */
export function prepareWriteDaimoAccountFactory<
  TAbi extends readonly unknown[] = typeof daimoAccountFactoryABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoAccountFactoryABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoEphemeralNotesABI}__.
 */
export function getDaimoEphemeralNotes(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoEphemeralNotesABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoEphemeralNotesABI}__.
 */
export function readDaimoEphemeralNotes<
  TAbi extends readonly unknown[] = typeof daimoEphemeralNotesABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoEphemeralNotesABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoEphemeralNotesABI}__.
 */
export function writeDaimoEphemeralNotes<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoEphemeralNotesABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoEphemeralNotesABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoEphemeralNotesABI, ...config } as unknown as WriteContractArgs<
    typeof daimoEphemeralNotesABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoEphemeralNotesABI}__.
 */
export function prepareWriteDaimoEphemeralNotes<
  TAbi extends readonly unknown[] = typeof daimoEphemeralNotesABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoEphemeralNotesABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoNameRegistryABI}__.
 */
export function getDaimoNameRegistry(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoNameRegistryABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoNameRegistryABI}__.
 */
export function readDaimoNameRegistry<
  TAbi extends readonly unknown[] = typeof daimoNameRegistryABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoNameRegistryABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoNameRegistryABI}__.
 */
export function writeDaimoNameRegistry<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoNameRegistryABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoNameRegistryABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoNameRegistryABI, ...config } as unknown as WriteContractArgs<
    typeof daimoNameRegistryABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoNameRegistryABI}__.
 */
export function prepareWriteDaimoNameRegistry<
  TAbi extends readonly unknown[] = typeof daimoNameRegistryABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoNameRegistryABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoNameRegistryProxyABI}__.
 */
export function getDaimoNameRegistryProxy(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoNameRegistryProxyABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoPaymasterABI}__.
 */
export function getDaimoPaymaster(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoPaymasterABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoPaymasterABI}__.
 */
export function readDaimoPaymaster<
  TAbi extends readonly unknown[] = typeof daimoPaymasterABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoPaymasterABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoPaymasterABI}__.
 */
export function writeDaimoPaymaster<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoPaymasterABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoPaymasterABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoPaymasterABI, ...config } as unknown as WriteContractArgs<
    typeof daimoPaymasterABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoPaymasterABI}__.
 */
export function prepareWriteDaimoPaymaster<
  TAbi extends readonly unknown[] = typeof daimoPaymasterABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoPaymasterABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoVerifierABI}__.
 */
export function getDaimoVerifier(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoVerifierABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link daimoVerifierABI}__.
 */
export function readDaimoVerifier<
  TAbi extends readonly unknown[] = typeof daimoVerifierABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: daimoVerifierABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link daimoVerifierABI}__.
 */
export function writeDaimoVerifier<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof daimoVerifierABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof daimoVerifierABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: daimoVerifierABI, ...config } as unknown as WriteContractArgs<
    typeof daimoVerifierABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link daimoVerifierABI}__.
 */
export function prepareWriteDaimoVerifier<
  TAbi extends readonly unknown[] = typeof daimoVerifierABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: daimoVerifierABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link daimoVerifierProxyABI}__.
 */
export function getDaimoVerifierProxy(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: daimoVerifierProxyABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link erc1967ProxyABI}__.
 */
export function getErc1967Proxy(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: erc1967ProxyABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link erc1967UpgradeABI}__.
 */
export function getErc1967Upgrade(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: erc1967UpgradeABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link erc20ABI}__.
 */
export function getErc20(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: erc20ABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20ABI}__.
 */
export function readErc20<
  TAbi extends readonly unknown[] = typeof erc20ABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: erc20ABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20ABI}__.
 */
export function writeErc20<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof erc20ABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof erc20ABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: erc20ABI, ...config } as unknown as WriteContractArgs<
    typeof erc20ABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link erc20ABI}__.
 */
export function prepareWriteErc20<
  TAbi extends readonly unknown[] = typeof erc20ABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({ abi: erc20ABI, ...config } as unknown as PrepareWriteContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link erc20SnapshotABI}__.
 */
export function getErc20Snapshot(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: erc20SnapshotABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link erc20SnapshotABI}__.
 */
export function readErc20Snapshot<
  TAbi extends readonly unknown[] = typeof erc20SnapshotABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: erc20SnapshotABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link erc20SnapshotABI}__.
 */
export function writeErc20Snapshot<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof erc20SnapshotABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof erc20SnapshotABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: erc20SnapshotABI, ...config } as unknown as WriteContractArgs<
    typeof erc20SnapshotABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link erc20SnapshotABI}__.
 */
export function prepareWriteErc20Snapshot<
  TAbi extends readonly unknown[] = typeof erc20SnapshotABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: erc20SnapshotABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link entryPointABI}__.
 */
export function getEntryPoint(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: entryPointABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link entryPointABI}__.
 */
export function readEntryPoint<
  TAbi extends readonly unknown[] = typeof entryPointABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: entryPointABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link entryPointABI}__.
 */
export function writeEntryPoint<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof entryPointABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof entryPointABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: entryPointABI, ...config } as unknown as WriteContractArgs<
    typeof entryPointABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link entryPointABI}__.
 */
export function prepareWriteEntryPoint<
  TAbi extends readonly unknown[] = typeof entryPointABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: entryPointABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iAccountABI}__.
 */
export function getIAccount(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iAccountABI, ...config })
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iAccountABI}__.
 */
export function writeIAccount<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iAccountABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iAccountABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iAccountABI, ...config } as unknown as WriteContractArgs<
    typeof iAccountABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iAccountABI}__.
 */
export function prepareWriteIAccount<
  TAbi extends readonly unknown[] = typeof iAccountABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iAccountABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iAggregatorABI}__.
 */
export function getIAggregator(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iAggregatorABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iAggregatorABI}__.
 */
export function readIAggregator<
  TAbi extends readonly unknown[] = typeof iAggregatorABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: iAggregatorABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iBeaconABI}__.
 */
export function getIBeacon(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iBeaconABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iBeaconABI}__.
 */
export function readIBeacon<
  TAbi extends readonly unknown[] = typeof iBeaconABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: iBeaconABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ierc1271ABI}__.
 */
export function getIerc1271(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ierc1271ABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ierc1271ABI}__.
 */
export function readIerc1271<
  TAbi extends readonly unknown[] = typeof ierc1271ABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ierc1271ABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ierc1822ProxiableABI}__.
 */
export function getIerc1822Proxiable(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ierc1822ProxiableABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ierc1822ProxiableABI}__.
 */
export function readIerc1822Proxiable<
  TAbi extends readonly unknown[] = typeof ierc1822ProxiableABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ierc1822ProxiableABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ierc20ABI}__.
 */
export function getIerc20(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ierc20ABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ierc20ABI}__.
 */
export function readIerc20<
  TAbi extends readonly unknown[] = typeof ierc20ABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ierc20ABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link ierc20ABI}__.
 */
export function writeIerc20<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof ierc20ABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof ierc20ABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: ierc20ABI, ...config } as unknown as WriteContractArgs<
    typeof ierc20ABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link ierc20ABI}__.
 */
export function prepareWriteIerc20<
  TAbi extends readonly unknown[] = typeof ierc20ABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: ierc20ABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ierc20MetadataABI}__.
 */
export function getIerc20Metadata(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ierc20MetadataABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ierc20MetadataABI}__.
 */
export function readIerc20Metadata<
  TAbi extends readonly unknown[] = typeof ierc20MetadataABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ierc20MetadataABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link ierc20MetadataABI}__.
 */
export function writeIerc20Metadata<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof ierc20MetadataABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof ierc20MetadataABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: ierc20MetadataABI, ...config } as unknown as WriteContractArgs<
    typeof ierc20MetadataABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link ierc20MetadataABI}__.
 */
export function prepareWriteIerc20Metadata<
  TAbi extends readonly unknown[] = typeof ierc20MetadataABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: ierc20MetadataABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ierc20PermitABI}__.
 */
export function getIerc20Permit(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ierc20PermitABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ierc20PermitABI}__.
 */
export function readIerc20Permit<
  TAbi extends readonly unknown[] = typeof ierc20PermitABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ierc20PermitABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link ierc20PermitABI}__.
 */
export function writeIerc20Permit<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof ierc20PermitABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof ierc20PermitABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: ierc20PermitABI, ...config } as unknown as WriteContractArgs<
    typeof ierc20PermitABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link ierc20PermitABI}__.
 */
export function prepareWriteIerc20Permit<
  TAbi extends readonly unknown[] = typeof ierc20PermitABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: ierc20PermitABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iEntryPointABI}__.
 */
export function getIEntryPoint(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iEntryPointABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iEntryPointABI}__.
 */
export function readIEntryPoint<
  TAbi extends readonly unknown[] = typeof iEntryPointABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: iEntryPointABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iEntryPointABI}__.
 */
export function writeIEntryPoint<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iEntryPointABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iEntryPointABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iEntryPointABI, ...config } as unknown as WriteContractArgs<
    typeof iEntryPointABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iEntryPointABI}__.
 */
export function prepareWriteIEntryPoint<
  TAbi extends readonly unknown[] = typeof iEntryPointABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iEntryPointABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iMetaPaymasterABI}__.
 */
export function getIMetaPaymaster(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iMetaPaymasterABI, ...config })
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iMetaPaymasterABI}__.
 */
export function writeIMetaPaymaster<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iMetaPaymasterABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iMetaPaymasterABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iMetaPaymasterABI, ...config } as unknown as WriteContractArgs<
    typeof iMetaPaymasterABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iMetaPaymasterABI}__.
 */
export function prepareWriteIMetaPaymaster<
  TAbi extends readonly unknown[] = typeof iMetaPaymasterABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iMetaPaymasterABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function getIMulticall3(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iMulticall3ABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function readIMulticall3<
  TAbi extends readonly unknown[] = typeof iMulticall3ABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: iMulticall3ABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function writeIMulticall3<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iMulticall3ABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iMulticall3ABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iMulticall3ABI, ...config } as unknown as WriteContractArgs<
    typeof iMulticall3ABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iMulticall3ABI}__.
 */
export function prepareWriteIMulticall3<
  TAbi extends readonly unknown[] = typeof iMulticall3ABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iMulticall3ABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iNonceManagerABI}__.
 */
export function getINonceManager(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iNonceManagerABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iNonceManagerABI}__.
 */
export function readINonceManager<
  TAbi extends readonly unknown[] = typeof iNonceManagerABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: iNonceManagerABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iNonceManagerABI}__.
 */
export function writeINonceManager<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iNonceManagerABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iNonceManagerABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iNonceManagerABI, ...config } as unknown as WriteContractArgs<
    typeof iNonceManagerABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iNonceManagerABI}__.
 */
export function prepareWriteINonceManager<
  TAbi extends readonly unknown[] = typeof iNonceManagerABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iNonceManagerABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iPaymasterABI}__.
 */
export function getIPaymaster(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iPaymasterABI, ...config })
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iPaymasterABI}__.
 */
export function writeIPaymaster<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iPaymasterABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iPaymasterABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iPaymasterABI, ...config } as unknown as WriteContractArgs<
    typeof iPaymasterABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iPaymasterABI}__.
 */
export function prepareWriteIPaymaster<
  TAbi extends readonly unknown[] = typeof iPaymasterABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iPaymasterABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link iStakeManagerABI}__.
 */
export function getIStakeManager(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: iStakeManagerABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link iStakeManagerABI}__.
 */
export function readIStakeManager<
  TAbi extends readonly unknown[] = typeof iStakeManagerABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: iStakeManagerABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link iStakeManagerABI}__.
 */
export function writeIStakeManager<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof iStakeManagerABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof iStakeManagerABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: iStakeManagerABI, ...config } as unknown as WriteContractArgs<
    typeof iStakeManagerABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link iStakeManagerABI}__.
 */
export function prepareWriteIStakeManager<
  TAbi extends readonly unknown[] = typeof iStakeManagerABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: iStakeManagerABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link initializableABI}__.
 */
export function getInitializable(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: initializableABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link nonceManagerABI}__.
 */
export function getNonceManager(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: nonceManagerABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link nonceManagerABI}__.
 */
export function readNonceManager<
  TAbi extends readonly unknown[] = typeof nonceManagerABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: nonceManagerABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link nonceManagerABI}__.
 */
export function writeNonceManager<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof nonceManagerABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof nonceManagerABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: nonceManagerABI, ...config } as unknown as WriteContractArgs<
    typeof nonceManagerABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link nonceManagerABI}__.
 */
export function prepareWriteNonceManager<
  TAbi extends readonly unknown[] = typeof nonceManagerABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: nonceManagerABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ownableABI}__.
 */
export function getOwnable(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ownableABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ownableABI}__.
 */
export function readOwnable<
  TAbi extends readonly unknown[] = typeof ownableABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ownableABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link ownableABI}__.
 */
export function writeOwnable<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof ownableABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof ownableABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: ownableABI, ...config } as unknown as WriteContractArgs<
    typeof ownableABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link ownableABI}__.
 */
export function prepareWriteOwnable<
  TAbi extends readonly unknown[] = typeof ownableABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: ownableABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link ownableUpgradeableABI}__.
 */
export function getOwnableUpgradeable(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: ownableUpgradeableABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link ownableUpgradeableABI}__.
 */
export function readOwnableUpgradeable<
  TAbi extends readonly unknown[] = typeof ownableUpgradeableABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: ownableUpgradeableABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link ownableUpgradeableABI}__.
 */
export function writeOwnableUpgradeable<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof ownableUpgradeableABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof ownableUpgradeableABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: ownableUpgradeableABI, ...config } as unknown as WriteContractArgs<
    typeof ownableUpgradeableABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link ownableUpgradeableABI}__.
 */
export function prepareWriteOwnableUpgradeable<
  TAbi extends readonly unknown[] = typeof ownableUpgradeableABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: ownableUpgradeableABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link proxyABI}__.
 */
export function getProxy(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: proxyABI, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export function getSend(
  config: Omit<GetContractArgs, 'abi' | 'address'> & { chainId?: keyof typeof sendAddress }
) {
  return getContract({
    abi: sendABI,
    address: sendAddress[config.chainId as keyof typeof sendAddress],
    ...config,
  })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export function readSend<
  TAbi extends readonly unknown[] = typeof sendABI,
  TFunctionName extends string = string
>(
  config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof sendAddress
  }
) {
  return readContract({
    abi: sendABI,
    address: sendAddress[config.chainId as keyof typeof sendAddress],
    ...config,
  } as unknown as ReadContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export function writeSend<
  TFunctionName extends string,
  TMode extends WriteContractMode,
  TChainId extends number = keyof typeof sendAddress
>(
  config:
    | (Omit<WriteContractPreparedArgs<typeof sendABI, TFunctionName>, 'abi' | 'address'> & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof sendAddress
      })
    | (Omit<WriteContractUnpreparedArgs<typeof sendABI, TFunctionName>, 'abi' | 'address'> & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof sendAddress
      })
) {
  return writeContract({
    abi: sendABI,
    address: sendAddress[config.chainId as keyof typeof sendAddress],
    ...config,
  } as unknown as WriteContractArgs<typeof sendABI, TFunctionName>)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link sendABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A)
 * -
 */
export function prepareWriteSend<
  TAbi extends readonly unknown[] = typeof sendABI,
  TFunctionName extends string = string
>(
  config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof sendAddress
  }
) {
  return prepareWriteContract({
    abi: sendABI,
    address: sendAddress[config.chainId as keyof typeof sendAddress],
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendAirdropsSafeABI}__.
 */
export function getSendAirdropsSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendAirdropsSafeABI, address: sendAirdropsSafeAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendContributorIncentivesSafeABI}__.
 */
export function getSendContributorIncentivesSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({
    abi: sendContributorIncentivesSafeABI,
    address: sendContributorIncentivesSafeAddress,
    ...config,
  })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendCoreTeamSafeABI}__.
 */
export function getSendCoreTeamSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendCoreTeamSafeABI, address: sendCoreTeamSafeAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendExListingsSafeABI}__.
 */
export function getSendExListingsSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendExListingsSafeABI, address: sendExListingsSafeAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendMerkleDropABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export function getSendMerkleDrop(
  config: Omit<GetContractArgs, 'abi' | 'address'> & {
    chainId?: keyof typeof sendMerkleDropAddress
  }
) {
  return getContract({
    abi: sendMerkleDropABI,
    address: sendMerkleDropAddress[config.chainId as keyof typeof sendMerkleDropAddress],
    ...config,
  })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendMerkleDropABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export function readSendMerkleDrop<
  TAbi extends readonly unknown[] = typeof sendMerkleDropABI,
  TFunctionName extends string = string
>(
  config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof sendMerkleDropAddress
  }
) {
  return readContract({
    abi: sendMerkleDropABI,
    address: sendMerkleDropAddress[config.chainId as keyof typeof sendMerkleDropAddress],
    ...config,
  } as unknown as ReadContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendMerkleDropABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export function writeSendMerkleDrop<
  TFunctionName extends string,
  TMode extends WriteContractMode,
  TChainId extends number = keyof typeof sendMerkleDropAddress
>(
  config:
    | (Omit<
        WriteContractPreparedArgs<typeof sendMerkleDropABI, TFunctionName>,
        'abi' | 'address'
      > & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof sendMerkleDropAddress
      })
    | (Omit<
        WriteContractUnpreparedArgs<typeof sendMerkleDropABI, TFunctionName>,
        'abi' | 'address'
      > & {
        mode: TMode
        chainId?: TMode extends 'prepared' ? TChainId : keyof typeof sendMerkleDropAddress
      })
) {
  return writeContract({
    abi: sendMerkleDropABI,
    address: sendMerkleDropAddress[config.chainId as keyof typeof sendMerkleDropAddress],
    ...config,
  } as unknown as WriteContractArgs<typeof sendMerkleDropABI, TFunctionName>)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link sendMerkleDropABI}__.
 *
 * - [__View Contract on Ethereum Etherscan__](https://etherscan.io/address/0xB9310daE45E71c7a160A13D64204623071a8E347)
 * -
 */
export function prepareWriteSendMerkleDrop<
  TAbi extends readonly unknown[] = typeof sendMerkleDropABI,
  TFunctionName extends string = string
>(
  config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi' | 'address'> & {
    chainId?: keyof typeof sendMerkleDropAddress
  }
) {
  return prepareWriteContract({
    abi: sendMerkleDropABI,
    address: sendMerkleDropAddress[config.chainId as keyof typeof sendMerkleDropAddress],
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendMultisigSignerPayoutsSafeABI}__.
 */
export function getSendMultisigSignerPayoutsSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({
    abi: sendMultisigSignerPayoutsSafeABI,
    address: sendMultisigSignerPayoutsSafeAddress,
    ...config,
  })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendRevenueSafeABI}__.
 */
export function getSendRevenueSafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendRevenueSafeABI, address: sendRevenueSafeAddress, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link sendRevenueSafeABI}__.
 */
export function readSendRevenueSafe<
  TAbi extends readonly unknown[] = typeof sendRevenueSafeABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi' | 'address'>) {
  return readContract({
    abi: sendRevenueSafeABI,
    address: sendRevenueSafeAddress,
    ...config,
  } as unknown as ReadContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link sendRevenueSafeABI}__.
 */
export function writeSendRevenueSafe<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof sendRevenueSafeABI, TFunctionName>, 'abi' | 'address'>
    | Omit<WriteContractUnpreparedArgs<typeof sendRevenueSafeABI, TFunctionName>, 'abi' | 'address'>
) {
  return writeContract({
    abi: sendRevenueSafeABI,
    address: sendRevenueSafeAddress,
    ...config,
  } as unknown as WriteContractArgs<typeof sendRevenueSafeABI, TFunctionName>)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link sendRevenueSafeABI}__.
 */
export function prepareWriteSendRevenueSafe<
  TAbi extends readonly unknown[] = typeof sendRevenueSafeABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi' | 'address'>) {
  return prepareWriteContract({
    abi: sendRevenueSafeABI,
    address: sendRevenueSafeAddress,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendTreasurySafeABI}__.
 */
export function getSendTreasurySafe(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendTreasurySafeABI, address: sendTreasurySafeAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link sendUniswapV3PoolABI}__.
 */
export function getSendUniswapV3Pool(config: Omit<GetContractArgs, 'abi' | 'address'>) {
  return getContract({ abi: sendUniswapV3PoolABI, address: sendUniswapV3PoolAddress, ...config })
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link senderCreatorABI}__.
 */
export function getSenderCreator(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: senderCreatorABI, ...config })
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link senderCreatorABI}__.
 */
export function writeSenderCreator<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof senderCreatorABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof senderCreatorABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: senderCreatorABI, ...config } as unknown as WriteContractArgs<
    typeof senderCreatorABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link senderCreatorABI}__.
 */
export function prepareWriteSenderCreator<
  TAbi extends readonly unknown[] = typeof senderCreatorABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: senderCreatorABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link stakeManagerABI}__.
 */
export function getStakeManager(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: stakeManagerABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link stakeManagerABI}__.
 */
export function readStakeManager<
  TAbi extends readonly unknown[] = typeof stakeManagerABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: stakeManagerABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link stakeManagerABI}__.
 */
export function writeStakeManager<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof stakeManagerABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof stakeManagerABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: stakeManagerABI, ...config } as unknown as WriteContractArgs<
    typeof stakeManagerABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link stakeManagerABI}__.
 */
export function prepareWriteStakeManager<
  TAbi extends readonly unknown[] = typeof stakeManagerABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: stakeManagerABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link testUsdcABI}__.
 */
export function getTestUsdc(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: testUsdcABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link testUsdcABI}__.
 */
export function readTestUsdc<
  TAbi extends readonly unknown[] = typeof testUsdcABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: testUsdcABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link testUsdcABI}__.
 */
export function writeTestUsdc<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof testUsdcABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof testUsdcABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: testUsdcABI, ...config } as unknown as WriteContractArgs<
    typeof testUsdcABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link testUsdcABI}__.
 */
export function prepareWriteTestUsdc<
  TAbi extends readonly unknown[] = typeof testUsdcABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: testUsdcABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link uupsUpgradeableABI}__.
 */
export function getUupsUpgradeable(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: uupsUpgradeableABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link uupsUpgradeableABI}__.
 */
export function readUupsUpgradeable<
  TAbi extends readonly unknown[] = typeof uupsUpgradeableABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: uupsUpgradeableABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}

/**
 * Wraps __{@link writeContract}__ with `abi` set to __{@link uupsUpgradeableABI}__.
 */
export function writeUupsUpgradeable<TFunctionName extends string>(
  config:
    | Omit<WriteContractPreparedArgs<typeof uupsUpgradeableABI, TFunctionName>, 'abi'>
    | Omit<WriteContractUnpreparedArgs<typeof uupsUpgradeableABI, TFunctionName>, 'abi'>
) {
  return writeContract({ abi: uupsUpgradeableABI, ...config } as unknown as WriteContractArgs<
    typeof uupsUpgradeableABI,
    TFunctionName
  >)
}

/**
 * Wraps __{@link prepareWriteContract}__ with `abi` set to __{@link uupsUpgradeableABI}__.
 */
export function prepareWriteUupsUpgradeable<
  TAbi extends readonly unknown[] = typeof uupsUpgradeableABI,
  TFunctionName extends string = string
>(config: Omit<PrepareWriteContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return prepareWriteContract({
    abi: uupsUpgradeableABI,
    ...config,
  } as unknown as PrepareWriteContractConfig<TAbi, TFunctionName>)
}

/**
 * Wraps __{@link getContract}__ with `abi` set to __{@link utilsABI}__.
 */
export function getUtils(config: Omit<GetContractArgs, 'abi'>) {
  return getContract({ abi: utilsABI, ...config })
}

/**
 * Wraps __{@link readContract}__ with `abi` set to __{@link utilsABI}__.
 */
export function readUtils<
  TAbi extends readonly unknown[] = typeof utilsABI,
  TFunctionName extends string = string
>(config: Omit<ReadContractConfig<TAbi, TFunctionName>, 'abi'>) {
  return readContract({ abi: utilsABI, ...config } as unknown as ReadContractConfig<
    TAbi,
    TFunctionName
  >)
}
